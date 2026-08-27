from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from ..database import get_db
from ..models.stock import ProductStock
from ..models.product import Product
from ..schemas.stock import StockListItem

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/", response_model=List[StockListItem])
def get_stock(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    branch_id: Optional[int] = Query(None),
):
    query = (
        db.query(ProductStock)
        .join(Product, ProductStock.ProductID == Product.ProductID)
        .options(
            joinedload(ProductStock.product).joinedload(Product.category),
            joinedload(ProductStock.product).joinedload(Product.brand),
            joinedload(ProductStock.product).joinedload(Product.unit),
            joinedload(ProductStock.branch),
        )
    )

    if search:
        like = f"%{search}%"
        query = query.filter(
            (Product.ProductName.like(like)) | (Product.ProductCode.like(like))
        )
    if category_id:
        query = query.filter(Product.CategoryID == category_id)
    if brand_id:
        query = query.filter(Product.BrandID == brand_id)
    if branch_id:
        query = query.filter(ProductStock.BranchID == branch_id)

    rows = query.all()

    result = []
    for r in rows:
        status = "Low Stock" if r.CurrentStock <= r.ReorderLevel else "In Stock"
        result.append(StockListItem(
            ProductStockID=r.ProductStockID,
            ProductCode=r.product.ProductCode,
            ProductName=r.product.ProductName,
            CategoryID=r.product.CategoryID,
            CategoryName=r.product.category.CategoryName if r.product.category else None,
            BrandID=r.product.BrandID,
            BrandName=r.product.brand.BrandName if r.product.brand else None,
            UnitShortName=r.product.unit.ShortName if r.product.unit else None,
            BranchID=r.BranchID,
            BranchName=r.branch.BranchName,
            CurrentStock=r.CurrentStock,
            StockValue=float(r.CurrentStock) * float(r.product.PurchasePrice),
            Status=status,
        ))
    return result