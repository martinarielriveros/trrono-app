"""Pydantic schemas for Bathroom and BathroomExtra."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BathroomExtraBase(BaseModel):
    """Base schema for an extra service."""

    name: str = Field(..., min_length=2, max_length=100, description="Nombre del extra (ej. Ducha)")
    description: str | None = Field(None, max_length=255)
    price: float = Field(..., ge=0, description="Precio en pesos argentinos (ARS)")
    is_active: bool = True


class BathroomExtraCreate(BathroomExtraBase):
    """Schema to create a new extra."""

    pass


class BathroomExtraResponse(BathroomExtraBase):
    """Response schema for an extra."""

    id: str
    bathroom_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BathroomPhoto(BaseModel):
    """Photo reference from Cloudinary or local upload."""

    url: str
    public_id: str | None = None
    is_cover: bool = False


class OpeningHourDay(BaseModel):
    """Operating hours for a specific day of the week."""

    day_of_week: int = Field(..., ge=0, le=6, description="0=Lunes, 6=Domingo")
    day_name: str = Field(..., description="Nombre del día (ej. Lunes)")
    open_time: str = Field("08:00", description="Hora de apertura (HH:MM)")
    close_time: str = Field("20:00", description="Hora de cierre (HH:MM)")
    is_closed: bool = False


class BathroomBase(BaseModel):
    """Base schema for bathroom attributes."""

    title: str = Field(..., min_length=3, max_length=150, description="Título visible del baño")
    description: str | None = Field(None, max_length=2000)
    address: str = Field(..., min_length=3, max_length=255, description="Dirección y altura")
    city: str = Field("Buenos Aires", max_length=100)
    province: str = Field("CABA", max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    price_base: float = Field(..., ge=100.0, description="Precio base en ARS por turno")
    turn_duration_minutes: int = Field(15, ge=5, le=120, description="Duración de turno en minutos")
    cleaning_interval_minutes: int = Field(5, ge=0, le=60, description="Margen de limpieza")
    rules: list[str] = Field(default_factory=list, description="Reglas del baño")
    amenities: list[str] = Field(
        default_factory=list, description="Comodidades (ej. shower, accessible)"
    )
    opening_hours: list[OpeningHourDay] = Field(default_factory=list)
    photos: list[BathroomPhoto] = Field(default_factory=list)

    @field_validator("latitude")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitud inválida")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitud inválida")
        return v


class BathroomCreate(BathroomBase):
    """Schema for creating a new bathroom."""

    vendor_id: str | None = None
    extras: list[BathroomExtraCreate] = Field(default_factory=list)


class BathroomUpdate(BaseModel):
    """Schema for updating an existing bathroom."""

    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = None
    address: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    latitude: float | None = Field(None, ge=-90.0, le=90.0)
    longitude: float | None = Field(None, ge=-180.0, le=180.0)
    price_base: float | None = Field(None, ge=100.0)
    turn_duration_minutes: int | None = Field(None, ge=5, le=120)
    cleaning_interval_minutes: int | None = Field(None, ge=0, le=60)
    is_active: bool | None = None
    is_approved: bool | None = None
    rules: list[str] | None = None
    amenities: list[str] | None = None
    opening_hours: list[OpeningHourDay] | None = None
    photos: list[BathroomPhoto] | None = None
    extras: list[BathroomExtraCreate] | None = None


class BathroomResponse(BathroomBase):
    """Response schema for a single bathroom."""

    id: str
    vendor_id: str
    is_active: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    extras: list[BathroomExtraResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BathroomListResponse(BaseModel):
    """Response schema for paginated/listed bathrooms."""

    items: list[BathroomResponse]
    total: int


class BathroomSearchResult(BathroomResponse):
    """Bathroom with proximity distance relative to user search location."""

    distance_meters: float = Field(..., description="Distancia en metros")
    distance_km: float = Field(..., description="Distancia en kilómetros")


class BathroomSearchResponse(BaseModel):
    """Response for georeferenced spatial search."""

    items: list[BathroomSearchResult]
    total: int
    center_lat: float
    center_lng: float
    radius_km: float
