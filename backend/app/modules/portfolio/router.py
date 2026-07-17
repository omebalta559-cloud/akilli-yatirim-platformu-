from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.service import get_current_user_id
from app.modules.portfolio import performance as performance_service
from app.modules.portfolio import report as report_service
from app.modules.portfolio.models import Holding, PortfolioSnapshot
from app.modules.portfolio.schemas import HoldingCreate, HoldingOut, PortfolioSnapshotOut

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


@router.get("/performance", response_model=list[PortfolioSnapshotOut])
async def get_performance(
    user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    await performance_service.ensure_today_snapshot(db, user_id)
    return (
        db.query(PortfolioSnapshot)
        .filter(PortfolioSnapshot.user_id == user_id)
        .order_by(PortfolioSnapshot.snapshot_date.asc())
        .all()
    )


@router.get("/report")
async def download_report(
    format: Literal["csv", "pdf"] = Query("pdf"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active.is_(True))
        .all()
    )
    rows = await report_service.build_report_rows(holdings)

    if format == "csv":
        content = report_service.build_csv(rows)
        media_type = "text/csv"
        filename = "portfoy_raporu.csv"
    else:
        content = report_service.build_pdf(rows)
        media_type = "application/pdf"
        filename = "portfoy_raporu.pdf"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
