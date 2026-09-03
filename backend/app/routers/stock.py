
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from ..database import get_db
from ..models.stock import ProductStock
from ..models.product import Product
from ..schemas.stock import StockListItem, StockDetail, StockUpdate

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


@router.get("/{stock_id}", response_model=StockDetail)
def get_stock_detail(stock_id: int, db: Session = Depends(get_db)):
    r = (
        db.query(ProductStock)
        .options(
            joinedload(ProductStock.product).joinedload(Product.category),
            joinedload(ProductStock.product).joinedload(Product.brand),
            joinedload(ProductStock.product).joinedload(Product.unit),
            joinedload(ProductStock.branch),
        )
        .filter(ProductStock.ProductStockID == stock_id)
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Stock record not found")

    status = "Low Stock" if r.CurrentStock <= r.ReorderLevel else "In Stock"
    return StockDetail(
        ProductStockID=r.ProductStockID,
        ProductID=r.ProductID,
        ProductCode=r.product.ProductCode,
        ProductName=r.product.ProductName,
        CategoryName=r.product.category.CategoryName if r.product.category else None,
        BrandName=r.product.brand.BrandName if r.product.brand else None,
        UnitShortName=r.product.unit.ShortName if r.product.unit else None,
        Barcode=r.product.Barcode,
        BranchID=r.BranchID,
        BranchName=r.branch.BranchName,
        CurrentStock=r.CurrentStock,
        ReservedStock=r.ReservedStock,
        ReorderLevel=r.ReorderLevel,
        MaximumLevel=r.MaximumLevel,
        PurchasePrice=float(r.product.PurchasePrice),
        StockValue=float(r.CurrentStock) * float(r.product.PurchasePrice),
        Status=status,
        LastUpdatedAt=r.LastUpdatedAt,
        ImageUrl=r.product.ImageUrl,
    )


@router.put("/{stock_id}", response_model=StockDetail)
def update_stock(stock_id: int, payload: StockUpdate, db: Session = Depends(get_db)):
    stock = db.query(ProductStock).filter(ProductStock.ProductStockID == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock record not found")

    stock.BranchID = payload.BranchID
    stock.CurrentStock = payload.CurrentStock
    stock.ReservedStock = payload.ReservedStock or 0
    stock.ReorderLevel = payload.ReorderLevel or 0
    stock.MaximumLevel = payload.MaximumLevel or 0
    db.commit()
    db.refresh(stock)

    return get_stock_detail(stock_id, db)