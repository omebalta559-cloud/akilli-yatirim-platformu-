from fastapi import APIRouter, Depends, HTTPException

from app.modules.ai_advisor import service
from app.modules.ai_advisor.schemas import AdvisorAnswer, AdvisorQuestion
from app.modules.auth.service import get_current_user_id

router = APIRouter(prefix="/advisor", tags=["ai-advisor"])


@router.post("/ask", response_model=AdvisorAnswer)
def ask(payload: AdvisorQuestion, user_id: int = Depends(get_current_user_id)):
    try:
        answer = service.ask_advisor(payload.question, payload.portfolio_summary)
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
