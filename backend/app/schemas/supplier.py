from pydantic import BaseModel
from typing import Optional


class SupplierBase(BaseModel):
    SupplierName: str
    Phone: Optional[str] = None
    Email: Optional[str] = None
    Website: Optional[str] = None

    AddressLine1: Optional[str] = None
    AddressLine2: Optional[str] = None
    City: Optional[str] = None
    StateDivision: Optional[str] = None
    PostalCode: Optional[str] = None
    Country: Optional[str] = "Bangladesh"

    ContactPerson: Optional[str] = None
    ContactPersonPhone: Optional[str] = None
    TaxVatNo: Optional[str] = None
    OpeningBalance: Optional[float] = 0
    CreditLimit: Optional[float] = 0
    DueAmount: Optional[float] = 0

    Notes: Optional[str] = None
    Status: Optional[str] = "Active"


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    SupplierId: int
    SupplierCode: str

    class Config:
        from_attributes = True