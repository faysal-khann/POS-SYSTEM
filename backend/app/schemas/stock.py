from pydantic import BaseModel
from typing import Optional


class StockListItem(BaseModel):
    ProductStockID: int
    ProductCode: str
    ProductName: str
    CategoryID: Optional[int] = None
    CategoryName: Optional[str] = None
    BrandID: Optional[int] = None
    BrandName: Optional[str] = None
    UnitShortName: Optional[str] = None
    BranchID: int
    BranchName: str
    CurrentStock: int
    StockValue: float
    Status: str

    class Config:
        from_attributes = True
from datetime import datetime


class StockDetail(BaseModel):
    ProductStockID: int
    ProductID: int
    ProductCode: str
    ProductName: str
    CategoryName: Optional[str] = None
    BrandName: Optional[str] = None
    UnitShortName: Optional[str] = None
    Barcode: Optional[str] = None
    BranchID: int
    BranchName: str
    CurrentStock: int
    ReservedStock: int
    ReorderLevel: int
    MaximumLevel: int
    PurchasePrice: float
    StockValue: float
    Status: str
    LastUpdatedAt: datetime
    ImageUrl: Optional[str] = None

    class Config:
        from_attributes = True


class StockUpdate(BaseModel):
    BranchID: int
    CurrentStock: int
    ReservedStock: Optional[int] = 0
    ReorderLevel: Optional[int] = 0
    MaximumLevel: Optional[int] = 0