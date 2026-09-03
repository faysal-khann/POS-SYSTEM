from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

import os, shutil, uuid

from ..database import get_db
from ..models.purchase import Company
from ..schemas.company import CompanyListItem, CompanyCreate, CompanyOut

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/", response_model=List[CompanyListItem])
def get_companies(db: Session = Depends(get_db), search: Optional[str] = Query(None)):
    query = db.query(Company)
    if search:
        query = query.filter(Company.CompanyName.like(f"%{search}%"))

    companies = query.order_by(Company.CompanyID).all()

    return [
        CompanyListItem(
            CompanyID=c.CompanyID,
            CompanyName=c.CompanyName,
            Phone=c.Phone,
            Email=c.Email,
            Address=c.Address,
            Currency=c.Currency,
            Status="Active" if c.IsActive else "Inactive",
        )
        for c in companies
    ]


UPLOAD_DIR = "uploads/companies"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-logo")
def upload_logo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"LogoPath": f"/uploads/companies/{filename}"}

@router.get("/{company_id}", response_model=CompanyCreate)
def get_company_detail(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.CompanyID == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/", response_model=CompanyOut)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    company = Company(**payload.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.put("/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, payload: CompanyCreate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.CompanyID == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in payload.dict().items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.CompanyID == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()
    return {"message": "Company deleted successfully"}