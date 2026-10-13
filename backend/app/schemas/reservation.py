"""Pydantic schemas for Bathroom Reservations."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ReservationCreate(BaseModel):
    """Schema to create a new reservation."""

    bathroom_id: str = Field(..., description="ID del baño a reservar")
    extra_ids: list[str] = Field(default_factory=list, description="IDs de extras seleccionados")
    turn_start: datetime | None = Field(
        default=None,
        description="Fecha y hora de inicio deseada. Si no se especifica, inicia en 5 minutos.",
    )


class ReservationBathroomSummary(BaseModel):
    """Basic bathroom data embedded in reservation responses."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    address: str
    city: str
    province: str
    latitude: float
    longitude: float
    photos: list[dict[str, Any]] = Field(default_factory=list)


class ReservationResponse(BaseModel):
    """Full reservation schema returned to clients."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    bathroom_id: str
    turn_start: datetime
    turn_end: datetime
    turn_duration_minutes: int
    status: str
    price_base: float
    price_extras: float
    total_price: float
    selected_extras: list[dict[str, Any]] = Field(default_factory=list)
    qr_token: str
    pin_code: str
    checked_in_at: datetime | None = None
    created_at: datetime
    bathroom: ReservationBathroomSummary | None = None


class ReservationListResponse(BaseModel):
    """Paginated list of reservations."""

    items: list[ReservationResponse]
    total: int
