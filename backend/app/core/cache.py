import json
import logging
from typing import Awaitable, Callable

import redis.asyncio as redis

from app.core.config import settings

_redis_client = redis.from_url(settings.redis_url, decode_responses=True)

logger = logging.getLogger(__name__)

# Bayat (stale) yedek, taze TTL'den cok daha uzun sure saklanir; disaridan
# gelen servis (CoinGecko vb.) gecici olarak basarisiz oldugunda kullaniciya
# hata gostermek yerine bu son bilinen degeri donebilmek icin.
STALE_TTL_SECONDS = 6 * 60 * 60


async def get_or_set(key: str, ttl_seconds: int, fetch: Callable[[], Awaitable[dict]]) -> dict:
    cached = await _redis_client.get(key)
    if cached is not None:
        return json.loads(cached)

    stale_key = f"{key}:stale"
    try:
        data = await fetch()
    except Exception:
        stale = await _redis_client.get(stale_key)
        if stale is not None:
            logger.warning("Kaynak basarisiz oldu, bayat onbellek donduruluyor: %s", key)
            return json.loads(stale)
        raise

    payload = json.dumps(data)
    await _redis_client.set(key, payload, ex=ttl_seconds)
    await _redis_client.set(stale_key, payload, ex=STALE_TTL_SECONDS)
    return data
