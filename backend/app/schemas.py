from pydantic import BaseModel
from typing import Optional


class SupplierBase(BaseModel):
    SupplierName: str
    Phone: Optional[str] = None
    Email: Optional[str] = None
    City: Optional[str] = None
    DueAmount: Optional[float] = 0.00
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