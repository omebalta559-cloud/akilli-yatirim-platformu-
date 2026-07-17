from datetime import datetime

from pydantic import BaseModel


class AdvisorQuestion(BaseModel):
    question: str
    portfolio_summary: str = ""


class AdvisorAnswer(BaseModel):
    answer: str


class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
