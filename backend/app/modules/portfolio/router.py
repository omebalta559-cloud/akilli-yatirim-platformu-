from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.service import get_current_user_id
from app.modules.portfolio.models import Holding
from app.modules.portfolio.schemas import HoldingCreate, HoldingOut

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/", response_model=list[HoldingOut])
def list_holdings(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active.is_(True))
        .order_by(Holding.created_at.desc())
        .all()
    )


@router.get("/history", response_model=list[HoldingOut])
def holdings_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(Holding)
        .filter(Holding.user_id == user_id)
        .order_by(Holding.created_at.desc())
        .all()
    )


@router.post("/", response_model=HoldingOut)
def add_holding(
    payload: HoldingCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holding = Holding(user_id=user_id, **payload.model_dump())
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == user_id, Holding.is_active.is_(True))
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Varlik bulunamadi.")

    holding.is_active = False
    holding.removed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}
