from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Akilli Yatirim Danismani"
    database_url: str = "postgresql://postgres:postgres@postgres:5432/yatirim"
    redis_url: str = "redis://redis:6379/0"
    chroma_host: str = "chromadb"
    chroma_port: int = 8000
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    gemini_api_key: str = ""
    collectapi_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
