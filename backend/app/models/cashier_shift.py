from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class CashierShift(Base):
    __tablename__ = "CashierShifts"
    ShiftID = Column(Integer, primary_key=True, autoincrement=True)
    CompanyID = Column(Integer, nullable=False)
    BranchID = Column(Integer, nullable=False)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)          # the cashier
    ClosedByUserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)  # who pressed Close Shift
    ShiftName = Column(String(50), nullable=False)
    ShiftDate = Column(Date, nullable=False)
    StartTime = Column(DateTime, nullable=False)  # window, stored in UTC like Sales.SaleDate
    EndTime = Column(DateTime, nullable=False)
    OpeningBalance = Column(Numeric(18, 2), default=0)
    TotalSales = Column(Numeric(18, 2), default=0)
    TotalReturns = Column(Numeric(18, 2), default=0)
    NetSales = Column(Numeric(18, 2), default=0)
    TotalReceived = Column(Numeric(18, 2), default=0)
    CashSales = Column(Numeric(18, 2), default=0)
    CashRefunds = Column(Numeric(18, 2), default=0)
    CalculatedClosing = Column(Numeric(18, 2), default=0)
    ActualClosing = Column(Numeric(18, 2), default=0)
    Difference = Column(Numeric(18, 2), default=0)
    Note = Column(String(500))
    Status = Column(String(20), default="Closed")
    ClosedAt = Column(DateTime, server_default=func.now())