from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.alerts.models import PriceAlert
from app.modules.alerts.schemas import AlertCreate, AlertOut
from app.modules.auth.service import get_current_user_id

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertOut])
def list_alerts(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == user_id)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )


@router.post("/", response_model=AlertOut)
def create_alert(
    payload: AlertCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    alert = PriceAlert(user_id=user_id, **payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == user_id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı")
    db.delete(alert)
    db.commit()
    return {"detail": "Alarm silindi"}
