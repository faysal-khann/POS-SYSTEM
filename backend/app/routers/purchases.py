from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models.purchase import Purchase, PurchaseItem
from ..models.supplier import Supplier
from ..schemas.purchase import PurchaseCreate, PurchaseOut, PurchaseListItem

router = APIRouter(prefix="/purchases", tags=["Purchases"])


def generate_purchase_no(db: Session) -> str:
    last = db.query(func.max(Purchase.PurchaseID)).scalar() or 0
    year = date.today().strftime("%y")
    return f"PUR-{year}{date.today().month:02d}{last + 1:04d}"


@router.get("/", response_model=List[PurchaseListItem])
def get_purchases(
    db: Session = Depends(get_db),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    supplier_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    query = db.query(Purchase).options(joinedload(Purchase.supplier))

    if date_from:
        query = query.filter(Purchase.PurchaseDate >= date_from)
    if date_to:
        query = query.filter(Purchase.PurchaseDate <= date_to)
    if supplier_id:
        query = query.filter(Purchase.SupplierID == supplier_id)
    if status and status != "All":
        query = query.filter(Purchase.Status == status)

    purchases = query.order_by(Purchase.PurchaseDate.desc()).all()

    result = []
    for p in purchases:
        item_count = db.query(func.count(PurchaseItem.PurchaseItemID)).filter(
            PurchaseItem.PurchaseID == p.PurchaseID
        ).scalar() or 0

        result.append(PurchaseListItem(
            PurchaseID=p.PurchaseID,
            PurchaseNo=p.PurchaseNo,
            PurchaseDate=p.PurchaseDate,
            SupplierName=p.supplier.SupplierName if p.supplier else "—",
            TotalItems=item_count,
            TotalAmount=float(p.GrandTotal),
            Status=p.Status,
            PaymentStatus=p.PaymentStatus,
        ))

    return result


@router.get("/{purchase_id}", response_model=PurchaseOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = (
        db.query(Purchase)
        .options(joinedload(Purchase.items).joinedload(PurchaseItem.product))
        .filter(Purchase.PurchaseID == purchase_id)
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    out = PurchaseOut.model_validate(purchase)
    for i, item in enumerate(purchase.items):
        out.items[i].ProductName = item.product.ProductName if item.product else None
    return out


@router.post("/", response_model=PurchaseOut)
def create_purchase(payload: PurchaseCreate, db: Session = Depends(get_db)):
    new_no = generate_purchase_no(db)

    purchase = Purchase(
        PurchaseNo=new_no,
        CompanyID=payload.CompanyID,
        BranchID=payload.BranchID,
        SupplierID=payload.SupplierID,
        PurchaseDate=payload.PurchaseDate,
        PaymentTerm=payload.PaymentTerm,
        ReferenceNo=payload.ReferenceNo,
        Remarks=payload.Remarks,
        SubTotal=payload.SubTotal,
        DiscountAmount=payload.DiscountAmount,
        TaxPercent=payload.TaxPercent,
        TaxAmount=payload.TaxAmount,
        ShippingCharge=payload.ShippingCharge,
        GrandTotal=payload.GrandTotal,
        Status=payload.Status,
        PaymentStatus=payload.PaymentStatus,
    )
    db.add(purchase)
    db.flush()  # get PurchaseID before inserting items

    for item in payload.items:
        db.add(PurchaseItem(
            PurchaseID=purchase.PurchaseID,
            ProductID=item.ProductID,
            BatchNo=item.BatchNo,
            Qty=item.Qty,
            UnitPrice=item.UnitPrice,
            DiscountPercent=item.DiscountPercent,
            LineTotal=item.LineTotal,
        ))

    db.commit()
    db.refresh(purchase)
    return get_purchase(purchase.PurchaseID, db)


@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.PurchaseID == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    db.delete(purchase)
    db.commit()
    return {"message": "Purchase deleted successfully"}