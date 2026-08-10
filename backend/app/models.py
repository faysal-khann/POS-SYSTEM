from sqlalchemy import Column, Integer, String, Numeric
from .database import Base


class Supplier(Base):
    __tablename__ = "Suppliers"

    SupplierId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    SupplierCode = Column(String(20), unique=True, nullable=False)
    SupplierName = Column(String(100), nullable=False)
    Phone = Column(String(20), nullable=True)
    Email = Column(String(100), nullable=True)
    City = Column(String(50), nullable=True)
    DueAmount = Column(Numeric(12, 2), default=0.00)
    Status = Column(String(20), default="Active")