import asyncio
from datetime import datetime, timezone

import httpx

from app.core.cache import get_or_set
from app.core.config import settings

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

CACHE_TTL_SECONDS = 30
HISTORY_CACHE_TTL_SECONDS = 3600

GRAMS_PER_TROY_OUNCE = 31.1034768
GOLD_FUTURES_SYMBOL = "GC=F"
SILVER_FUTURES_SYMBOL = "SI=F"

# resmi olmayan yaklasik degerler: madeni altinlarin milyem (saflik) agirlikli saf altin karsiligi (gram)
COIN_PURE_GOLD_GRAMS = {
    "Çeyrek Altın": 1.75 * 0.916,
    "Yarım Altın": 3.5 * 0.916,
    "Tam Altın": 7.0 * 0.916,
    "Cumhuriyet Altını": 7.216 * 0.916,
}

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

CRYPTO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XRP": "ripple",
    "DOGE": "dogecoin",
    "ADA": "cardano",
    "AVAX": "avalanche-2",
    "BNB": "binancecoin",
    "LTC": "litecoin",
    "MATIC": "matic-network",
}

GOLD_NAMES = {
    "GRAM_ALTIN": "Gram Altın",
    "CEYREK_ALTIN": "Çeyrek Altın",
    "YARIM_ALTIN": "Yarım Altın",
    "TAM_ALTIN": "Tam Altın",
    "CUMHURIYET_ALTINI": "Cumhuriyet Altını",
    "ONS_ALTIN": "ONS Altın",
    "GUMUS": "Gümüş",
}


async def get_crypto_prices(coin_ids: list[str], vs_currency: str = "usd") -> dict:
    async def fetch():
        params = {
            "ids": ",".join(coin_ids),
            "vs_currencies": vs_currency,
            "include_24hr_change": "true",
        }
        headers = {"x-cg-demo-api-key": settings.coingecko_api_key} if settings.coingecko_api_key else {}
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(COINGECKO_URL, params=params, headers=headers)
            response.raise_for_status()
            return response.json()

    cache_key = f"market:crypto:{','.join(sorted(coin_ids))}:{vs_currency}"
    return await get_or_set(cache_key, CACHE_TTL_SECONDS, fetch)


async def get_exchange_rates(base: str = "USD", symbols: list[str] | None = None) -> dict:
    symbols = symbols or ["TRY"]

    async def fetch():
        quotes = await asyncio.gather(*(_fetch_yahoo_quote(f"{base}{s}=X") for s in symbols))
        rates = {symbol: quote["price"] for symbol, quote in zip(symbols, quotes)}
        return {"amount": 1.0, "base": base, "rates": rates}

    cache_key = f"market:forex:{base}:{','.join(sorted(symbols))}"
    return await get_or_set(cache_key, CACHE_TTL_SECONDS, fetch)


async def _fetch_yahoo_quote(symbol: str) -> dict:
    url = YAHOO_CHART_URL.format(symbol=symbol)
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, headers=YAHOO_HEADERS)
        response.raise_for_status()
        data = response.json()

    meta = data["chart"]["result"][0]["meta"]
    price = meta["regularMarketPrice"]
    previous_close = meta.get("previousClose") or meta.get("chartPreviousClose")
    rate = round((price - previous_close) / previous_close * 100, 2) if previous_close else 0
    return {"price": price, "rate": rate}


async def _fetch_yahoo_stock(symbol: str) -> dict:
    quote = await _fetch_yahoo_quote(f"{symbol}.IS")
    return {"name": symbol, **quote}


async def get_gold_prices() -> dict:
    async def fetch():
        ons_gold, ons_silver, usd_try_data = await asyncio.gather(
            _fetch_yahoo_quote(GOLD_FUTURES_SYMBOL),
            _fetch_yahoo_quote(SILVER_FUTURES_SYMBOL),
            get_exchange_rates("USD", ["TRY"]),
        )
        usd_try = usd_try_data["rates"]["TRY"]

        gram_altin = ons_gold["price"] / GRAMS_PER_TROY_OUNCE * usd_try
        gumus = ons_silver["price"] / GRAMS_PER_TROY_OUNCE * usd_try

        items = [
            {"name": "Gram Altın", "buying": gram_altin, "selling": gram_altin, "rate": ons_gold["rate"]},
            {"name": "ONS Altın", "buying": ons_gold["price"], "selling": ons_gold["price"], "rate": ons_gold["rate"]},
            {"name": "Gümüş", "buying": gumus, "selling": gumus, "rate": ons_silver["rate"]},
        ]
        for coin_name, pure_grams in COIN_PURE_GOLD_GRAMS.items():
            coin_price = pure_grams * gram_altin
            items.append(
                {"name": coin_name, "buying": coin_price, "selling": coin_price, "rate": ons_gold["rate"]}
            )

        return {"success": True, "result": items}

    return await get_or_set("market:gold", CACHE_TTL_SECONDS, fetch)


async def get_stock_prices(symbols: list[str] | None = None) -> dict:
    symbols = symbols or DEFAULT_BIST_SYMBOLS

    async def fetch():
        results = await asyncio.gather(*(_fetch_yahoo_stock(s) for s in symbols))
        return {"result": results}

    cache_key = f"market:stocks:{','.join(sorted(symbols))}"
    return await get_or_set(cache_key, CACHE_TTL_SECONDS, fetch)


async def get_current_price(asset_type: str, asset_symbol: str) -> float | None:
    if asset_type == "kripto":
        coin_id = CRYPTO_IDS.get(asset_symbol)
        if not coin_id:
            return None
        data = await get_crypto_prices([coin_id])
        item = data.get(coin_id)
        return item["usd"] if item else None

    if asset_type == "doviz":
        data = await get_exchange_rates(asset_symbol, ["TRY"])
        return data["rates"].get("TRY")

    if asset_type == "altin":
        data = await get_gold_prices()
        name = GOLD_NAMES.get(asset_symbol)
        item = next((i for i in data["result"] if i["name"] == name), None)
        return item["selling"] if item else None

    if asset_type in ("hisse", "gayrimenkul"):
        try:
            quote = await _fetch_yahoo_quote(f"{asset_symbol}.IS")
        except (httpx.HTTPStatusError, httpx.RequestError, KeyError, IndexError):
            return None
        return quote["price"]

    return None


async def get_price_history(symbol: str, range_: str = "1y", interval: str = "1wk") -> dict:
    async def fetch():
        url = YAHOO_CHART_URL.format(symbol=symbol)
        params = {"range": range_, "interval": interval}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params, headers=YAHOO_HEADERS)
            response.raise_for_status()
            data = response.json()

        result = data["chart"]["result"][0]
        timestamps = result.get("timestamp", [])
        closes = result["indicators"]["quote"][0]["close"]

        points = [
            {
                "date": datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d"),
                "price": close,
            }
            for ts, close in zip(timestamps, closes)
            if close is not None
        ]
        return {"symbol": symbol, "points": points}

    cache_key = f"market:history:{symbol}:{range_}:{interval}"
    return await get_or_set(cache_key, HISTORY_CACHE_TTL_SECONDS, fetch)
