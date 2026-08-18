from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.product import Brand
from ..schemas.brand import BrandCreate, BrandUpdate, BrandOut

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("/", response_model=List[BrandOut])
def get_brands(db: Session = Depends(get_db)):
    return db.query(Brand).all()


@router.get("/{brand_id}", response_model=BrandOut)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.BrandID == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.post("/", response_model=BrandOut)
def create_brand(brand: BrandCreate, db: Session = Depends(get_db)):
    db_brand = Brand(**brand.model_dump())
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    return db_brand


@router.put("/{brand_id}", response_model=BrandOut)
def update_brand(brand_id: int, brand: BrandUpdate, db: Session = Depends(get_db)):
    db_brand = db.query(Brand).filter(Brand.BrandID == brand_id).first()
    if not db_brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    for field, value in brand.model_dump().items():
        setattr(db_brand, field, value)

    db.commit()
    db.refresh(db_brand)
    return db_brand


@router.delete("/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    db_brand = db.query(Brand).filter(Brand.BrandID == brand_id).first()
    if not db_brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    db.delete(db_brand)
    db.commit()
    return {"message": "Brand deleted successfully"}