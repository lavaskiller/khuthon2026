from urllib.parse import quote_plus

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str
    API_V1_PREFIX: str
    DEBUG: bool

    MYSQL_HOST: str
    MYSQL_PORT: int
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_DB: str

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+aiomysql://{quote_plus(self.MYSQL_USER)}:{quote_plus(self.MYSQL_PASSWORD)}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    CORS_ORIGINS: list[str]

    UPLOAD_DIR: str

    class Config:
        env_file = ".env"


settings = Settings()
