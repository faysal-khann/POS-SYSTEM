from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, Boolean,
    ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class PaymentProvider(Base):
    __tablename__ = "PaymentProviders"
    __table_args__ = (UniqueConstraint("CompanyID", "Method", "Name"),)

    ProviderID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyID = Column(Integer, ForeignKey("Companies.CompanyID"), nullable=False)
    Method = Column(String(20), nullable=False)       # Cash | Card | Mobile
    Name = Column(String(100), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    SortOrder = Column(Integer, nullable=False, default=0)


class SalePayment(Base):
    __tablename__ = "SalePayments"

    SalePaymentID = Column(Integer, primary_key=True, autoincrement=True)
    SaleID = Column(Integer, ForeignKey("Sales.SaleID", ondelete="CASCADE"), nullable=False)
    Method = Column(String(20), nullable=False)
    ProviderID = Column(Integer, ForeignKey("PaymentProviders.ProviderID"), nullable=True)
    ProviderName = Column(String(100))                # snapshot at sale time
    Amount = Column(Numeric(18, 2), nullable=False)
    Reference = Column(String(100))
    CreatedAt = Column(DateTime, server_default=func.now())

    sale = relationship("Sale", back_populates="payments")
    provider = relationship("PaymentProvider")