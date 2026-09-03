from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import List

class UserListItem(BaseModel):
    UserID: int
    FullName: str
    Username: str
    Email: str
    RoleName: str
    Status: str
    LastLoginAt: Optional[datetime] = None

    class Config:
        from_attributes = True




class PermissionNode(BaseModel):
    id: int
    name: str
    children: List["PermissionNode"] = []

PermissionNode.model_rebuild()


class UserCreate(BaseModel):
    FullName: str
    Username: str
    Email: str
    Phone: Optional[str] = None
    Password: str
    ConfirmPassword: str
    RoleID: int
    PrimaryBranchID: int
    EmployeeID: Optional[str] = None
    Designation: Optional[str] = None
    Address: Optional[str] = None
    Notes: Optional[str] = None
    Status: Optional[str] = "Active"
    PermissionIDs: List[int] = []


class UserOut(BaseModel):
    UserID: int
    FullName: str
    Username: str
    Email: str

    class Config:
        from_attributes = True


class UserDetail(BaseModel):
    UserID: int
    FullName: str
    Username: str
    Email: str
    Phone: Optional[str] = None
    RoleID: int
    RoleName: str
    PrimaryBranchID: int
    BranchName: str
    EmployeeID: Optional[str] = None
    Designation: Optional[str] = None
    Address: Optional[str] = None
    Notes: Optional[str] = None
    Status: str
    LastLoginAt: Optional[datetime] = None
    PermissionIDs: List[int] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    FullName: str
    Username: str
    Email: str
    Phone: Optional[str] = None
    Password: Optional[str] = None
    ConfirmPassword: Optional[str] = None
    RoleID: int
    PrimaryBranchID: int
    EmployeeID: Optional[str] = None
    Designation: Optional[str] = None
    Address: Optional[str] = None
    Notes: Optional[str] = None
    Status: Optional[str] = "Active"
    PermissionIDs: List[int] = []