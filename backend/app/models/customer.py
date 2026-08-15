from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime
from sqlalchemy.sql import func
from ..database import Base


class Customer(Base):
    __tablename__ = "Customers"

    CustomerId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    CustomerCode = Column(String(20), unique=True, nullable=False)
    CustomerName = Column(String(100), nullable=False)
    Phone = Column(String(20), nullable=False)
    Email = Column(String(100), nullable=True)
    CustomerGroup = Column(String(50), nullable=False)
    DateOfBirth = Column(Date, nullable=True)
    NationalIdTaxId = Column(String(50), nullable=True)

    AddressLine1 = Column(String(200), nullable=False)
    AddressLine2 = Column(String(200), nullable=True)
    City = Column(String(50), nullable=False)
    StateDivision = Column(String(100), nullable=True)
    PostalCode = Column(String(20), nullable=True)
    Country = Column(String(100), default="Bangladesh")

    OpeningBalance = Column(Numeric(12, 2), default=0.00)
    CreditLimit = Column(Numeric(12, 2), default=0.00)
    DueAmount = Column(Numeric(12, 2), default=0.00)
    Notes = Column(String(None), nullable=True)  # VARCHAR(MAX)

    Status = Column(String(20), default="Active")
    CreatedAt = Column(DateTime(timezone=False), server_default=func.now())