from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..models.user import RolePermission
from ..schemas.role import RoleListItem, RoleCreate, RoleOut, RoleUpdate, RoleDetail

from ..database import get_db
from ..models.user import Role, User
# from ..schemas.role import RoleListItem

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=List[RoleListItem])
def get_roles(db: Session = Depends(get_db), search: Optional[str] = Query(None)):
    query = db.query(Role)
    if search:
        query = query.filter(Role.RoleName.like(f"%{search}%"))

    roles = query.order_by(Role.RoleID).all()

    result = []
    for r in roles:
        user_count = db.query(func.count(User.UserID)).filter(User.RoleID == r.RoleID).scalar() or 0
        result.append(RoleListItem(
            RoleID=r.RoleID,
            RoleName=r.RoleName,
            Description=r.Description,
            UserCount=user_count,
            Status=r.Status,
        ))
    return result

@router.get("/{role_id}", response_model=RoleDetail)
def get_role_detail(role_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.RoleID == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    permission_ids = [
        r[0] for r in db.query(RolePermission.PermissionID).filter(RolePermission.RoleID == role_id).all()
    ]

    return RoleDetail(
        RoleID=role.RoleID,
        RoleName=role.RoleName,
        Description=role.Description,
        Status=role.Status,
        PermissionIDs=permission_ids,
    )


@router.put("/{role_id}", response_model=RoleOut)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.RoleID == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    name_conflict = (
        db.query(Role)
        .filter(Role.RoleName == payload.RoleName, Role.RoleID != role_id)
        .first()
    )
    if name_conflict:
        raise HTTPException(status_code=400, detail="A role with this name already exists.")

    role.RoleName = payload.RoleName
    role.Description = payload.Description
    role.Status = payload.Status or "Active"

    # replace permission set entirely
    db.query(RolePermission).filter(RolePermission.RoleID == role_id).delete()
    for pid in payload.PermissionIDs:
        db.add(RolePermission(RoleID=role_id, PermissionID=pid))

    db.commit()
    db.refresh(role)
    return role

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.RoleID == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    in_use = db.query(func.count(User.UserID)).filter(User.RoleID == role_id).scalar() or 0
    if in_use > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete — {in_use} user(s) are assigned to this role.",
        )

    db.delete(role)
    db.commit()
    return {"message": "Role deleted successfully"}

@router.post("/", response_model=RoleOut)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    existing = db.query(Role).filter(Role.RoleName == payload.RoleName).first()
    if existing:
        raise HTTPException(status_code=400, detail="A role with this name already exists.")

    role = Role(
        RoleName=payload.RoleName,
        Description=payload.Description,
        Status=payload.Status or "Active",
    )
    db.add(role)
    db.flush()

    for pid in payload.PermissionIDs:
        db.add(RolePermission(RoleID=role.RoleID, PermissionID=pid))

    db.commit()
    db.refresh(role)
    return role