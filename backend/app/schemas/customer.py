from pydantic import BaseModel
from typing import Optional


class CustomerBase(BaseModel):

    CustomerName: str

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

    CustomerGroup: Optional[str]=None

    OpeningBalance: Optional[float] = 0
    CreditLimit: Optional[float] = 0
    DueAmount: Optional[float] = 0

    Notes: Optional[str] = None

    Status: Optional[str] = "Active"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    CustomerId: int
    CustomerCode: str

    class Config:
        from_attributes = True