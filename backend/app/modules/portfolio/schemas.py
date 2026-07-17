from datetime import date, datetime

from pydantic import BaseModel


class HoldingCreate(BaseModel):
    asset_symbol: str
    asset_type: str
    quantity: float
    purchase_price: float


class HoldingOut(HoldingCreate):
    id: int
    created_at: datetime
    is_active: bool
    removed_at: datetime | None = None

    class Config:
        from_attributes = True


class PortfolioSnapshotOut(BaseModel):
    snapshot_date: date
    total_value: float
    total_invested: float

    class Config:
        from_attributes = True
