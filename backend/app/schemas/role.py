from pydantic import BaseModel
from typing import Optional
from typing import List

class RoleListItem(BaseModel):
    RoleID: int
    RoleName: str
    Description: Optional[str] = None
    UserCount: int
    Status: str

    class Config:
        from_attributes = True



class RoleCreate(BaseModel):
    RoleName: str
    Description: Optional[str] = None
    Status: Optional[str] = "Active"
    PermissionIDs: List[int] = []


class RoleOut(BaseModel):
    RoleID: int
    RoleName: str
    Description: Optional[str] = None
    Status: str

    class Config:
        from_attributes = True


class RoleUpdate(BaseModel):
    RoleName: str
    Description: Optional[str] = None
    Status: Optional[str] = "Active"
    PermissionIDs: List[int] = []


class RoleDetail(BaseModel):
    RoleID: int
    RoleName: str
    Description: Optional[str] = None
    Status: str
    PermissionIDs: List[int] = []

    class Config:
        from_attributes = True