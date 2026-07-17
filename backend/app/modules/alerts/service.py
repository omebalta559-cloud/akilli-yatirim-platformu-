import asyncio
from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.core.email import send_email
from app.modules.alerts.models import PriceAlert
from app.modules.auth.models import User
from app.modules.market_data import service as market_data_service

ASSET_TYPE_LABELS = {
    "kripto": "Kripto",
    "doviz": "Doviz",
    "altin": "Altin/Gumus",
    "hisse": "Hisse Senedi",
    "gayrimenkul": "Gayrimenkul",
}


def is_target_reached(direction: str, current_price: float, target_price: float) -> bool:
    if direction == "ustunde":
        return current_price >= target_price
    return current_price <= target_price


async def check_alerts() -> int:
    db = SessionLocal()
    try:
        alerts = db.query(PriceAlert).filter(PriceAlert.is_triggered.is_(False)).all()
        if not alerts:
            return 0

        price_cache: dict[tuple[str, str], float | None] = {}
        newly_triggered: list[tuple[PriceAlert, float]] = []

        for alert in alerts:
            key = (alert.asset_type, alert.asset_symbol)
            if key not in price_cache:
                price_cache[key] = await market_data_service.get_current_price(*key)
            current_price = price_cache[key]
            if current_price is None:
                continue

            if is_target_reached(alert.direction, current_price, alert.target_price):
                alert.is_triggered = True
                alert.triggered_at = datetime.now(timezone.utc)
                newly_triggered.append((alert, current_price))

        if not newly_triggered:
            return 0

        emails_to_send: list[tuple[str, str, str]] = []
        for alert, current_price in newly_triggered:
            user = db.query(User).filter(User.id == alert.user_id).first()
            if not user:
                continue
            label = ASSET_TYPE_LABELS.get(alert.asset_type, alert.asset_type)
            direction_text = "ustune cikti" if alert.direction == "ustunde" else "altina dustu"
            subject = f"Fiyat alarmi: {alert.asset_symbol} {direction_text}"
            body = (
                f"{label} - {alert.asset_symbol} hedef fiyatiniz olan {alert.target_price} "
                f"degerinin {direction_text}.\n"
                f"Guncel fiyat: {current_price}\n\n"
                "Bu e-posta Akilli Yatirim Danismani platformundaki fiyat alarminiz icin "
                "otomatik gonderilmistir. Yatirim tavsiyesi degildir."
            )
            emails_to_send.append((user.email, subject, body))

        db.commit()
        triggered_count = len(newly_triggered)
    finally:
        db.close()

    for to, subject, body in emails_to_send:
        try:
            await asyncio.to_thread(send_email, to, subject, body)
        except Exception:
            pass  # e-posta gonderilemese bile alarm tetiklenmis olarak isaretli kalir

    return triggered_count
