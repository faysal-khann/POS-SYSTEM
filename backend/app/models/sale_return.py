from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class SaleReturn(Base):
    __tablename__ = "SaleReturns"
    SaleReturnID = Column(Integer, primary_key=True, autoincrement=True)
    OriginalSaleID = Column(Integer, ForeignKey("Sales.SaleID"), nullable=False)
    ReturnType = Column(String(20), default="Sales Return")
    CompanyID = Column(Integer, nullable=False)
    BranchID = Column(Integer, nullable=False)
    CustomerID = Column(Integer, nullable=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    ReturnDate = Column(DateTime, server_default=func.now())
    Reason = Column(String(50))
    Note = Column(String(500))
    SubTotal = Column(Numeric(18, 2), default=0)
    TaxAmount = Column(Numeric(18, 2), default=0)
    GrandTotal = Column(Numeric(18, 2), default=0)
    RefundMethod = Column(String(20))
    ReceivedAmount = Column(Numeric(18, 2), default=0)
    CreatedAt = Column(DateTime, server_default=func.now())

    items = relationship("SaleReturnItem", back_populates="sale_return", cascade="all, delete")


class SaleReturnItem(Base):
    __tablename__ = "SaleReturnItems"
    SaleReturnItemID = Column(Integer, primary_key=True, autoincrement=True)
    SaleReturnID = Column(Integer, ForeignKey("SaleReturns.SaleReturnID", ondelete="CASCADE"), nullable=False)
    ProductID = Column(Integer, ForeignKey("Products.ProductID"), nullable=False)
    ReturnQty = Column(Numeric(18, 2), nullable=False)
    UnitPrice = Column(Numeric(18, 2), nullable=False)
    LineTotal = Column(Numeric(18, 2), nullable=False)

    sale_return = relationship("SaleReturn", back_populates="items")
    product = relationship("Product")