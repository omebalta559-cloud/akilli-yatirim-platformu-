import asyncio
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.modules.ai_advisor import service as ai_advisor_service
from app.modules.ai_advisor.router import router as ai_advisor_router
from app.modules.auth.router import router as auth_router
from app.modules.market_data.router import router as market_data_router
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
async def refresh_news_on_startup():
    if "PYTEST_CURRENT_TEST" in os.environ:
        return

    async def safe_refresh():
        try:
            await asyncio.to_thread(ai_advisor_service.refresh_news_from_rss)
        except Exception:
            pass  # RAG baglami olmadan da danisman genel bilgiyle calismaya devam eder

    asyncio.create_task(safe_refresh())


@app.exception_handler(httpx.HTTPStatusError)
async def httpx_status_error_handler(request: Request, exc: httpx.HTTPStatusError):
    return JSONResponse(
        status_code=502,
        content={"detail": "Piyasa verisi saglayicisina ulasilamadi, lutfen daha sonra tekrar deneyin."},
    )


@app.exception_handler(httpx.RequestError)
async def httpx_request_error_handler(request: Request, exc: httpx.RequestError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Dis servise baglanirken bir sorun olustu, lutfen daha sonra tekrar deneyin."},
    )


@app.get("/")
def ana_sayfa():
    return {"mesaj": "Akilli Yatirim Danismani backend motoru basariyla calisti! 🚀"}
