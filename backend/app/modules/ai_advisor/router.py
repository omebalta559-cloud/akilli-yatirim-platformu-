import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai_advisor import service
from app.modules.ai_advisor.schemas import AdvisorAnswer, AdvisorQuestion
from app.modules.auth.service import get_current_user_id
from app.modules.portfolio.models import Holding

router = APIRouter(prefix="/advisor", tags=["ai-advisor"])


@router.post("/ask", response_model=AdvisorAnswer)
async def ask(
    payload: AdvisorQuestion,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active.is_(True))
        .all()
    )

    try:
        chart_context = await service.build_portfolio_chart_context(holdings)
        answer = await asyncio.to_thread(
            service.ask_advisor, payload.question, payload.portfolio_summary, chart_context
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI danisman su an yanit veremiyor, lutfen birazdan tekrar deneyin.",
        )
    return AdvisorAnswer(answer=answer)


@router.post("/refresh-news")
def refresh_news(user_id: int = Depends(get_current_user_id)):
    try:
        count = service.refresh_news_from_rss()
    except Exception:
        raise HTTPException(status_code=502, detail="Haberler alinirken bir sorun olustu.")
    return {"added": count}
