from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased
from typing import List, Optional

from ..database import get_db
from ..models.user import Permission

from ..schemas.permission import PermissionListItem, PermissionCreate, ModuleCreate, ModuleOut
router = APIRouter(prefix="/permissions", tags=["Permissions"])


@router.get("/modules")
def get_modules(db: Session = Depends(get_db)):
    rows = (
        db.query(Permission)
        .filter(Permission.ParentPermissionID.is_(None))
        .order_by(Permission.SortOrder)
        .all()
    )
    return [{"id": p.PermissionID, "name": p.PermissionName} for p in rows]


@router.get("/", response_model=List[PermissionListItem])
def get_permissions(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
):
    query = db.query(Permission).filter(Permission.ParentPermissionID.isnot(None))

    if search:
        query = query.filter(Permission.PermissionName.like(f"%{search}%"))
    if module and module != "All":
        query = query.filter(Permission.Module == module)

    rows = query.order_by(Permission.PermissionID).all()

    return [
        PermissionListItem(
            PermissionID=p.PermissionID,
            PermissionName=p.PermissionName,
            Module=p.Module,
            Description=p.Description,
            Status=p.Status,
        )
        for p in rows
    ]


@router.post("/", response_model=PermissionListItem)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    parent = db.query(Permission).filter(Permission.PermissionID == payload.ParentPermissionID).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent module not found")

    key_base = payload.PermissionName.lower().replace(" ", "_").replace("/", "_")
    permission = Permission(
        ParentPermissionID=payload.ParentPermissionID,
        PermissionKey=f"{parent.PermissionKey}.{key_base}",
        PermissionName=payload.PermissionName,
        Description=payload.Description,
        Module=parent.Module,
        Status=payload.Status or "Active",
    )
    db.add(permission)
    db.commit()
    db.refresh(permission)

    return PermissionListItem(
        PermissionID=permission.PermissionID,
        PermissionName=permission.PermissionName,
        Module=permission.Module,
        Description=permission.Description,
        Status=permission.Status,
    )


@router.delete("/{permission_id}")
def delete_permission(permission_id: int, db: Session = Depends(get_db)):
    permission = db.query(Permission).filter(Permission.PermissionID == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    db.delete(permission)
    db.commit()
    return {"message": "Permission deleted successfully"}





@router.post("/modules", response_model=ModuleOut)
def create_module(payload: ModuleCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Permission)
        .filter(Permission.ParentPermissionID.is_(None), Permission.PermissionName == payload.ModuleName)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="A module with this name already exists.")

    key = payload.ModuleName.lower().replace(" ", "_")
    module = Permission(
        ParentPermissionID=None,
        PermissionKey=key,
        PermissionName=payload.ModuleName,
        Module=payload.ModuleName,
        Status="Active",
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return {"id": module.PermissionID, "name": module.PermissionName}