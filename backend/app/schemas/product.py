from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LookupOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    ProductName: str
    Barcode: Optional[str] = None
    CategoryID: int
    BrandID: Optional[int] = None
    UnitID: int

    PurchasePrice: Optional[float] = 0
    SalePrice: Optional[float] = 0
    TaxPercent: Optional[float] = 0
    OpeningStock: Optional[int] = 0
    ReorderLevel: Optional[int] = 0

    ImageUrl: Optional[str] = None
    Status: Optional[str] = "Active"
    Description: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductOut(ProductBase):
    ProductID: int
    ProductCode: str
    CurrentStock: int
    CreatedAt: datetime

    # Related names
    categoryName: Optional[str] = None
    brandName: Optional[str] = None

    class Config:
        from_attributes = True