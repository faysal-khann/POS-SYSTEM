from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.sale import Sale
from ..models.sale_return import SaleReturn
from ..models.cashier_shift import CashierShift
from ..schemas.cashier_shift import (
    ShiftSummaryOut, CashierShiftCreate, CashierShiftOut,
)

router = APIRouter(prefix="/cashier-shifts", tags=["Cashier Shifts"])


def _naive_utc(dt: datetime) -> datetime:
    """Sales.SaleDate is stored as naive UTC, so compare against naive UTC."""
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _utc_to_server_local(dt_utc: datetime) -> datetime:
    """SaleReturns.ReturnDate defaults to SQL Server's local clock (GETDATE),
    not UTC, so its window has to be shifted to the server's local time."""
    return dt_utc.replace(tzinfo=timezone.utc).astimezone().replace(tzinfo=None)


def _compute_summary(db: Session, user_id: int, branch_id: int,
                     start_utc: datetime, end_utc: datetime) -> dict:
    # cash actually kept = amount handed over minus change given back
    collected = func.coalesce(Sale.ReceivedAmount, 0) - func.coalesce(Sale.ChangeAmount, 0)
    sale_filter = [
        Sale.Status == "Completed",
        Sale.UserID == user_id,
        Sale.BranchID == branch_id,
        Sale.SaleDate >= start_utc,
        Sale.SaleDate < end_utc,
    ]

    total_sales, total_received = (
        db.query(func.coalesce(func.sum(Sale.GrandTotal), 0), func.coalesce(func.sum(collected), 0))
        .filter(*sale_filter)
        .one()
    )
    cash_sales = (
        db.query(func.coalesce(func.sum(collected), 0))
        .filter(*sale_filter, Sale.PaymentMethod == "Cash")
        .scalar()
    )

    r_start, r_end = _utc_to_server_local(start_utc), _utc_to_server_local(end_utc)
    return_filter = [
        SaleReturn.UserID == user_id,
        SaleReturn.BranchID == branch_id,
        SaleReturn.ReturnDate >= r_start,
        SaleReturn.ReturnDate < r_end,
    ]
    total_returns = (
        db.query(func.coalesce(func.sum(SaleReturn.GrandTotal), 0))
        .filter(*return_filter)
        .scalar()
    )
    cash_refunds = (
        db.query(func.coalesce(func.sum(SaleReturn.GrandTotal), 0))
        .filter(*return_filter, SaleReturn.RefundMethod == "Cash")
        .scalar()
    )

    total_sales, total_returns = float(total_sales), float(total_returns)
    return {
        "TotalSales": round(total_sales, 2),
        "TotalReturns": round(total_returns, 2),
        "NetSales": round(total_sales - total_returns, 2),
        "TotalReceived": round(float(total_received), 2),
        "CashSales": round(float(cash_sales), 2),
        "CashRefunds": round(float(cash_refunds), 2),
    }


@router.get("/summary", response_model=ShiftSummaryOut)
def get_shift_summary(
    user_id: int = Query(...),
    branch_id: int = Query(...),
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: Session = Depends(get_db),
):
    start_utc, end_utc = _naive_utc(start), _naive_utc(end)
    if end_utc <= start_utc:
        raise HTTPException(status_code=400, detail="Shift end must be after its start.")
    return _compute_summary(db, user_id, branch_id, start_utc, end_utc)


@router.post("/", response_model=CashierShiftOut)
def close_shift(payload: CashierShiftCreate, db: Session = Depends(get_db)):
    start_utc, end_utc = _naive_utc(payload.WindowStart), _naive_utc(payload.WindowEnd)
    if end_utc <= start_utc:
        raise HTTPException(status_code=400, detail="Shift end must be after its start.")

    already = (
        db.query(CashierShift.ShiftID)
        .filter(
            CashierShift.UserID == payload.UserID,
            CashierShift.BranchID == payload.BranchID,
            CashierShift.ShiftDate == payload.ShiftDate,
            CashierShift.ShiftName == payload.ShiftName,
        )
        .first()
    )
    if already:
        raise HTTPException(status_code=400, detail="This shift has already been closed.")

    # Totals are recalculated here rather than trusted from the app
    s = _compute_summary(db, payload.UserID, payload.BranchID, start_utc, end_utc)
    calculated = round(payload.OpeningBalance + s["CashSales"] - s["CashRefunds"], 2)
    difference = round(payload.ActualClosing - calculated, 2)

    shift = CashierShift(
        CompanyID=payload.CompanyID,
        BranchID=payload.BranchID,
        UserID=payload.UserID,
        ClosedByUserID=payload.ClosedByUserID,
        ShiftName=payload.ShiftName,
        ShiftDate=payload.ShiftDate,
        StartTime=start_utc,
        EndTime=end_utc,
        OpeningBalance=payload.OpeningBalance,
        TotalSales=s["TotalSales"],
        TotalReturns=s["TotalReturns"],
        NetSales=s["NetSales"],
        TotalReceived=s["TotalReceived"],
        CashSales=s["CashSales"],
        CashRefunds=s["CashRefunds"],
        CalculatedClosing=calculated,
        ActualClosing=payload.ActualClosing,
        Difference=difference,
        Note=(payload.Note or None),
        Status="Closed",
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)

    return CashierShiftOut(
        ShiftID=shift.ShiftID,
        CalculatedClosing=calculated,
        ActualClosing=payload.ActualClosing,
        Difference=difference,
    )