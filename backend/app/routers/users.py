from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from ..models.user import User, Role, Permission, RolePermission, UserPermission
from ..schemas.user import UserListItem, UserCreate, UserOut, PermissionNode
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

from ..database import get_db
from ..models.user import User, Role
from ..schemas.user import UserListItem

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    rows = db.query(Role).all()
    return [{"id": r.RoleID, "name": r.RoleName} for r in rows]


@router.get("/", response_model=List[UserListItem])
def get_users(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    role_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    query = db.query(User).options(joinedload(User.role))

    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.FullName.like(like)) |
            (User.Username.like(like)) |
            (User.Email.like(like))
        )
    if role_id:
        query = query.filter(User.RoleID == role_id)
    if status and status != "All":
        query = query.filter(User.Status == status)

    users = query.order_by(User.UserID).all()

    return [
        UserListItem(
            UserID=u.UserID,
            FullName=u.FullName,
            Username=u.Username,
            Email=u.Email,
            RoleName=u.role.RoleName if u.role else "—",
            Status=u.Status,
            LastLoginAt=u.LastLoginAt,
        )
        for u in users
    ]


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.UserID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/permissions/tree", response_model=List[PermissionNode])
def get_permission_tree(db: Session = Depends(get_db)):
    perms = (
        db.query(Permission)
        .filter(Permission.Status == "Active")
        .order_by(Permission.SortOrder)
        .all()
    )
    by_parent: dict = {}
    for p in perms:
        by_parent.setdefault(p.ParentPermissionID, []).append(p)

    def build(parent_id):
        return [
            PermissionNode(id=p.PermissionID, name=p.PermissionName, children=build(p.PermissionID))
            for p in by_parent.get(parent_id, [])
        ]

    return build(None)


@router.get("/roles/{role_id}/permissions")
def get_role_permission_ids(role_id: int, db: Session = Depends(get_db)):
    rows = db.query(RolePermission.PermissionID).filter(RolePermission.RoleID == role_id).all()
    return [r[0] for r in rows]


@router.post("/", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if payload.Password != payload.ConfirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = (
        db.query(User)
        .filter((User.Username == payload.Username) | (User.Email == payload.Email))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        FullName=payload.FullName,
        Username=payload.Username,
        Email=payload.Email,
        Phone=payload.Phone,
        PasswordHash=hash_password(payload.Password),
        RoleID=payload.RoleID,
        PrimaryBranchID=payload.PrimaryBranchID,
        EmployeeID=payload.EmployeeID,
        Designation=payload.Designation,
        Address=payload.Address,
        Notes=payload.Notes,
        Status=payload.Status or "Active",
    )
    db.add(user)
    db.flush()

    for pid in payload.PermissionIDs:
        db.add(UserPermission(UserID=user.UserID, PermissionID=pid))

    db.commit()
    db.refresh(user)
    return user
