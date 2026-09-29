from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
from datetime import date
from sqlalchemy import Date, func
from ..database import get_db
from ..models.sale import Sale, SaleItem
from ..models.stock import ProductStock, StockMovement
from ..schemas.sale import (
    SaleCreate, SaleOut, SaleListItem, HeldSaleListItem, HeldSaleDetail,
    DraftSaleListItem, DraftSaleDetail,
)
from ..models.customer import Customer
from ..models.user import User
router = APIRouter(prefix="/sales", tags=["Sales"])


def generate_invoice_no(db: Session) -> str:
    today = date.today()
    count_today = (
        db.query(func.count(Sale.SaleID))
        .filter(
            func.cast(Sale.SaleDate, Date) == today,
            Sale.InvoiceNo.like("INV-%"),  # drafts use their own sequence
        )
        .scalar() or 0
    )
    return f"INV-{today.strftime('%Y%m%d')}{count_today + 1:04d}"


def generate_draft_no(db: Session) -> str:
    prefix = f"DRAFT-{date.today().strftime('%y%m%d')}-"
    last = (
        db.query(Sale.InvoiceNo)
        .filter(Sale.InvoiceNo.like(f"{prefix}%"))
        .order_by(Sale.InvoiceNo.desc())
        .first()
    )
    seq = int(last[0].rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}{seq:04d}"
@router.get("/next-invoice-no")
def next_invoice_no(db: Session = Depends(get_db)):
    return {"invoice_no": generate_invoice_no(db)}

from ..models.user import User

@router.get("/cashiers-list")
def get_all_cashiers(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.Status == "Active").all()
    return [{"id": u.UserID, "name": u.FullName} for u in users]

