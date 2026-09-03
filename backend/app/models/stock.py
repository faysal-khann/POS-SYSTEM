from sqlalchemy import Column, Integer, BigInteger, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class ProductStock(Base):
    __tablename__ = "ProductStock"
    ProductStockID = Column(Integer, primary_key=True, autoincrement=True)
    ProductID = Column(Integer, ForeignKey("Products.ProductID"), nullable=False)
    BranchID = Column(Integer, ForeignKey("Branches.BranchID"), nullable=False)
    CurrentStock = Column(Integer, nullable=False, default=0)
    ReservedStock = Column(Integer, nullable=False, default=0)
    ReorderLevel = Column(Integer, nullable=False, default=0)
    MaximumLevel = Column(Integer, nullable=False, default=0)
    LastUpdatedAt = Column(DateTime, server_default=func.now())

    product = relationship("Product")
    branch = relationship("Branch")


class StockMovement(Base):
    __tablename__ = "StockMovements"
    MovementID = Column(BigInteger, primary_key=True, autoincrement=True)
    ProductStockID = Column(Integer, ForeignKey("ProductStock.ProductStockID"), nullable=True)
    BranchID = Column(Integer, ForeignKey("Branches.BranchID"), nullable=False)
    ProductID = Column(Integer, ForeignKey("Products.ProductID"), nullable=False)
    MovementType = Column(String(20), nullable=False)
    ReferenceType = Column(String(30))
    ReferenceID = Column(Integer)
    QtyIn = Column(Numeric(18, 2), nullable=False, default=0)
    QtyOut = Column(Numeric(18, 2), nullable=False, default=0)
    BalanceQty = Column(Numeric(18, 2), nullable=False)
    CreatedBy = Column(Integer)
    CreatedAt = Column(DateTime, server_default=func.now())