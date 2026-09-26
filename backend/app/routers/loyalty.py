from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models.customer import Customer
from ..models.loyalty import LoyaltyTransaction
from ..models.user import User
from ..schemas.loyalty import LoyaltyAdjustCreate, LoyaltyHistoryItem, LoyaltySummaryItem

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])

VALID_ACTION_TYPES = {"Earn", "Redeem", "Adjust"}


@router.get("/summary", response_model=List[LoyaltySummaryItem])
def get_loyalty_summary(db: Session = Depends(get_db)):
    """One row per customer: total earned, used, and what's left."""
    P = LoyaltyTransaction.Points
    totals = (
        db.query(
            LoyaltyTransaction.CustomerID.label("cid"),
            func.coalesce(func.sum(case((P > 0, P), else_=0)), 0).label("earned"),
            func.coalesce(func.sum(case((P < 0, -P), else_=0)), 0).label("used"),
        )
        .group_by(LoyaltyTransaction.CustomerID)
        .subquery()
    )

    rows = (
        db.query(Customer, totals.c.earned, totals.c.used)
        .outerjoin(totals, totals.c.cid == Customer.CustomerId)
        .order_by(Customer.CustomerCode)
        .all()
    )

    result = []
    for c, earned, used in rows:
        earned, used = int(earned or 0), int(used or 0)
        result.append(LoyaltySummaryItem(
            CustomerId=c.CustomerId,
            CustomerCode=c.CustomerCode,
            CustomerName=c.CustomerName,
            TotalPoints=earned,
            UsedPoints=used,
            AvailablePoints=earned - used,
            Status=c.Status or "Active",
        ))
    return result


def _generate_ref_no(db: Session) -> str:
    """Manual adjustments/redemptions made from this screen get an ADJ-YYMM### ref no."""
    period = date.today().strftime("%y%m")
    prefix = f"ADJ-{period}"
    count = (
        db.query(func.count(LoyaltyTransaction.LoyaltyTransactionID))
        .filter(LoyaltyTransaction.RefNo.like(f"{prefix}%"))
        .scalar()
    )
    return f"{prefix}{(count or 0) + 1:03d}"


@router.get("/history/{customer_id}", response_model=List[LoyaltyHistoryItem])
def get_loyalty_history(customer_id: int, db: Session = Depends(get_db)):
    """Newest-first transaction log for one customer."""
    if not db.query(Customer).filter(Customer.CustomerId == customer_id).first():
        raise HTTPException(status_code=404, detail="Customer not found")

    rows = (
        db.query(LoyaltyTransaction)
        .options(joinedload(LoyaltyTransaction.created_by))
        .filter(LoyaltyTransaction.CustomerID == customer_id)
        .order_by(LoyaltyTransaction.CreatedAt.desc(), LoyaltyTransaction.LoyaltyTransactionID.desc())
        .all()
    )

    return [
        LoyaltyHistoryItem(
            LoyaltyTransactionID=t.LoyaltyTransactionID,
            Date=t.CreatedAt,
            RefNo=t.RefNo,
            TransactionType=t.TransactionType,
            Points=t.Points,
            Description=t.Description,
            By=t.created_by.FullName if getattr(t, "created_by", None) else None,
        )
        for t in rows
    ]


@router.post("/adjust", response_model=LoyaltyHistoryItem)
def adjust_loyalty_points(payload: LoyaltyAdjustCreate, db: Session = Depends(get_db)):
    """Manually earn, redeem, or adjust a customer's points from the Loyalty screen."""
    if payload.ActionType not in VALID_ACTION_TYPES:
        raise HTTPException(status_code=400, detail="Invalid action type")
    if payload.Points == 0:
        raise HTTPException(status_code=400, detail="Points must not be zero")

    customer = db.query(Customer).filter(Customer.CustomerId == payload.CustomerID).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Redeem always subtracts; Earn/Adjust use the sign the user entered
    signed_points = -abs(payload.Points) if payload.ActionType == "Redeem" else payload.Points

    P = LoyaltyTransaction.Points
    totals = (
        db.query(
            func.coalesce(func.sum(case((P > 0, P), else_=0)), 0),
            func.coalesce(func.sum(case((P < 0, -P), else_=0)), 0),
        )
        .filter(LoyaltyTransaction.CustomerID == payload.CustomerID)
        .first()
    )
    earned, used = int(totals[0] or 0), int(totals[1] or 0)
    available = earned - used

    if available + signed_points < 0:
        raise HTTPException(status_code=400, detail="Points cannot go below zero available balance")

    if payload.CreatedByUserID is not None:
        if not db.query(User).filter(User.UserID == payload.CreatedByUserID).first():
            raise HTTPException(status_code=404, detail="User not found")

    txn = LoyaltyTransaction(
        CustomerID=payload.CustomerID,
        RefNo=_generate_ref_no(db),
        TransactionType=payload.ActionType,
        Points=signed_points,
        Description=payload.Description,
        CreatedByUserID=payload.CreatedByUserID,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return LoyaltyHistoryItem(
        LoyaltyTransactionID=txn.LoyaltyTransactionID,
        Date=txn.CreatedAt,
        RefNo=txn.RefNo,
        TransactionType=txn.TransactionType,
        Points=txn.Points,
        Description=txn.Description,
        By=txn.created_by.FullName if getattr(txn, "created_by", None) else None,
    )