from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models.expense import Expense, ExpenseCategory
from ..models.user import User
from ..schemas.expense import (
    ExpenseListItem, ExpenseSummary, ExpenseByCategory, ExpenseCreate,
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])

def generate_expense_no(db: Session, expense_date) -> str:
    year_str = expense_date.strftime("%Y")
    month_str = expense_date.strftime("%m")
    day_str = expense_date.strftime("%d")

    month_start = expense_date.replace(day=1)
    if expense_date.month == 12:
        month_end = expense_date.replace(year=expense_date.year + 1, month=1, day=1)
    else:
        month_end = expense_date.replace(month=expense_date.month + 1, day=1)

    count_this_month = (
        db.query(func.count(Expense.ExpenseID))
        .filter(Expense.ExpenseDate >= month_start, Expense.ExpenseDate < month_end)
        .scalar() or 0
    )
    return f"EXP-{year_str}{month_str}{day_str}{count_this_month + 1:04d}"



@router.get("/next-number")
def preview_next_expense_no(expense_date: date = Query(...), db: Session = Depends(get_db)):
    return {"expense_no": generate_expense_no(db, expense_date)}


def _filtered_query(db: Session, date_from, date_to, category_id, payment_method):
    query = db.query(Expense)
    if date_from:
        query = query.filter(Expense.ExpenseDate >= date_from)
    if date_to:
        query = query.filter(Expense.ExpenseDate <= date_to)
    if category_id:
        query = query.filter(Expense.CategoryID == category_id)
    if payment_method and payment_method != "All":
        query = query.filter(Expense.PaymentMethod == payment_method)
    return query


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    rows = db.query(ExpenseCategory).filter(ExpenseCategory.Status == "Active").all()
    return [{"id": c.CategoryID, "name": c.CategoryName} for c in rows]


@router.get("/summary", response_model=ExpenseSummary)
def get_summary(
    db: Session = Depends(get_db),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    category_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
):
    query = _filtered_query(db, date_from, date_to, category_id, payment_method)
    expenses = query.all()

    total = sum(float(e.Amount) for e in expenses)
    count = len(expenses)
    avg = total / count if count else 0
    highest = max(expenses, key=lambda e: e.Amount, default=None)

    highest_category = None
    if highest:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.CategoryID == highest.CategoryID).first()
        highest_category = cat.CategoryName if cat else None

    return ExpenseSummary(
        TotalExpenses=total,
        TotalTransactions=count,
        AverageExpense=avg,
        HighestExpenseAmount=float(highest.Amount) if highest else 0,
        HighestExpenseCategory=highest_category,
    )


@router.get("/by-category", response_model=List[ExpenseByCategory])
def get_by_category(
    db: Session = Depends(get_db),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
):
    query = db.query(
        ExpenseCategory.CategoryName,
        func.coalesce(func.sum(Expense.Amount), 0).label("total"),
    ).join(Expense, Expense.CategoryID == ExpenseCategory.CategoryID)

    if date_from:
        query = query.filter(Expense.ExpenseDate >= date_from)
    if date_to:
        query = query.filter(Expense.ExpenseDate <= date_to)

    rows = query.group_by(ExpenseCategory.CategoryName).all()
    grand_total = sum(float(r.total) for r in rows) or 1

    return [
        ExpenseByCategory(
            CategoryName=r.CategoryName,
            Amount=float(r.total),
            Percent=round((float(r.total) / grand_total) * 100, 1),
        )
        for r in rows
    ]


@router.get("/", response_model=List[ExpenseListItem])
def get_expenses(
    db: Session = Depends(get_db),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    category_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
):
    query = _filtered_query(db, date_from, date_to, category_id, payment_method).options(
        joinedload(Expense.category), joinedload(Expense.creator)
    )
    expenses = query.order_by(Expense.ExpenseDate.desc()).all()

    return [
        ExpenseListItem(
            ExpenseID=e.ExpenseID,
            ExpenseNo=e.ExpenseNo,
            ExpenseDate=e.ExpenseDate,
            CategoryName=e.category.CategoryName if e.category else "—",
            Description=e.Description,
            Amount=float(e.Amount),
            PaymentMethod=e.PaymentMethod,
            ReferenceNo=e.ReferenceNo,
            Status=e.Status,
            CreatedByName=e.creator.FullName if e.creator else "—",
        )
        for e in expenses
    ]


@router.post("/")
def create_expense(payload: ExpenseCreate, created_by: int = Query(...), branch_id: int = Query(...), company_id: int = Query(...), db: Session = Depends(get_db)):
    expense = Expense(
        ExpenseNo=generate_expense_no(db, payload.ExpenseDate),
        CompanyID=company_id,
        BranchID=branch_id,
        ExpenseDate=payload.ExpenseDate,
        CategoryID=payload.CategoryID,
        Description=payload.Description,
        Amount=payload.Amount,
        PaymentMethod=payload.PaymentMethod,
        ReferenceNo=payload.ReferenceNo,
        SupplierID=payload.SupplierID,
        Note=payload.Note,
        IsRecurring=payload.IsRecurring or False,
        Status=payload.Status or "Paid",
        CreatedBy=created_by,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"ExpenseID": expense.ExpenseID, "ExpenseNo": expense.ExpenseNo}

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.ExpenseID == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

from pydantic import BaseModel

class CategoryCreate(BaseModel):
    CategoryName: str

@router.post("/categories")
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(ExpenseCategory).filter(ExpenseCategory.CategoryName == payload.CategoryName).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists.")

    category = ExpenseCategory(CategoryName=payload.CategoryName)
    db.add(category)
    db.commit()
    db.refresh(category)
    return {"id": category.CategoryID, "name": category.CategoryName}