from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.purchase import Branch
from ..schemas.branch import BranchListItem, BranchDetail, BranchCreate, BranchUpdate

router = APIRouter(prefix="/branches", tags=["Branches"])


def generate_next_branch_code(db: Session) -> str:
    last_branch = (
        db.query(Branch)
        .filter(Branch.BranchCode.like("BR-%"))
        .order_by(Branch.BranchID.desc())
        .first()
    )
    if not last_branch or not last_branch.BranchCode:
        return "BR-001"
    try:
        last_number = int(last_branch.BranchCode.split("-")[1])
    except (IndexError, ValueError):
        last_number = 0
    return f"BR-{last_number + 1:03d}"


@router.get("/", response_model=List[BranchListItem])
def get_branches(db: Session = Depends(get_db), search: Optional[str] = Query(None)):
    query = db.query(Branch)
    if search:
        query = query.filter(Branch.BranchName.like(f"%{search}%"))

    branches = query.order_by(Branch.BranchID).all()

    return [
        BranchListItem(
            BranchID=b.BranchID,
            BranchCode=b.BranchCode,
            BranchName=b.BranchName,
            ManagerName=b.ManagerName,
            Phone=b.Phone,
            Address=b.Address,
            Status="Active" if b.IsActive else "Inactive",
        )
        for b in branches
    ]


@router.get("/{branch_id}", response_model=BranchDetail)
def get_branch_detail(branch_id: int, db: Session = Depends(get_db)):
    b = db.query(Branch).filter(Branch.BranchID == branch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Branch not found")

    return BranchDetail(
        BranchID=b.BranchID,
        BranchCode=b.BranchCode,
        BranchName=b.BranchName,
        ManagerName=b.ManagerName,
        Phone=b.Phone,
        Email=b.Email,
        Address=b.Address,
        Status="Active" if b.IsActive else "Inactive",
    )


@router.post("/", response_model=BranchDetail)
def create_branch(payload: BranchCreate, db: Session = Depends(get_db)):
    code = generate_next_branch_code(db)

    branch = Branch(
        CompanyID=payload.CompanyID,
        BranchCode=code,
        BranchName=payload.BranchName,
        ManagerName=payload.ManagerName,
        Phone=payload.Phone,
        Email=payload.Email,
        Address=payload.Address,
        IsActive=(payload.Status or "Active") == "Active",
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)

    return BranchDetail(
        BranchID=branch.BranchID,
        BranchCode=branch.BranchCode,
        BranchName=branch.BranchName,
        ManagerName=branch.ManagerName,
        Phone=branch.Phone,
        Email=branch.Email,
        Address=branch.Address,
        Status="Active" if branch.IsActive else "Inactive",
    )


@router.put("/{branch_id}", response_model=BranchDetail)
def update_branch(branch_id: int, payload: BranchUpdate, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.BranchID == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    branch.BranchName = payload.BranchName
    branch.ManagerName = payload.ManagerName
    branch.Phone = payload.Phone
    branch.Email = payload.Email
    branch.Address = payload.Address
    branch.IsActive = (payload.Status or "Active") == "Active"

    db.commit()
    db.refresh(branch)

    return BranchDetail(
        BranchID=branch.BranchID,
        BranchCode=branch.BranchCode,
        BranchName=branch.BranchName,
        ManagerName=branch.ManagerName,
        Phone=branch.Phone,
        Email=branch.Email,
        Address=branch.Address,
        Status="Active" if branch.IsActive else "Inactive",
    )


@router.delete("/{branch_id}")
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.BranchID == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    db.delete(branch)
    db.commit()
    return {"message": "Branch deleted successfully"}