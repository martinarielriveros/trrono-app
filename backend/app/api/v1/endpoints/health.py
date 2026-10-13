"""Health check endpoint."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health(db: Session = Depends(get_db)) -> HealthResponse:
    """Return system health status, DB connectivity, and PostGIS verification."""
    db_status = "connected"
    postgis_ok = False

    try:
        # Check basic database connectivity
        db.execute(text("SELECT 1"))

        # Check PostGIS extension
        result = db.execute(text("SELECT PostGIS_Version()")).scalar()
        if result:
            postgis_ok = True
    except Exception as exc:
        db_status = f"error: {exc!s}"
        postgis_ok = False

    return HealthResponse(
        status="ok" if (db_status == "connected" and postgis_ok) else "degraded",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(UTC),
        database=db_status,
        postgis_installed=postgis_ok,
        payments_mode=settings.PAYMENTS_MODE,
    )
