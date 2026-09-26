from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SaleItemCreate(BaseModel):
    ProductID: int
    Qty: float
    UnitPrice: float
    DiscountPercent: Optional[float] = 0
    TaxPercent: Optional[float] = 0
    LineTotal: float


class SaleCreate(BaseModel):
    CompanyID: int
    BranchID: int
    CustomerID: Optional[int] = None
    UserID: int
    PriceType: Optional[str] = "Retail Price"
    SubTotal: float
    DiscountAmount: Optional[float] = 0
    TaxAmount: Optional[float] = 0
    GrandTotal: float
    PaymentMethod: Optional[str] = "Cash"
    ReceivedAmount: Optional[float] = 0
    ChangeAmount: Optional[float] = 0
    Status: Optional[str] = "Completed"
    ParkName: Optional[str] = None
    items: List[SaleItemCreate]
    SaleDate: Optional[datetime] = None
    PaymentStatus: Optional[str] = "Paid"
    LoyaltyPointsToRedeem: Optional[int] = 0

class SaleOut(BaseModel):
    SaleID: int
    InvoiceNo: str
    GrandTotal: float
    ChangeAmount: float
    Status: str

    class Config:
        from_attributes = True


class SaleListItem(BaseModel):
    SaleID: int
    InvoiceNo: str
    SaleDate: datetime
    CustomerName: str
    TotalItems: int
    GrandTotal: float
    PaymentMethod: Optional[str] = None
    PaymentStatus: str
    CashierName: str
    Status: str

    class Config:
        from_attributes = True


class HeldSaleListItem(BaseModel):
    SaleID: int
    ParkName: Optional[str] = None
    SaleDate: datetime
    CustomerName: str
    TotalItems: int
    GrandTotal: float
    CashierName: str

    class Config:
        from_attributes = True


class HeldSaleDetail(BaseModel):
    SaleID: int
    ParkName: Optional[str] = None
    CustomerID: Optional[int] = None
    BranchID: int
    CompanyID: int
    items: List[dict]

    class Config:
        from_attributes = True


class DraftSaleListItem(BaseModel):
    SaleID: int
    DraftNo: str
    SaleDate: datetime
    CustomerName: str
    TotalItems: int
    GrandTotal: float
    CashierName: str

    class Config:
        from_attributes = True


class DraftSaleDetail(BaseModel):
    SaleID: int
    DraftNo: str
    SaleDate: datetime
    CustomerID: Optional[int] = None
    CustomerName: str
    CashierName: str
    BranchID: int
    CompanyID: int
    SubTotal: float
    DiscountAmount: float
    TaxAmount: float
    GrandTotal: float
    items: List[dict]

    class Config:
        from_attributes = True