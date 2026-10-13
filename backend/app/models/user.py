"""User model for Tronno."""

import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    """User account supporting user, vendor, and admin roles."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )
    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="vendor",  # "user", "vendor", "admin"
    )
    cbu_cvu: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )
    bank_alias: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    vendor_status: Mapped[str] = mapped_column(
        String(20),
        default="approved",  # "pending", "approved", "rejected"
        nullable=False,
    )

    # Relationships
    bathrooms = relationship("Bathroom", back_populates="vendor", cascade="all, delete-orphan")
