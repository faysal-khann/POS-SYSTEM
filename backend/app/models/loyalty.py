from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class LoyaltyTransaction(Base):
    __tablename__ = "LoyaltyTransactions"
    LoyaltyTransactionID = Column(Integer, primary_key=True, autoincrement=True)
    CustomerID = Column(Integer, ForeignKey("Customers.CustomerId"), nullable=False)
    RefNo = Column(String(30), nullable=False)
    TransactionType = Column(String(20), nullable=False)   # Earn / Redeem / Adjust
    Points = Column(Integer, nullable=False)                # + adds points, - removes points
    Description = Column(String(255))
    SaleID = Column(Integer, ForeignKey("Sales.SaleID"), nullable=True)
    CreatedByUserID = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    CreatedAt = Column(DateTime, server_default=func.now())

    created_by = relationship("User")