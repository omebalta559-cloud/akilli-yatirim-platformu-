import httpx

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
FRANKFURTER_URL = "https://api.frankfurter.app/latest"


async def get_crypto_prices(coin_ids: list[str], vs_currency: str = "usd") -> dict:
    params = {"ids": ",".join(coin_ids), "vs_currencies": vs_currency}
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(COINGECKO_URL, params=params)
        response.raise_for_status()
        return response.json()


async def get_exchange_rates(base: str = "USD", symbols: list[str] | None = None) -> dict:
    params = {"from": base}
    if symbols:
        params["to"] = ",".join(symbols)
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(FRANKFURTER_URL, params=params)
        response.raise_for_status()
        return response.json()
