from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ReturnableItem(BaseModel):
    ProductID: int
    ProductName: str
    QtyAvailable: float
    UnitPrice: float
    TaxPercent: float


class SaleLookupResult(BaseModel):
    SaleID: int
    InvoiceNo: str
    CustomerID: Optional[int] = None
    CustomerName: str
    BranchID: int
    CompanyID: int
    items: List[ReturnableItem]


class SaleReturnItemInput(BaseModel):
    ProductID: int
    ReturnQty: float
    UnitPrice: float
    LineTotal: float


class SaleReturnCreate(BaseModel):
    OriginalSaleID: int
    ReturnType: str = "Sales Return"
    CompanyID: int
    BranchID: int
    CustomerID: Optional[int] = None
    UserID: int
    Reason: Optional[str] = None
    Note: Optional[str] = None
    SubTotal: float
    TaxAmount: float
    GrandTotal: float
    RefundMethod: str
    ReceivedAmount: float
    items: List[SaleReturnItemInput]


class SaleReturnOut(BaseModel):
    SaleReturnID: int
    GrandTotal: float
    Status: str = "Completed"

    class Config:
        from_attributes = True