from datetime import date as date_type

from sqlalchemy.orm import Session

from app.modules.market_data import service as market_data_service
from app.modules.portfolio.models import Holding, PortfolioSnapshot


async def ensure_today_snapshot(db: Session, user_id: int) -> None:
    today = date_type.today()
    existing = (
        db.query(PortfolioSnapshot)
        .filter(PortfolioSnapshot.user_id == user_id, PortfolioSnapshot.snapshot_date == today)
        .first()
    )
    if existing:
        return

    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active.is_(True))
        .all()
    )
    if not holdings:
        return

    total_value = 0.0
    total_invested = 0.0
    for h in holdings:
        current_price = await market_data_service.get_current_price(h.asset_type, h.asset_symbol)
        value = (current_price * h.quantity) if current_price is not None else h.purchase_price * h.quantity
        total_value += value
        total_invested += h.purchase_price * h.quantity

    db.add(
        PortfolioSnapshot(
            user_id=user_id,
            snapshot_date=today,
            total_value=total_value,
            total_invested=total_invested,
        )
    )
    db.commit()
