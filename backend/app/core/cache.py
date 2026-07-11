import json
from typing import Awaitable, Callable

import redis.asyncio as redis

from app.core.config import settings

_redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def get_or_set(key: str, ttl_seconds: int, fetch: Callable[[], Awaitable[dict]]) -> dict:
    cached = await _redis_client.get(key)
    if cached is not None:
        return json.loads(cached)

    data = await fetch()
    await _redis_client.set(key, json.dumps(data), ex=ttl_seconds)
    return data
