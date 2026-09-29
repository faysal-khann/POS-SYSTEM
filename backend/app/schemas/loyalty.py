from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LoyaltySummaryItem(BaseModel):
    CustomerId: int
    CustomerCode: str
    CustomerName: str
    TotalPoints: int
    UsedPoints: int
    AvailablePoints: int
    Status: str


class LoyaltyHistoryItem(BaseModel):
    LoyaltyTransactionID: int
    Date: datetime
    RefNo: str
    TransactionType: str
    Points: int
    Description: Optional[str] = None
    By: Optional[str] = None

    class Config:
        from_attributes = True


class LoyaltyAdjustCreate(BaseModel):
    CustomerID: int
    ActionType: str  # Earn / Redeem / Adjust
    Points: int
    Description: Optional[str] = None
    CreatedByUserID: Optional[int] = None