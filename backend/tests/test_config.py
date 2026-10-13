"""Tests for configuration parsing and defaults."""

from app.core.config import Settings


def test_cors_origins_parsing() -> None:
    """Test that comma-separated origins string parses into a list."""
    settings = Settings(CORS_ORIGINS="http://localhost:5173, http://127.0.0.1:5173")
    assert isinstance(settings.CORS_ORIGINS, list)
    assert len(settings.CORS_ORIGINS) == 2
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert "http://127.0.0.1:5173" in settings.CORS_ORIGINS


def test_database_url_normalization() -> None:
    """Test standard PostgreSQL URL is converted to psycopg driver."""
    settings = Settings(DATABASE_URL="postgresql://user:pass@localhost:5432/db")
    assert settings.sync_database_url.startswith("postgresql+psycopg://")


def test_default_argentina_settings() -> None:
    """Test default timezone and currency settings."""
    settings = Settings()
    assert settings.TIMEZONE == "America/Argentina/Buenos_Aires"
    assert settings.DEFAULT_CURRENCY == "ARS"
