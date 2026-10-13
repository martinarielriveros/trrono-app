"""Application configuration using Pydantic Settings."""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for Tronno Backend."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # General
    PROJECT_NAME: str = "Tronno API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database
    POSTGRES_USER: str = "tronno_user"
    POSTGRES_PASSWORD: str = "tronno_password"
    POSTGRES_DB: str = "tronno_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://tronno_user:tronno_password@localhost:5432/tronno_db"
    )

    # Security & Auth
    SECRET_KEY: str = "tronno_dev_secret_key_change_me_in_production_min_32_chars_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Localization
    TIMEZONE: str = "America/Argentina/Buenos_Aires"
    DEFAULT_CURRENCY: str = "ARS"

    # CORS
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Payments
    PAYMENTS_MODE: str = "mock"  # "mock" | "live"
    MERCADO_PAGO_ACCESS_TOKEN: str = ""
    MERCADO_PAGO_PUBLIC_KEY: str = ""
    MERCADO_PAGO_WEBHOOK_SECRET: str = ""

    # Cloudinary Photos
    CLOUDINARY_CLOUD_NAME: str = "tronno_dev"
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_UPLOAD_PRESET: str = "tronno_bathrooms"

    # Business Rules
    MIN_BATHROOM_PRICE: float = 300.0

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Admin seed defaults
    ADMIN_EMAIL: str = "admin@tronno.com.ar"
    ADMIN_PASSWORD: str = "Admin12345!"

    # Email
    EMAILS_TO_CONSOLE: bool = True
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM: str = "hola@tronno.com.ar"

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def sync_database_url(self) -> str:
        """Ensure standard psycopg driver url."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()
