from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UnitBase(BaseModel):
    UnitName: str
    ShortName: Optional[str] = None
    Description: Optional[str] = None
    Status: Optional[str] = "Active"


class UnitCreate(UnitBase):
    pass


class UnitUpdate(UnitBase):
    pass


class UnitOut(UnitBase):
    UnitID: int
    CreatedAt: datetime

    class Config:
        from_attributes = True