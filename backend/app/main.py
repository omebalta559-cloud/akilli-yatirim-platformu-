from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.modules.ai_advisor.router import router as ai_advisor_router
from app.modules.auth.models import User  # noqa: F401
from app.modules.auth.router import router as auth_router
from app.modules.market_data.router import router as market_data_router
from app.modules.portfolio.models import Holding  # noqa: F401
from app.modules.portfolio.router import router as portfolio_router

app = FastAPI(title="Akilli Yatirim Danismani")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(market_data_router)
app.include_router(portfolio_router)
app.include_router(ai_advisor_router)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def ana_sayfa():
    return {"mesaj": "Akilli Yatirim Danismani backend motoru basariyla calisti! 🚀"}
