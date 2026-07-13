from fastapi import APIRouter, Query

from app.modules.market_data import service

router = APIRouter(prefix="/market", tags=["market-data"])


@router.get("/crypto")
async def crypto_prices(coins: str = Query("bitcoin,ethereum"), vs_currency: str = "usd"):
    coin_ids = coins.split(",")
    return await service.get_crypto_prices(coin_ids, vs_currency)


@router.get("/forex")
async def forex_rates(base: str = "USD", symbols: str = Query("TRY,EUR")):
    return await service.get_exchange_rates(base, symbols.split(","))


@router.get("/gold")
async def gold_prices():
    return await service.get_gold_prices()


@router.get("/stocks")
async def stock_prices(symbols: str | None = None):
    symbol_list = symbols.split(",") if symbols else None
    return await service.get_stock_prices(symbol_list)


@router.get("/history")
async def price_history(symbol: str, range: str = "1y", interval: str = "1wk"):
    return await service.get_price_history(symbol, range, interval)
