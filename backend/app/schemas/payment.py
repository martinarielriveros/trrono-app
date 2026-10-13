"""Pydantic schemas for Payments and Mercado Pago integration."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreatePreferenceRequest(BaseModel):
    """Request to generate Mercado Pago Checkout Pro preference."""

    reservation_id: str = Field(..., description="ID de la reserva a abonar")


class PreferenceResponse(BaseModel):
    """Response containing Mercado Pago preference initialization."""

    preference_id: str
    init_point: str
    sandbox_init_point: str
    mode: str = Field(..., description="'mock' o 'live'")
    total_amount: float


class MockCheckoutRequest(BaseModel):
    """Local simulation request for payments testing."""

    reservation_id: str = Field(..., description="ID de la reserva a pagar")
    simulate_status: str = Field(
        default="approved",
        description="Estado simulado: 'approved' o 'rejected'",
    )


class PaymentResponse(BaseModel):
    """Payment record summary."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_id: str
    mp_preference_id: str | None = None
    mp_payment_id: str | None = None
    status: str
    payment_method: str
    gross_amount: float
    fee_tronno: float
    net_vendor_amount: float
    created_at: datetime
