"""Reservation SQLAlchemy model."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin


class Reservation(Base, TimestampMixin):
    """Bathroom reservation entity representing a reserved time slot and extras."""

    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bathroom_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("bathrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    turn_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    turn_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    turn_duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=15,
        nullable=False,
    )
    # Status: pending_payment | paid | used | expired | cancelled
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending_payment",
        nullable=False,
        index=True,
    )
    price_base: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    price_extras: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=0.0,
        nullable=False,
    )
    total_price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    # Stored as JSON: [{"id": "...", "name": "...", "price": ...}]
    selected_extras: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
        nullable=False,
    )
    # Access verification
    qr_token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )
    pin_code: Mapped[str] = mapped_column(
        String(6),
        nullable=False,
        index=True,
    )
    checked_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user = relationship("User", backref="reservations", lazy="joined")
    bathroom = relationship("Bathroom", backref="reservations", lazy="joined")
    payments = relationship(
        "Payment",
        back_populates="reservation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
