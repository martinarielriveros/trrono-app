"""Create reservations and payments tables for Phase 5.

Revision ID: 0003_reservations_and_payments
Revises: 0002_bathrooms_and_users
Create Date: 2026-10-13 12:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_reservations_and_payments"
down_revision: str | None = "0002_bathrooms_and_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create reservations table
    op.create_table(
        "reservations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("bathroom_id", sa.String(length=36), nullable=False),
        sa.Column("turn_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("turn_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "turn_duration_minutes",
            sa.Integer(),
            nullable=False,
            server_default="15",
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="pending_payment",
        ),
        sa.Column("price_base", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "price_extras",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column("total_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "selected_extras",
            postgresql.JSONB(astext_type=sa.Text())
            .with_variant(sa.JSON(), "sqlite"),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("qr_token", sa.String(length=64), nullable=False),
        sa.Column("pin_code", sa.String(length=6), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_reservations_user_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["bathroom_id"],
            ["bathrooms.id"],
            name="fk_reservations_bathroom_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_reservations_user_id", "reservations", ["user_id"])
    op.create_index("ix_reservations_bathroom_id", "reservations", ["bathroom_id"])
    op.create_index("ix_reservations_status", "reservations", ["status"])
    op.create_index("ix_reservations_qr_token", "reservations", ["qr_token"], unique=True)
    op.create_index("ix_reservations_pin_code", "reservations", ["pin_code"])

    # 2. Create payments table
    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("reservation_id", sa.String(length=36), nullable=False),
        sa.Column("mp_preference_id", sa.String(length=120), nullable=True),
        sa.Column("mp_payment_id", sa.String(length=120), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "payment_method",
            sa.String(length=50),
            nullable=False,
            server_default="mercado_pago",
        ),
        sa.Column("gross_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "fee_tronno",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column("net_vendor_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "raw_payload",
            postgresql.JSONB(astext_type=sa.Text())
            .with_variant(sa.JSON(), "sqlite"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["reservation_id"],
            ["reservations.id"],
            name="fk_payments_reservation_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_payments_reservation_id", "payments", ["reservation_id"])
    op.create_index("ix_payments_mp_payment_id", "payments", ["mp_payment_id"])
    op.create_index("ix_payments_status", "payments", ["status"])


def downgrade() -> None:
    op.drop_table("payments")
    op.drop_table("reservations")
