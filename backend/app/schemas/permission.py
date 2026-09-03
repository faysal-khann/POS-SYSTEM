from pydantic import BaseModel
from typing import Optional, List


class PermissionListItem(BaseModel):
    PermissionID: int
    PermissionName: str
    Module: str
    Description: Optional[str] = None
    Status: str

    class Config:
        from_attributes = True


class PermissionCreate(BaseModel):
    PermissionName: str
    ParentPermissionID: int  # the module this permission belongs under
    Description: Optional[str] = None
    Status: Optional[str] = "Active"

class ModuleCreate(BaseModel):
    ModuleName: str


class ModuleOut(BaseModel):
    id: int
    name: str