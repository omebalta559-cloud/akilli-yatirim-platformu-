import asyncio
import functools
import logging
import time


def log_calls(func):
    """Fonksiyon cagrisini, suresini ve varsa hatasini otomatik loglar.

    Hem senkron hem async (coroutine) fonksiyonlarla calisir.
    """
    logger = logging.getLogger(func.__module__)

    if asyncio.iscoroutinefunction(func):

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger.info("%s çağrıldı", func.__qualname__)
            start = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
            except Exception:
                logger.exception("%s hata verdi", func.__qualname__)
                raise
            else:
                elapsed = time.perf_counter() - start
                logger.info("%s tamamlandı (%.2f sn)", func.__qualname__, elapsed)
                return result

        return async_wrapper

    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        logger.info("%s çağrıldı", func.__qualname__)
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
        except Exception:
            logger.exception("%s hata verdi", func.__qualname__)
            raise
        else:
            elapsed = time.perf_counter() - start
            logger.info("%s tamamlandı (%.2f sn)", func.__qualname__, elapsed)
            return result

    return sync_wrapper
