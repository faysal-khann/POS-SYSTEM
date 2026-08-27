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