import asyncio

import httpx

from app.core.cache import get_or_set
from app.core.config import settings

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest"
COLLECTAPI_GOLD_URL = "https://api.collectapi.com/economy/goldPrice"
YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}.IS"

CACHE_TTL_SECONDS = 30
GOLD_CACHE_TTL_SECONDS = 3600  # collectapi ucretsiz plan ayda 100 istekle sinirli

DEFAULT_BIST_SYMBOLS = [
    "AKBNK",
    "THYAO",
    "ASELS",
    "GARAN",
    "BIMAS",
    "EREGL",
    "KCHOL",
    "SISE",
    "TUPRS",
    "YKBNK",
]

YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0"}


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

    return await get_or_set("market:gold", GOLD_CACHE_TTL_SECONDS, fetch)


async def _fetch_yahoo_stock(symbol: str) -> dict:
    url = YAHOO_CHART_URL.format(symbol=symbol)
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, headers=YAHOO_HEADERS)
        response.raise_for_status()
        data = response.json()

    meta = data["chart"]["result"][0]["meta"]
    price = meta["regularMarketPrice"]
    previous_close = meta.get("previousClose") or meta.get("chartPreviousClose")
    rate = round((price - previous_close) / previous_close * 100, 2) if previous_close else 0
    return {"name": symbol, "price": price, "rate": rate}


async def get_stock_prices(symbols: list[str] | None = None) -> dict:
    symbols = symbols or DEFAULT_BIST_SYMBOLS

    async def fetch():
        results = await asyncio.gather(*(_fetch_yahoo_stock(s) for s in symbols))
        return {"result": results}

    cache_key = f"market:stocks:{','.join(sorted(symbols))}"
    return await get_or_set(cache_key, CACHE_TTL_SECONDS, fetch)
