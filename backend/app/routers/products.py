from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from fastapi import UploadFile, File
import shutil
import uuid
import os

UPLOAD_DIR = "uploads/products"
from ..database import get_db
from ..models.product import Product, Category, Brand, Unit
from ..schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOut,
    LookupOut,
)

router = APIRouter(prefix="/products", tags=["Products"])
from ..schemas.product import BulkPriceUpdateRequest, BulkPriceUpdateResult
from typing import List as TList

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


@router.get("/by-barcode/{barcode}", response_model=ProductOut)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.Barcode == barcode).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found for this barcode")
    return product

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



# //update bulk_price_update
@router.post("/bulk-price-update", response_model=TList[BulkPriceUpdateResult])
def bulk_price_update(payload: BulkPriceUpdateRequest, db: Session = Depends(get_db)):
    if payload.PriceField not in ("SalePrice", "PurchasePrice"):
        raise HTTPException(status_code=400, detail="Invalid price field")

    products = db.query(Product).filter(Product.ProductID.in_(payload.ProductIDs)).all()
    if not products:
        raise HTTPException(status_code=404, detail="No matching products found")

    results = []
    for p in products:
        old_price = float(getattr(p, payload.PriceField))

        if payload.UpdateType == "percentage":
            new_price = round(old_price * (1 + payload.Value / 100), 2)
        elif payload.UpdateType == "fixed":
            new_price = round(old_price + payload.Value, 2)
        else:
            raise HTTPException(status_code=400, detail="Invalid update type")

        setattr(p, payload.PriceField, new_price)

        results.append(BulkPriceUpdateResult(
            ProductID=p.ProductID,
            ProductCode=p.ProductCode,
            ProductName=p.ProductName,
            OldPrice=old_price,
            NewPrice=new_price,
        ))

    db.commit()
    return results

@router.post("/upload-image")
def upload_product_image(file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images are allowed")

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return a relative URL — the app will prefix it with the API base URL
    return {"url": f"/uploads/products/{filename}"}