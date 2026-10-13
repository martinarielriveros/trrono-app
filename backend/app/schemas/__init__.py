"""Schemas package initialization."""

from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    Token,
    UserCreate,
    UserResponse,
)
from app.schemas.bathroom import (
    BathroomCreate,
    BathroomExtraCreate,
    BathroomExtraResponse,
    BathroomListResponse,
    BathroomResponse,
    BathroomSearchResponse,
    BathroomSearchResult,
    BathroomUpdate,
)
from app.schemas.health import HealthResponse
from app.schemas.payment import (
    CreatePreferenceRequest,
    MockCheckoutRequest,
    PaymentResponse,
    PreferenceResponse,
)
from app.schemas.reservation import (
    ReservationBathroomSummary,
    ReservationCreate,
    ReservationListResponse,
    ReservationResponse,
)

__all__ = [
    "HealthResponse",
    "BathroomCreate",
    "BathroomUpdate",
    "BathroomResponse",
    "BathroomListResponse",
    "BathroomSearchResult",
    "BathroomSearchResponse",
    "BathroomExtraCreate",
    "BathroomExtraResponse",
    "UserCreate",
    "UserResponse",
    "LoginRequest",
    "GoogleLoginRequest",
    "Token",
    "ReservationCreate",
    "ReservationResponse",
    "ReservationListResponse",
    "ReservationBathroomSummary",
    "CreatePreferenceRequest",
    "PreferenceResponse",
    "MockCheckoutRequest",
    "PaymentResponse",
]
