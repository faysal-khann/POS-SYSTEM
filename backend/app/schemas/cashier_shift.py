from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ShiftSummaryOut(BaseModel):
    TotalSales: float
    TotalReturns: float
    NetSales: float
    TotalReceived: float
    CashSales: float
    CashRefunds: float


class CashierShiftCreate(BaseModel):
    CompanyID: int
    BranchID: int
    UserID: int
    ClosedByUserID: int
    ShiftName: str
    ShiftDate: date
    WindowStart: datetime
    WindowEnd: datetime
    OpeningBalance: float = 0
    ActualClosing: float
    Note: Optional[str] = None


class CashierShiftOut(BaseModel):
    ShiftID: int
    CalculatedClosing: float
    ActualClosing: float
    Difference: float