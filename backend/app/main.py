from fastapi import FastAPI

from app.modules.ai_advisor.router import router as ai_advisor_router
from app.modules.auth.router import router as auth_router
from app.modules.market_data.router import router as market_data_router
from app.modules.portfolio.router import router as portfolio_router

app = FastAPI(title="Akilli Yatirim Danismani")

app.include_router(auth_router)
app.include_router(market_data_router)
app.include_router(portfolio_router)
app.include_router(ai_advisor_router)


@app.get("/")
def ana_sayfa():
    return {"mesaj": "Akilli Yatirim Danismani backend motoru basariyla calisti! 🚀"}
