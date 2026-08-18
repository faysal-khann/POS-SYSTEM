from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base





class Brand(Base):
    __tablename__ = "Brands"
    BrandID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BrandName = Column(String(100), nullable=False)
    Description = Column(String(255), nullable=True)
    Status = Column(String(20), nullable=False, default="Active")
    CreatedAt = Column(DateTime, server_default=func.now())


class Unit(Base):
    __tablename__ = "Units"
    UnitID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UnitName = Column(String(50), nullable=False)
    ShortName = Column(String(20), nullable=True)
    Description = Column(String(255), nullable=True)
    Status = Column(String(20), nullable=False, default="Active")
    CreatedAt = Column(DateTime, server_default=func.now())


class Product(Base):
    __tablename__ = "Products"

    ProductID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ProductCode = Column(String(50), unique=True, nullable=False)
    ProductName = Column(String(150), nullable=False)
    Barcode = Column(String(100), nullable=True)

    CategoryID = Column(Integer, ForeignKey("Categories.CategoryID"), nullable=False)
    BrandID = Column(Integer, ForeignKey("Brands.BrandID"), nullable=True)
    UnitID = Column(Integer, ForeignKey("Units.UnitID"), nullable=False)

    PurchasePrice = Column(Numeric(10, 2), nullable=False, default=0)
    SalePrice = Column(Numeric(10, 2), nullable=False, default=0)
    TaxPercent = Column(Numeric(5, 2), nullable=False, default=0)
    OpeningStock = Column(Integer, nullable=False, default=0)
    ReorderLevel = Column(Integer, nullable=False, default=0)
    CurrentStock = Column(Integer, nullable=False, default=0)

    ImageUrl = Column(String(500), nullable=True)
    Status = Column(String(20), nullable=False, default="Active")
    Description = Column(String(1000), nullable=True)

    CreatedAt = Column(DateTime, server_default=func.now())
    UpdatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now())

    category = relationship("Category")
    brand = relationship("Brand")
    unit = relationship("Unit")


    

class Category(Base):
    __tablename__ = "Categories"
    CategoryID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    CategoryName = Column(String(100), nullable=False)
    Description = Column(String(255), nullable=True)
    Status = Column(String(20), nullable=False, default="Active")
    CreatedAt = Column(DateTime, server_default=func.now())