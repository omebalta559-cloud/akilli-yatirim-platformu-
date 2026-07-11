import httpx

from app.core.cache import get_or_set
from app.core.config import settings

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest"
COLLECTAPI_GOLD_URL = "https://api.collectapi.com/economy/goldPrice"
COLLECTAPI_STOCK_URL = "https://api.collectapi.com/economy/liveBorsa"

CACHE_TTL_SECONDS = 30


def _collectapi_headers() -> dict:
    return {
        "authorization": f"apikey {settings.collectapi_key}",
        "content-type": "application/json",
    }


async def get_crypto_prices(coin_ids: list[str], vs_currency: str = "usd") -> dict:
    async def fetch():
        params = {"ids": ",".join(coin_ids), "vs_currencies": vs_currency}
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(COINGECKO_URL, params=params)
            response.raise_for_status()
            return response.json()

    cache_key = f"market:crypto:{','.join(sorted(coin_ids))}:{vs_currency}"
    return await get_or_set(cache_key, CACHE_TTL_SECONDS, fetch)


async def get_exchange_rates(base: str = "USD", symbols: list[str] | None = None) -> dict:
    async def fetch():
        params = {"from": base}
        if symbols:
            params["to"] = ",".join(symbols)
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(FRANKFURTER_URL, params=params)
            response.raise_for_status()
            return response.json()

    cache_key = f"market:forex:{base}:{','.join(sorted(symbols or []))}"
    return await get_or_set(cache_key, CACHE_TTL_SECONDS, fetch)


async def get_gold_prices() -> dict:
    async def fetch():
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(COLLECTAPI_GOLD_URL, headers=_collectapi_headers())
            response.raise_for_status()
            return response.json()

    return await get_or_set("market:gold", CACHE_TTL_SECONDS, fetch)


async def get_stock_prices() -> dict:
    async def fetch():
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(COLLECTAPI_STOCK_URL, headers=_collectapi_headers())
            response.raise_for_status()
            return response.json()

    return await get_or_set("market:stocks", CACHE_TTL_SECONDS, fetch)
