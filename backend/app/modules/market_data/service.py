import asyncio

import httpx

from app.core.cache import get_or_set

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

CACHE_TTL_SECONDS = 30

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
