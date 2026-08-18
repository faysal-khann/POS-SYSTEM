from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.product import Unit
from ..schemas.unit import UnitCreate, UnitUpdate, UnitOut

router = APIRouter(prefix="/units", tags=["Units"])


@router.get("/", response_model=List[UnitOut])
def get_units(db: Session = Depends(get_db)):
    return db.query(Unit).all()


@router.get("/{unit_id}", response_model=UnitOut)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.UnitID == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.post("/", response_model=UnitOut)
def create_unit(unit: UnitCreate, db: Session = Depends(get_db)):
    db_unit = Unit(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.put("/{unit_id}", response_model=UnitOut)
def update_unit(unit_id: int, unit: UnitUpdate, db: Session = Depends(get_db)):
    db_unit = db.query(Unit).filter(Unit.UnitID == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    for field, value in unit.model_dump().items():
        setattr(db_unit, field, value)

    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.delete("/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    db_unit = db.query(Unit).filter(Unit.UnitID == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db.delete(db_unit)
    db.commit()
    return {"message": "Unit deleted successfully"}