from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    CategoryName: str
    Description: Optional[str] = None
    Status: Optional[str] = "Active"


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    CategoryID: int
    CreatedAt: datetime

    class Config:
        from_attributes = True