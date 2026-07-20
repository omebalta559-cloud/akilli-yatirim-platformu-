import logging
import sys
import time
from datetime import datetime
from zoneinfo import ZoneInfo

ISTANBUL_TZ = ZoneInfo("Europe/Istanbul")


class IstanbulFormatter(logging.Formatter):
    # Konteynerler genelde UTC calisir; sunucunun saat dilimine bakmaksizin
    # log zaman damgalarini her zaman Turkiye saatiyle gostermek icin.
    def converter(self, timestamp: float) -> time.struct_time:
        return datetime.fromtimestamp(timestamp, tz=ISTANBUL_TZ).timetuple()


def setup_logging(environment: str = "development", level: int = logging.INFO) -> None:
    # Ortam adi format string'ine sabit olarak gomulur (process boyunca degismez),
    # boylece her log satirinda hangi ortamdan (development/production) geldigi gorulur.
    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(
        IstanbulFormatter(
            fmt=f"%(asctime)s | %(levelname)-8s | [{environment.upper()}] | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(level)
