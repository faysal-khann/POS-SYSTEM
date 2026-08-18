from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..database import get_db
from ..models.product import Product, Category, Brand, Unit
from ..schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOut,
    LookupOut,
)

router = APIRouter(prefix="/products", tags=["Products"])


# =========================================================
# Generate Product Code
# =========================================================

def generate_product_code(db: Session) -> str:
    last = db.query(func.max(Product.ProductID)).scalar() or 0
    return f"P{last + 1:03d}"


# =========================================================
# Dropdown Lookups
# =========================================================

@router.get("/categories", response_model=List[LookupOut])
def get_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).all()

    return [
        {
            "id": c.CategoryID,
            "name": c.CategoryName,
        }
        for c in rows
    ]


@router.get("/brands", response_model=List[LookupOut])
def get_brands(db: Session = Depends(get_db)):
    rows = db.query(Brand).all()

    return [
        {
            "id": b.BrandID,
            "name": b.BrandName,
        }
        for b in rows
    ]


@router.get("/units", response_model=List[LookupOut])
def get_units(db: Session = Depends(get_db)):
    rows = db.query(Unit).all()

    return [
        {
            "id": u.UnitID,
            "name": u.UnitName,
        }
        for u in rows
    ]


# =========================================================
# Get Next Product Code
# =========================================================

@router.get("/next-code")
def get_next_product_code(db: Session = Depends(get_db)):
    return {
        "ProductCode": generate_product_code(db)
    }


# =========================================================
# Helper: Convert Product → ProductOut
# =========================================================

def product_to_response(product: Product):
    return {
        "ProductID": product.ProductID,
        "ProductCode": product.ProductCode,
        "ProductName": product.ProductName,
        "Barcode": product.Barcode,

        "CategoryID": product.CategoryID,
        "BrandID": product.BrandID,
        "UnitID": product.UnitID,

        "PurchasePrice": product.PurchasePrice,
        "SalePrice": product.SalePrice,
        "TaxPercent": product.TaxPercent,

        "OpeningStock": product.OpeningStock,
        "ReorderLevel": product.ReorderLevel,
        "CurrentStock": product.CurrentStock,

        "ImageUrl": product.ImageUrl,
        "Status": product.Status,
        "Description": product.Description,

        "CreatedAt": product.CreatedAt,

        # Related table names
        "categoryName": (
            product.category.CategoryName
            if product.category
            else None
        ),

        "brandName": (
            product.brand.BrandName
            if product.brand
            else None
        ),
    }


# =========================================================
# Get All Products
# =========================================================

@router.get("/", response_model=List[ProductOut])
def get_products(db: Session = Depends(get_db)):

    products = (
        db.query(Product)
        .all()
    )

    return [
        product_to_response(product)
        for product in products
    ]


# =========================================================
# Get Single Product
# =========================================================

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):

    product = (
        db.query(Product)
        .filter(Product.ProductID == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product_to_response(product)


# =========================================================
# Create Product
# =========================================================

@router.post("/", response_model=ProductOut)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):

    new_code = generate_product_code(db)

    data = product.model_dump()

    opening_stock = data.get("OpeningStock", 0)

    db_product = Product(
        ProductCode=new_code,
        CurrentStock=opening_stock,
        **data,
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return product_to_response(db_product)


# =========================================================
# Update Product
# =========================================================

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
):

    db_product = (
        db.query(Product)
        .filter(Product.ProductID == product_id)
        .first()
    )

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    data = product.model_dump()

    for field, value in data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)

    return product_to_response(db_product)


# =========================================================
# Delete Product
# =========================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):

    db_product = (
        db.query(Product)
        .filter(Product.ProductID == product_id)
        .first()
    )

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    db.delete(db_product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }