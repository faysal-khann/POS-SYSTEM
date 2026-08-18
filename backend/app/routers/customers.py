from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..database import get_db
from ..models.customer import Customer
from ..schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerOut,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


# =========================================================
# Generate Customer Code
# =========================================================

def generate_customer_code(db: Session) -> str:

    last = (
        db.query(func.max(Customer.CustomerId))
        .scalar()
        or 0
    )

    return f"CUS-{last + 1:04d}"


# =========================================================
# Get All Customers
# =========================================================

@router.get(
    "/",
    response_model=List[CustomerOut]
)
def get_customers(
    db: Session = Depends(get_db)
):

    return db.query(Customer).all()


# =========================================================
# Get Next Customer Code
# =========================================================

@router.get("/next-code")
def get_next_customer_code(
    db: Session = Depends(get_db)
):

    return {
        "CustomerCode": generate_customer_code(db)
    }


# =========================================================
# Get Customer By ID
# =========================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerOut
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.CustomerId == customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


# =========================================================
# Create Customer
# =========================================================

@router.post(
    "/",
    response_model=CustomerOut
)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):

    new_code = generate_customer_code(db)

    db_customer = Customer(
        CustomerCode=new_code,
        **customer.model_dump()
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    return db_customer


# =========================================================
# Update Customer
# =========================================================

@router.put(
    "/{customer_id}",
    response_model=CustomerOut
)
def update_customer(
    customer_id: int,
    customer: CustomerUpdate,
    db: Session = Depends(get_db)
):

    db_customer = (
        db.query(Customer)
        .filter(
            Customer.CustomerId == customer_id
        )
        .first()
    )

    if not db_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    for field, value in customer.model_dump().items():
        setattr(
            db_customer,
            field,
            value
        )

    db.commit()
    db.refresh(db_customer)

    return db_customer


# =========================================================
# Delete Customer
# =========================================================

@router.delete(
    "/{customer_id}"
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):

    db_customer = (
        db.query(Customer)
        .filter(
            Customer.CustomerId == customer_id
        )
        .first()
    )

    if not db_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    db.delete(db_customer)
    db.commit()

    return {
        "message": "Customer deleted successfully"
    }