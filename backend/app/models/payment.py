"""Payment SQLAlchemy model."""

import uuid
from typing import Any

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin


class Payment(Base, TimestampMixin):
    """Payment transaction entity tracking Mercado Pago orders and Tronno commissions."""

    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    reservation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("reservations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mp_preference_id: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
    mp_payment_id: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )
    # Status: pending | approved | rejected | refunded
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )
    payment_method: Mapped[str] = mapped_column(
        String(50),
        default="mercado_pago",
        nullable=False,
    )
    gross_amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    fee_tronno: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=0.0,
        nullable=False,
    )
    net_vendor_amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True,
    )

    # Relationships
    reservation = relationship("Reservation", back_populates="payments")
