from pydantic import BaseModel
from typing import Optional


class BranchListItem(BaseModel):
    BranchID: int
    BranchCode: Optional[str] = None
    BranchName: str
    ManagerName: Optional[str] = None
    Phone: Optional[str] = None
    Address: Optional[str] = None
    Status: str

    class Config:
        from_attributes = True


class BranchDetail(BaseModel):
    BranchID: int
    BranchCode: Optional[str] = None
    BranchName: str
    ManagerName: Optional[str] = None
    Phone: Optional[str] = None
    Email: Optional[str] = None
    Address: Optional[str] = None
    Status: str

    class Config:
        from_attributes = True


class BranchCreate(BaseModel):
    CompanyID: int
    BranchName: str
    ManagerName: Optional[str] = None
    Phone: Optional[str] = None
    Email: Optional[str] = None
    Address: Optional[str] = None
    Status: Optional[str] = "Active"


class BranchUpdate(BaseModel):
    BranchName: str
    ManagerName: Optional[str] = None
    Phone: Optional[str] = None
    Email: Optional[str] = None
    Address: Optional[str] = None
    Status: Optional[str] = "Active"