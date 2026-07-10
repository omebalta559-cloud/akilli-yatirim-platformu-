from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.service import get_current_user_id
from app.modules.portfolio.models import Holding
from app.modules.portfolio.schemas import HoldingCreate, HoldingOut

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/", response_model=list[HoldingOut])
def list_holdings(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Holding).filter(Holding.user_id == user_id).all()


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
    db.query(Holding).filter(Holding.id == holding_id, Holding.user_id == user_id).delete()
    db.commit()
    return {"ok": True}
