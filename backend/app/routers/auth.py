import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from jose import jwt
from passlib.context import CryptContext

from ..database import get_db
from ..models.user import User
from ..models.purchase import Branch, Company
from ..schemas.auth import LoginRequest, LoginResponse
from ..models.user import UserPermission, Permission
router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-fallback-change-me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.branch))
        .filter(
            (User.Username == payload.UsernameOrEmail) | (User.Email == payload.UsernameOrEmail)
        )
        .first()
    )

    if not user or not pwd_context.verify(payload.Password, user.PasswordHash):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    if user.Status != "Active":
        raise HTTPException(status_code=403, detail="This account is inactive. Contact your administrator.")

    branch = db.query(Branch).filter(Branch.BranchID == user.PrimaryBranchID).first()
    if not branch or branch.CompanyID != payload.CompanyID:
        raise HTTPException(status_code=401, detail="User does not belong to the selected company")

    company = db.query(Company).filter(Company.CompanyID == payload.CompanyID).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    user.LastLoginAt = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.UserID), "role": user.role.RoleName if user.role else None})
    permission_rows = (
        db.query(Permission.PermissionKey)
        .join(UserPermission, UserPermission.PermissionID == Permission.PermissionID)
        .filter(UserPermission.UserID == user.UserID)
        .all()
    )
    permission_keys = [r[0] for r in permission_rows]
    return LoginResponse(
        access_token=token,
        UserID=user.UserID,
        FullName=user.FullName,
        Username=user.Username,
        Email=user.Email,
        RoleID=user.RoleID,
        RoleName=user.role.RoleName if user.role else "—",
        CompanyID=company.CompanyID,
        CompanyName=company.CompanyName,
        PrimaryBranchID=branch.BranchID,
        BranchName=branch.BranchName,
        PermissionKeys=permission_keys
    )

@router.get("/lookup-company")
def lookup_company(identifier: str, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter((User.Username == identifier) | (User.Email == identifier))
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    branch = db.query(Branch).filter(Branch.BranchID == user.PrimaryBranchID).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found for this user")

    company = db.query(Company).filter(Company.CompanyID == branch.CompanyID).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {"CompanyID": company.CompanyID, "CompanyName": company.CompanyName}

from pydantic import BaseModel


class VerifyCredentialsRequest(BaseModel):
    UsernameOrEmail: str
    Password: str


@router.post("/verify-credentials")
def verify_credentials(payload: VerifyCredentialsRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            (User.Username == payload.UsernameOrEmail) | (User.Email == payload.UsernameOrEmail)
        )
        .first()
    )

    if not user or not pwd_context.verify(payload.Password, user.PasswordHash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.Status != "Active":
        raise HTTPException(status_code=403, detail="This account is inactive")

    branch = db.query(Branch).filter(Branch.BranchID == user.PrimaryBranchID).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    company = db.query(Company).filter(Company.CompanyID == branch.CompanyID).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {"CompanyID": company.CompanyID, "CompanyName": company.CompanyName}