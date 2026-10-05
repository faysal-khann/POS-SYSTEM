from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

MethodType = Literal["Cash", "Card", "Mobile"]


class PaymentProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ProviderID: int
    Method: MethodType
    Name: str
    SortOrder: int = 0
    IsActive: bool = True


class PaymentProviderCreate(BaseModel):
    CompanyID: int
    Method: MethodType
    Name: str = Field(min_length=1, max_length=100)
    SortOrder: int = 0


class PaymentProviderUpdate(BaseModel):
    Name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    SortOrder: Optional[int] = None
    IsActive: Optional[bool] = None


class PaymentIn(BaseModel):
    Method: MethodType
    ProviderID: Optional[int] = None
    Provider: Optional[str] = None          # ignored by the server, name is read from DB
    Amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    Reference: Optional[str] = Field(default=None, max_length=100)