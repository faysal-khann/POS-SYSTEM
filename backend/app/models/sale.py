from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Sale(Base):
    __tablename__ = "Sales"
    SaleID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyID = Column(Integer, ForeignKey("Companies.CompanyID"), nullable=False)
    BranchID = Column(Integer, ForeignKey("Branches.BranchID"), nullable=False)
    CustomerID = Column(Integer, ForeignKey("Customers.CustomerId"), nullable=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    InvoiceNo = Column(String(30), nullable=False)
    SaleDate = Column(DateTime, server_default=func.now())
    PriceType = Column(String(30))
    SubTotal = Column(Numeric(18, 2), default=0)
    DiscountAmount = Column(Numeric(18, 2), default=0)
    TaxAmount = Column(Numeric(18, 2), default=0)
    GrandTotal = Column(Numeric(18, 2), default=0)
    PaymentMethod = Column(String(20))
    PaymentStatus = Column(String(20), default="Paid")
    ReceivedAmount = Column(Numeric(18, 2), default=0)
    ChangeAmount = Column(Numeric(18, 2), default=0)
    Status = Column(String(20), default="Completed")
    CreatedAt = Column(DateTime, server_default=func.now())
    LoyaltyPointsEarned = Column(Integer, default=0)
    LoyaltyPointsRedeemed = Column(Integer, default=0)
    LoyaltyDiscountAmount = Column(Numeric(18, 2), default=0)
    ParkName = Column(String(100))
    
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete")
    customer = relationship("Customer")
   


class SaleItem(Base):
    __tablename__ = "SaleItems"
    SaleItemID = Column(Integer, primary_key=True, autoincrement=True)
    SaleID = Column(Integer, ForeignKey("Sales.SaleID", ondelete="CASCADE"), nullable=False)
    ProductID = Column(Integer, ForeignKey("Products.ProductID"), nullable=False)
    Qty = Column(Numeric(18, 2), nullable=False)
    UnitPrice = Column(Numeric(18, 2), nullable=False)
    DiscountPercent = Column(Numeric(5, 2), default=0)
    TaxPercent = Column(Numeric(5, 2), default=0)
    LineTotal = Column(Numeric(18, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")