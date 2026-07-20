import asyncio
import logging
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.modules.ai_advisor import service as ai_advisor_service
from app.modules.ai_advisor.router import router as ai_advisor_router
from app.modules.alerts import service as alerts_service
from app.modules.alerts.router import router as alerts_router
from app.modules.auth.router import router as auth_router
from app.modules.market_data.router import router as market_data_router
from app.modules.portfolio.router import router as portfolio_router

setup_logging(settings.environment)
logger = logging.getLogger(__name__)
logger.info("Uygulama başlatılıyor (ortam: %s)", settings.environment)

app = FastAPI(title="Akıllı Yatırım Danışmanı")

app.add_middleware(
    CORSMiddleware,
    # localhost + herhangi bir yerel ag (LAN) IP'si, 3000 portu: telefondan/DHCP ile
    # degisen IP'lerden erisimi de kapsar, boylece IP degistiginde tekrar duzenlemeye gerek kalmaz.
    # Ayrica Vercel'in verdigi *.vercel.app domain'lerini de kapsar (production + preview deploy'lar).
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):3000|https://([a-zA-Z0-9-]+\.)*vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(market_data_router)
app.include_router(portfolio_router)
app.include_router(ai_advisor_router)
app.include_router(alerts_router)


@app.on_event("startup")
async def refresh_news_on_startup():
    if "PYTEST_CURRENT_TEST" in os.environ:
        return

    async def safe_refresh():
        try:
            await asyncio.to_thread(ai_advisor_service.refresh_news_from_rss)
            logger.info("Haber akışı (RSS) başarıyla ChromaDB'ye yenilendi.")
        except Exception:
            logger.exception("Haber akışı yenilenemedi, danışman genel bilgiyle devam edecek.")

    asyncio.create_task(safe_refresh())


@app.on_event("startup")
async def check_alerts_periodically():
    if "PYTEST_CURRENT_TEST" in os.environ:
        return

    async def loop():
        while True:
            try:
                triggered = await alerts_service.check_alerts()
                if triggered:
                    logger.info("%d fiyat alarmı tetiklendi.", triggered)
            except Exception:
                logger.exception("Alarm kontrol döngüsünde hata oluştu, bir sonraki döngüde tekrar denenecek.")
            await asyncio.sleep(60)

    asyncio.create_task(loop())


@app.exception_handler(httpx.HTTPStatusError)
async def httpx_status_error_handler(request: Request, exc: httpx.HTTPStatusError):
    logger.warning("Dış API hata kodu döndü: %s %s -> %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=502,
        content={"detail": "Piyasa verisi sağlayıcısına ulaşılamadı, lütfen daha sonra tekrar deneyin."},
    )


@app.exception_handler(httpx.RequestError)
async def httpx_request_error_handler(request: Request, exc: httpx.RequestError):
    logger.warning("Dış servise bağlanırken hata oluştu: %s %s -> %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Dış servise bağlanırken bir sorun oluştu, lütfen daha sonra tekrar deneyin."},
    )


@app.get("/")
def ana_sayfa():
    return {"mesaj": "Akıllı Yatırım Danışmanı backend motoru başarıyla çalıştı! 🚀"}
