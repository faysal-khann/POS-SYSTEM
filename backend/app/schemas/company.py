from pydantic import BaseModel
from typing import Optional


class CompanyListItem(BaseModel):
    CompanyID: int
    CompanyName: str
    Phone: Optional[str] = None
    Email: Optional[str] = None
    Address: Optional[str] = None
    Currency: Optional[str] = None
    Status: str

    class Config:
        from_attributes = True


class CompanyCreate(BaseModel):
    CompanyName: str
    Phone: Optional[str] = None
    Email: Optional[str] = None
    Address: Optional[str] = None
    Country: Optional[str] = None
    Currency: Optional[str] = None
    TaxNo: Optional[str] = None
    IsActive: Optional[bool] = True


class CompanyOut(BaseModel):
    CompanyID: int
    CompanyName: str

    class Config:
        from_attributes = True