from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from ..database import get_db
from ..models.sale import Sale, SaleItem
from ..models.sale_return import SaleReturn, SaleReturnItem
from ..models.stock import ProductStock, StockMovement
from ..schemas.sale_return import (
    SaleLookupResult, ReturnableItem, SaleReturnCreate, SaleReturnOut,
)

router = APIRouter(prefix="/sale-returns", tags=["Sale Returns"])


@router.get("/lookup/{invoice_no}", response_model=SaleLookupResult)
def lookup_sale(invoice_no: str, db: Session = Depends(get_db)):
    sale = (
        db.query(Sale)
        .options(joinedload(Sale.items).joinedload(SaleItem.product), joinedload(Sale.customer))
        .filter(Sale.InvoiceNo == invoice_no)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Invoice not found")

    items = []
    for si in sale.items:
        already_returned = (
            db.query(func.coalesce(func.sum(SaleReturnItem.ReturnQty), 0))
            .join(SaleReturn, SaleReturn.SaleReturnID == SaleReturnItem.SaleReturnID)
            .filter(
                SaleReturn.OriginalSaleID == sale.SaleID,
                SaleReturnItem.ProductID == si.ProductID,
            )
            .scalar()
        )
        available = float(si.Qty) - float(already_returned)
        if available > 0:
            items.append(ReturnableItem(
                ProductID=si.ProductID,
                ProductName=si.product.ProductName if si.product else "—",
                QtyAvailable=available,
                UnitPrice=float(si.UnitPrice),
                TaxPercent=float(si.TaxPercent),
            ))

    return SaleLookupResult(
        SaleID=sale.SaleID,
        InvoiceNo=sale.InvoiceNo,
        CustomerID=sale.CustomerID,
        CustomerName=sale.customer.CustomerName if sale.customer else "Walk-in Customer",
        BranchID=sale.BranchID,
        CompanyID=sale.CompanyID,
        items=items,
    )


@router.post("/", response_model=SaleReturnOut)
def create_sale_return(payload: SaleReturnCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Select at least one item to return.")

    sale_return = SaleReturn(
        OriginalSaleID=payload.OriginalSaleID,
        ReturnType=payload.ReturnType,
        CompanyID=payload.CompanyID,
        BranchID=payload.BranchID,
        CustomerID=payload.CustomerID,
        UserID=payload.UserID,
        Reason=payload.Reason,
        Note=payload.Note,
        SubTotal=payload.SubTotal,
        TaxAmount=payload.TaxAmount,
        GrandTotal=payload.GrandTotal,
        RefundMethod=payload.RefundMethod,
        ReceivedAmount=payload.ReceivedAmount,
    )
    db.add(sale_return)
    db.flush()

    for item in payload.items:
        db.add(SaleReturnItem(
            SaleReturnID=sale_return.SaleReturnID,
            ProductID=item.ProductID,
            ReturnQty=item.ReturnQty,
            UnitPrice=item.UnitPrice,
            LineTotal=item.LineTotal,
        ))

        # restock only for actual "Sales Return" — a pure "Refund" may not restock
        if payload.ReturnType == "Sales Return":
            stock = (
                db.query(ProductStock)
                .filter(
                    ProductStock.ProductID == item.ProductID,
                    ProductStock.BranchID == payload.BranchID,
                )
                .first()
            )
            previous = stock.CurrentStock if stock else 0
            new_balance = previous + int(item.ReturnQty)

            if stock:
                stock.CurrentStock = new_balance
            else:
                stock = ProductStock(
                    ProductID=item.ProductID,
                    BranchID=payload.BranchID,
                    CurrentStock=new_balance,
                )
                db.add(stock)
                db.flush()

            db.add(StockMovement(
                ProductStockID=stock.ProductStockID,
                BranchID=payload.BranchID,
                ProductID=item.ProductID,
                MovementType="Return",
                ReferenceType="SaleReturn",
                ReferenceID=sale_return.SaleReturnID,
                QtyIn=item.ReturnQty,
                QtyOut=0,
                BalanceQty=new_balance,
            ))

    db.commit()
    db.refresh(sale_return)
    return SaleReturnOut(SaleReturnID=sale_return.SaleReturnID, GrandTotal=float(sale_return.GrandTotal))