import logging
import sys


def setup_logging(environment: str = "development", level: int = logging.INFO) -> None:
    # Ortam adi format string'ine sabit olarak gomulur (process boyunca degismez),
    # boylece her log satirinda hangi ortamdan (development/production) geldigi gorulur.
    logging.basicConfig(
        level=level,
        format=f"%(asctime)s | %(levelname)-8s | [{environment.upper()}] | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
