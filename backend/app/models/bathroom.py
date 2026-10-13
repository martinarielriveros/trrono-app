"""Bathroom and BathroomExtra SQLAlchemy models."""

import uuid
from typing import Any

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin


class Bathroom(Base, TimestampMixin):
    """Bathroom entity published by vendors."""

    __tablename__ = "bathrooms"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    vendor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Buenos Aires",
    )
    province: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="CABA",
    )
    postal_code: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    # PostGIS spatial point for geospatial queries (SRID 4326: WGS84)
    # Using spatial_index=True creates a GiST index on location
    location = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    price_base: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    turn_duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=15,
        nullable=False,
    )
    cleaning_interval_minutes: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    is_approved: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    # Stored as JSON (compatible with both PostgreSQL and test engines)
    rules: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
        nullable=False,
    )
    opening_hours: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
        nullable=False,
    )
    amenities: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
        nullable=False,
    )
    photos: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=list,
        nullable=False,
    )

    # Relationships
    vendor = relationship("User", back_populates="bathrooms")
    extras = relationship(
        "BathroomExtra",
        back_populates="bathroom",
        cascade="all, delete-orphan",
        order_by="BathroomExtra.created_at",
    )


class BathroomExtra(Base, TimestampMixin):
    """Optional add-on services for a bathroom (e.g. Ducha, Toallas, Kit higiene)."""

    __tablename__ = "bathroom_extras"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    bathroom_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("bathrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    bathroom = relationship("Bathroom", back_populates="extras")
