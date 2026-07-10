from pydantic import BaseModel


class AdvisorQuestion(BaseModel):
    question: str
    portfolio_summary: str = ""


class AdvisorAnswer(BaseModel):
    answer: str
