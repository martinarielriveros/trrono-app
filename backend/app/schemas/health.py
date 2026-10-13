"""Schemas for health checks."""

from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health status response."""

    status: str = Field(default="ok", description="Overall service status")
    version: str = Field(description="Application version")
    environment: str = Field(description="Running environment (development, staging, production)")
    timestamp: datetime = Field(description="Current UTC timestamp")
    database: str = Field(description="Database connectivity status ('connected' or error)")
    postgis_installed: bool = Field(description="Whether PostGIS extension is installed and active")
    payments_mode: str = Field(description="Payments operation mode ('mock' or 'live')")
