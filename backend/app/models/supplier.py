from sqlalchemy import Column, Integer, String, Numeric
from ..database import Base


class Supplier(Base):
    __tablename__ = "Suppliers"

    SupplierId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    SupplierCode = Column(String(20), unique=True, nullable=False)
    SupplierName = Column(String(100), nullable=False)
    Phone = Column(String(20), nullable=True)
    Email = Column(String(100), nullable=True)
    Website = Column(String(150), nullable=True)

    AddressLine1 = Column(String(200), nullable=True)
    AddressLine2 = Column(String(200), nullable=True)
    City = Column(String(50), nullable=True)
    StateDivision = Column(String(100), nullable=True)
    PostalCode = Column(String(20), nullable=True)
    Country = Column(String(100), default="Bangladesh")

    ContactPerson = Column(String(150), nullable=True)
    ContactPersonPhone = Column(String(20), nullable=True)
    TaxVatNo = Column(String(50), nullable=True)
    OpeningBalance = Column(Numeric(12, 2), default=0)
    CreditLimit = Column(Numeric(12, 2), default=0)
    DueAmount = Column(Numeric(12, 2), default=0.00)

    Notes = Column(String(None), nullable=True)  # VARCHAR(MAX)
    Status = Column(String(20), default="Active")