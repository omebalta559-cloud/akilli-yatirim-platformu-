import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai_advisor import service
from app.modules.ai_advisor.models import ChatMessage
from app.modules.ai_advisor.schemas import AdvisorAnswer, AdvisorQuestion, ChatMessageOut
from app.modules.auth.service import get_current_user_id
from app.modules.portfolio.models import Holding

router = APIRouter(prefix="/advisor", tags=["ai-advisor"])

HISTORY_MESSAGE_LIMIT = 10


@router.get("/history", response_model=list[ChatMessageOut])
def get_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.delete("/history")
def clear_history(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.commit()
    return {"detail": "Sohbet gecmisi temizlendi"}


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

    previous_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_MESSAGE_LIMIT)
        .all()
    )
    previous_messages.reverse()
    conversation_history = "\n".join(
        f"{'Kullanici' if m.role == 'user' else 'Asistan'}: {m.content}" for m in previous_messages
    )

    try:
        chart_context = await service.build_portfolio_chart_context(holdings)
        answer = await asyncio.to_thread(
            service.ask_advisor,
            payload.question,
            payload.portfolio_summary,
            chart_context,
            conversation_history,
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI danisman su an yanit veremiyor, lutfen birazdan tekrar deneyin.",
        )

    db.add(ChatMessage(user_id=user_id, role="user", content=payload.question))
    db.add(ChatMessage(user_id=user_id, role="assistant", content=answer))
    db.commit()

    return AdvisorAnswer(answer=answer)


@router.post("/refresh-news")
def refresh_news(user_id: int = Depends(get_current_user_id)):
    try:
        count = service.refresh_news_from_rss()
    except Exception:
        raise HTTPException(status_code=502, detail="Haberler alinirken bir sorun olustu.")
    return {"added": count}