@router.post("/", response_model=SaleOut)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Add at least one item to the sale.")

    customer = None
    if payload.CustomerID:
        customer = db.query(Customer).filter(Customer.CustomerId == payload.CustomerID).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    points_to_redeem = payload.LoyaltyPointsToRedeem or 0
    loyalty_discount = 0.0

    if points_to_redeem > 0:
        if not customer:
            raise HTTPException(status_code=400, detail="Select a registered customer to redeem points.")
        if points_to_redeem > customer.LoyaltyPoints:
            raise HTTPException(status_code=400, detail="Customer does not have enough loyalty points.")
        loyalty_discount = float(points_to_redeem)  # 1 point = 1 taka

    # recompute grand total server-side to include the loyalty discount safely
    grand_total = payload.SubTotal - payload.DiscountAmount - loyalty_discount + payload.TaxAmount
    if grand_total < 0:
        raise HTTPException(status_code=400, detail="Discount exceeds sale total.")

    points_earned = int(grand_total // 1000) * 10  # 10 points per 1000 taka spent

    sale = Sale(
        InvoiceNo=generate_invoice_no(db),
        CompanyID=payload.CompanyID,
        BranchID=payload.BranchID,
        CustomerID=payload.CustomerID,
        UserID=payload.UserID,
        SaleDate=payload.SaleDate or datetime.utcnow(),
        PriceType=payload.PriceType,
        SubTotal=payload.SubTotal,
        DiscountAmount=payload.DiscountAmount,
        TaxAmount=payload.TaxAmount,
        GrandTotal=grand_total,
        PaymentMethod=payload.PaymentMethod,
        PaymentStatus=payload.PaymentStatus or "Paid",
        ReceivedAmount=payload.ReceivedAmount,
        ChangeAmount=payload.ChangeAmount,
        Status=payload.Status or "Completed",
        LoyaltyPointsEarned=points_earned if customer else 0,
        LoyaltyPointsRedeemed=points_to_redeem,
        LoyaltyDiscountAmount=loyalty_discount,
    )
    db.add(sale)
    db.flush()

    # ... existing item loop + stock movement logic stays exactly the same ...

    # apply the point changes to the customer's balance
    if customer:
        customer.LoyaltyPoints = customer.LoyaltyPoints - points_to_redeem + points_earned

    db.commit()
    db.refresh(sale)
    return sale

from sqlalchemy.orm import joinedload
from typing import List
from ..models.user import User
from ..schemas.sale import SaleListItem


@router.get("/", response_model=List[SaleListItem])
def get_sales(
    db: Session = Depends(get_db),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    customer_id: Optional[int] = Query(None),
    cashier_id: Optional[int] = Query(None),
    payment_status: Optional[str] = Query(None),
):
    query = db.query(Sale).options(joinedload(Sale.customer))

    if date_from:
        query = query.filter(func.cast(Sale.SaleDate, date) >= date_from)
    if date_to:
        query = query.filter(func.cast(Sale.SaleDate, date) <= date_to)
    if customer_id:
        query = query.filter(Sale.CustomerID == customer_id)
    if cashier_id:
        query = query.filter(Sale.UserID == cashier_id)
    if payment_status and payment_status != "All":
        query = query.filter(Sale.PaymentStatus == payment_status)

    sales = query.order_by(Sale.SaleDate.desc()).all()

    result = []
    for s in sales:
        item_count = (
            db.query(func.count(SaleItem.SaleItemID))
            .filter(SaleItem.SaleID == s.SaleID)
            .scalar() or 0
        )
        cashier = db.query(User).filter(User.UserID == s.UserID).first()

        result.append(SaleListItem(
            SaleID=s.SaleID,
            InvoiceNo=s.InvoiceNo,
            SaleDate=s.SaleDate,
            CustomerName=s.customer.CustomerName if s.customer else "Walk-in Customer",
            TotalItems=item_count,
            GrandTotal=float(s.GrandTotal),
            PaymentMethod=s.PaymentMethod,
            PaymentStatus=s.PaymentStatus,
            CashierName=cashier.FullName if cashier else "—",
            Status=s.Status,
        ))
    return result


@router.get("/cashiers")
def get_cashiers(db: Session = Depends(get_db)):
    user_ids = db.query(Sale.UserID).distinct().all()
    ids = [u[0] for u in user_ids]
    users = db.query(User).filter(User.UserID.in_(ids)).all() if ids else []
    return [{"id": u.UserID, "name": u.FullName} for u in users]


@router.delete("/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.SaleID == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    db.delete(sale)
    db.commit()
    return {"message": "Sale deleted successfully"}



from ..models.user import User

@router.get("/held", response_model=List[HeldSaleListItem])
def get_held_sales(db: Session = Depends(get_db)):
    sales = (
        db.query(Sale)
        .options(joinedload(Sale.customer))
        .filter(Sale.Status == "Held")
        .order_by(Sale.SaleDate.desc())
        .all()
    )

    result = []
    for s in sales:
        item_count = db.query(func.count(SaleItem.SaleItemID)).filter(SaleItem.SaleID == s.SaleID).scalar() or 0
        cashier = db.query(User).filter(User.UserID == s.UserID).first()
        result.append(HeldSaleListItem(
            SaleID=s.SaleID,
            ParkName=s.ParkName,
            SaleDate=s.SaleDate,
            CustomerName=s.customer.CustomerName if s.customer else "Walk-in Customer",
            TotalItems=item_count,
            GrandTotal=float(s.GrandTotal),
            CashierName=cashier.FullName if cashier else "—",
        ))
    return result


@router.get("/held/{sale_id}", response_model=HeldSaleDetail)
def get_held_sale_detail(sale_id: int, db: Session = Depends(get_db)):
    sale = (
        db.query(Sale)
        .options(joinedload(Sale.items).joinedload(SaleItem.product))
        .filter(Sale.SaleID == sale_id, Sale.Status == "Held")
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Held sale not found")

    items = [
        {
            "ProductID": i.ProductID,
            "ProductName": i.product.ProductName if i.product else "—",
            "Qty": float(i.Qty),
            "UnitPrice": float(i.UnitPrice),
            "DiscountPercent": float(i.DiscountPercent),
            "TaxPercent": float(i.TaxPercent),
        }
        for i in sale.items
    ]

    return HeldSaleDetail(
        SaleID=sale.SaleID,
        ParkName=sale.ParkName,
        CustomerID=sale.CustomerID,
        BranchID=sale.BranchID,
        CompanyID=sale.CompanyID,
        items=items,
    )

@router.get("/drafts", response_model=List[DraftSaleListItem])
def get_draft_sales(db: Session = Depends(get_db)):
    sales = (
        db.query(Sale)
        .options(joinedload(Sale.customer))
        .filter(Sale.Status == "Draft")
        .order_by(Sale.SaleDate.desc())
        .all()
    )
    if not sales:
        return []

    item_counts = dict(
        db.query(SaleItem.SaleID, func.count(SaleItem.SaleItemID))
        .filter(SaleItem.SaleID.in_([s.SaleID for s in sales]))
        .group_by(SaleItem.SaleID)
        .all()
    )
    cashiers = {
        u.UserID: u.FullName
        for u in db.query(User).filter(User.UserID.in_({s.UserID for s in sales})).all()
    }

    return [
        DraftSaleListItem(
            SaleID=s.SaleID,
            DraftNo=s.InvoiceNo,
            SaleDate=s.SaleDate,
            CustomerName=s.customer.CustomerName if s.customer else "Walk-in Customer",
            TotalItems=item_counts.get(s.SaleID, 0),
            GrandTotal=float(s.GrandTotal),
            CashierName=cashiers.get(s.UserID, "—"),
        )
        for s in sales
    ]


@router.get("/drafts/{sale_id}", response_model=DraftSaleDetail)
def get_draft_sale_detail(sale_id: int, db: Session = Depends(get_db)):
    sale = (
        db.query(Sale)
        .options(
            joinedload(Sale.items).joinedload(SaleItem.product),
            joinedload(Sale.customer),
        )
        .filter(Sale.SaleID == sale_id, Sale.Status == "Draft")
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Draft not found")

    cashier = db.query(User).filter(User.UserID == sale.UserID).first()

    return DraftSaleDetail(
        SaleID=sale.SaleID,
        DraftNo=sale.InvoiceNo,
        SaleDate=sale.SaleDate,
        CustomerID=sale.CustomerID,
        CustomerName=sale.customer.CustomerName if sale.customer else "Walk-in Customer",
        CashierName=cashier.FullName if cashier else "—",
        BranchID=sale.BranchID,
        CompanyID=sale.CompanyID,
        SubTotal=float(sale.SubTotal or 0),
        DiscountAmount=float(sale.DiscountAmount or 0),
        TaxAmount=float(sale.TaxAmount or 0),
        GrandTotal=float(sale.GrandTotal or 0),
        items=[
            {
                "ProductID": i.ProductID,
                "ProductName": i.product.ProductName if i.product else "—",
                "Qty": float(i.Qty),
                "UnitPrice": float(i.UnitPrice),
                "DiscountPercent": float(i.DiscountPercent or 0),
                "TaxPercent": float(i.TaxPercent or 0),
                "LineTotal": float(i.LineTotal),
            }
            for i in sale.items
        ],
    )

