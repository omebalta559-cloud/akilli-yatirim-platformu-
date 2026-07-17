from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AlertCreate(BaseModel):
    asset_symbol: str
    asset_type: str
    target_price: float
    direction: Literal["ustunde", "altinda"]


class AlertOut(BaseModel):
    id: int
    asset_symbol: str
    asset_type: str
    target_price: float
    direction: str
    is_triggered: bool
    created_at: datetime
    triggered_at: datetime | None = None

    class Config:
        from_attributes = True
