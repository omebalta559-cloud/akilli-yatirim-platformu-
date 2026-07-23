import asyncio
import logging
import os
import random

import httpx
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("keepalive")

app = FastAPI(title="Keepalive Companion")

# Ana backend'in genel adresi, sonundaki "/" olmadan (ornek: https://akilli-yatirim-platformu.onrender.com)
PARTNER_URL = os.environ.get("PARTNER_URL", "").rstrip("/")
PING_INTERVAL_SECONDS = 10 * 60
JITTER_SECONDS = 4 * 60


@app.get("/")
def health():
    return {"status": "ok"}


@app.on_event("startup")
async def ping_partner_periodically():
    if not PARTNER_URL:
        logger.warning("PARTNER_URL tanimli degil, ping dongusu baslatilmiyor.")
        return

    async def loop():
        async with httpx.AsyncClient(timeout=30) as client:
            while True:
                await asyncio.sleep(random.uniform(0, JITTER_SECONDS))
                try:
                    response = await client.get(f"{PARTNER_URL}/")
                    logger.info("Partner ping basarili: %s -> %s", PARTNER_URL, response.status_code)
                except Exception:
                    logger.warning("Partner ping basarisiz: %s", PARTNER_URL, exc_info=True)
                await asyncio.sleep(PING_INTERVAL_SECONDS - JITTER_SECONDS)

    asyncio.create_task(loop())
