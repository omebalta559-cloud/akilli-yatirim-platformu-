from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Loglarda hangi ortamdan geldigini ayirt etmek icin: yerelde "development",
    # Render'da ortam degiskeni olarak "production" verilir.
    environment: str = "development"
    app_name: str = "Akilli Yatirim Danismani"
    database_url: str = "postgresql://postgres:postgres@postgres:5432/yatirim"
    redis_url: str = "redis://redis:6379/0"
    # ChromaDB artik ayri bir sunucu olarak degil, gomulu (embedded) modda
    # calisiyor: veriler bu dizine diske yazilir, ayri bir servise gerek yok.
    chroma_persist_dir: str = "/chroma_data"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    gemini_api_key: str = ""
    google_client_id: str = ""
    # CoinGecko'nun ucretsiz Demo API anahtari: paylasimli bulut sunucu IP'lerinden
    # (Render, Railway vb.) gelen isteklerin oran sinirlamasina takilma ihtimalini
    # azaltir. Bos birakilirsa anahtarsiz (anonim) istek atilir.
    coingecko_api_key: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    # TUIK'in acikladigi son yillik TUFE orani (%). Canli bir TCMB EVDS API
    # entegrasyonu denendi ancak TCMB altyapisi (evds2 -> evds3 gecisi) API
    # istegini yonlendirip engelledigi icin bu deger elle guncellenmelidir.
    # Kaynak: TUIK, Haziran 2026 TUFE yillik degisim orani.
    annual_tufe_rate: float = 32.11
    annual_tufe_period: str = "2026-06"

    class Config:
        env_file = ".env"


settings = Settings()
