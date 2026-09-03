from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Company(Base):
    __tablename__ = "Companies"
    CompanyID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyName = Column(String(200), nullable=False)
    Phone = Column(String(50))
    Email = Column(String(100))
    Address = Column(String(500))
    Country = Column(String(100))
    Currency = Column(String(20))
    TaxNo = Column(String(50))
    LogoPath = Column(String(300))
    IsActive = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, server_default=func.now())


class Branch(Base):
    __tablename__ = "Branches"
    BranchID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyID = Column(Integer, ForeignKey("Companies.CompanyID"), nullable=False)
    BranchCode = Column(String(20))
    BranchName = Column(String(150), nullable=False)
    ManagerName = Column(String(150))
    Phone = Column(String(50))
    Address = Column(String(300))
    IsActive = Column(Boolean, default=True)
    Email = Column(String(100))


class Purchase(Base):
    __tablename__ = "Purchases"
    PurchaseID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyID = Column(Integer, ForeignKey("Companies.CompanyID"), nullable=False)
    BranchID = Column(Integer, ForeignKey("Branches.BranchID"), nullable=False)
    SupplierID = Column(Integer, ForeignKey("Suppliers.SupplierId"), nullable=False)

    PurchaseNo = Column(String(30), unique=True, nullable=False)
    PurchaseDate = Column(Date, nullable=False)
    PaymentTerm = Column(String(50))
    ReferenceNo = Column(String(100))
    Remarks = Column(String(500))

    SubTotal = Column(Numeric(18, 2), default=0)
    DiscountAmount = Column(Numeric(18, 2), default=0)
    TaxPercent = Column(Numeric(5, 2), default=0)
    TaxAmount = Column(Numeric(18, 2), default=0)
    ShippingCharge = Column(Numeric(18, 2), default=0)
    GrandTotal = Column(Numeric(18, 2), default=0)

    Status = Column(String(20), default="Completed")
    PaymentStatus = Column(String(20), default="Paid")

    CreatedAt = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete")


class PurchaseItem(Base):
    __tablename__ = "PurchaseItems"
    PurchaseItemID = Column(Integer, primary_key=True, autoincrement=True)
    PurchaseID = Column(Integer, ForeignKey("Purchases.PurchaseID", ondelete="CASCADE"), nullable=False)
    ProductID = Column(Integer, ForeignKey("Products.ProductID"), nullable=False)
    BatchNo = Column(String(50))
    Qty = Column(Numeric(18, 2), nullable=False)
    UnitPrice = Column(Numeric(18, 2), nullable=False)
    DiscountPercent = Column(Numeric(5, 2), default=0)
    LineTotal = Column(Numeric(18, 2), nullable=False)
    SizeID = Column(Integer, ForeignKey("Sizes.SizeID"), nullable=True)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product")
    size = relationship("Size")
    

class Size(Base):
    __tablename__ = "Sizes"
    SizeID = Column(Integer, primary_key=True, autoincrement=True)
    SizeName = Column(String(50), nullable=False)
    SizeCode = Column(String(20))
    SortOrder = Column(Integer, default=0)
    Status = Column(String(20), default="Active")