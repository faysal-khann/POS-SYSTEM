from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class ExpenseCategory(Base):
    __tablename__ = "ExpenseCategories"
    CategoryID = Column(Integer, primary_key=True, autoincrement=True)
    CategoryName = Column(String(100), nullable=False)
    Status = Column(String(20), default="Active")


class Expense(Base):
    __tablename__ = "Expenses"
    ExpenseID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyID = Column(Integer, nullable=False)
    BranchID = Column(Integer, ForeignKey("Branches.BranchID"), nullable=False)
    ExpenseDate = Column(Date, nullable=False)
    CategoryID = Column(Integer, ForeignKey("ExpenseCategories.CategoryID"), nullable=False)
    Description = Column(String(255))
    Amount = Column(Numeric(18, 2), nullable=False)
    PaymentMethod = Column(String(30), nullable=False)
    ReferenceNo = Column(String(50))
    SupplierID = Column(Integer, ForeignKey("Suppliers.SupplierId"), nullable=True)
    Note = Column(String(500))
    IsRecurring = Column(Boolean, default=False)

    CreatedBy = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    CreatedAt = Column(DateTime, server_default=func.now())
    ExpenseNo = Column(String(30), nullable=False)
    Status = Column(String(20), default="Paid")  # 'Paid', 'Incomplete'
    
    category = relationship("ExpenseCategory")
    supplier = relationship("Supplier")
    creator = relationship("User")