from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BrandBase(BaseModel):
    BrandName: str
    Description: Optional[str] = None
    Status: Optional[str] = "Active"


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BrandBase):
    pass


class BrandOut(BrandBase):
    BrandID: int
    CreatedAt: datetime

    class Config:
        from_attributes = True