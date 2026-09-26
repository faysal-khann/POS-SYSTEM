from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class ExpenseListItem(BaseModel):
    ExpenseID: int
    ExpenseDate: date
    CategoryName: str
    Description: Optional[str] = None
    Amount: float
    PaymentMethod: str
    ReferenceNo: Optional[str] = None
    CreatedByName: str
    ExpenseNo: str
    Status: str
    

    class Config:
        from_attributes = True


class ExpenseSummary(BaseModel):
    TotalExpenses: float
    TotalTransactions: int
    AverageExpense: float
    HighestExpenseAmount: float
    HighestExpenseCategory: Optional[str] = None


class ExpenseByCategory(BaseModel):
    CategoryName: str
    Amount: float
    Percent: float


class ExpenseCreate(BaseModel):
    ExpenseDate: date
    CategoryID: int
    Amount: float
    PaymentMethod: str
    ReferenceNo: Optional[str] = None
    SupplierID: Optional[int] = None
    Description: Optional[str] = None
    Note: Optional[str] = None
    IsRecurring: Optional[bool] = False
    Status: Optional[str] = "Paid"
    