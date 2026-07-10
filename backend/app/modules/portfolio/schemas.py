from datetime import datetime

from pydantic import BaseModel


class HoldingCreate(BaseModel):
    asset_symbol: str
    asset_type: str
    quantity: float
    purchase_price: float


class HoldingOut(HoldingCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
