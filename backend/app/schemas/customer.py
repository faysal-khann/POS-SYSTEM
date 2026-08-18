from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CustomerBase(BaseModel):

    CustomerName: str
    Phone: str
    Email: Optional[str] = None

    CustomerGroup: str

    DateOfBirth: Optional[date] = None
    NationalIdTaxId: Optional[str] = None

    AddressLine1: str
    AddressLine2: Optional[str] = None

    City: str
    StateDivision: Optional[str] = None
    PostalCode: Optional[str] = None
    Country: Optional[str] = "Bangladesh"

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
    CreatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True