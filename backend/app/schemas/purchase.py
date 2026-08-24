from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class PurchaseItemBase(BaseModel):
    ProductID: int
    BatchNo: Optional[str] = None
    Qty: float
    UnitPrice: float
    DiscountPercent: Optional[float] = 0
    LineTotal: float
    SizeID: Optional[int] = None


class PurchaseItemCreate(PurchaseItemBase):
    pass


class PurchaseItemOut(PurchaseItemBase):
    PurchaseItemID: int
    ProductName: Optional[str] = None  # populated manually in router
    SizeName: Optional[str] = None  # populated manually in router
    class Config:
        from_attributes = True


class PurchaseBase(BaseModel):
    CompanyID: int
    BranchID: int
    SupplierID: int
    PurchaseDate: date
    PaymentTerm: Optional[str] = None
    ReferenceNo: Optional[str] = None
    Remarks: Optional[str] = None

    SubTotal: Optional[float] = 0
    DiscountAmount: Optional[float] = 0
    TaxPercent: Optional[float] = 0
    TaxAmount: Optional[float] = 0
    ShippingCharge: Optional[float] = 0
    GrandTotal: Optional[float] = 0

    Status: Optional[str] = "Completed"
    PaymentStatus: Optional[str] = "Paid"


class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]


class PurchaseListItem(BaseModel):
    PurchaseID: int
    PurchaseNo: str
    PurchaseDate: date
    SupplierName: str
    TotalItems: int
    TotalAmount: float
    Status: str
    PaymentStatus: str

    class Config:
        from_attributes = True


class PurchaseOut(PurchaseBase):
    PurchaseID: int
    PurchaseNo: str
    CreatedAt: datetime
    items: List[PurchaseItemOut] = []

    class Config:
        from_attributes = True