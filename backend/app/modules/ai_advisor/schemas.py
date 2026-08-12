from datetime import datetime

from pydantic import BaseModel


class AdvisorQuestion(BaseModel):
    question: str
    portfolio_summary: str = ""
    # Kullanicinin arayuz dili: "tr" (varsayilan) veya "en". Danisman cevabini
    # bu dilde uretir.
    lang: str = "tr"


class AdvisorAnswer(BaseModel):
    answer: str


class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
