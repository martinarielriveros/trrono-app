"""Create users, bathrooms, and bathroom_extras tables with PostGIS geometry.

Revision ID: 0002_bathrooms_and_users
Revises: 0001_initial_postgis
Create Date: 2026-10-13 10:00:00.000000

"""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_bathrooms_and_users"
down_revision: str | None = "0001_initial_postgis"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="vendor"),
        sa.Column("cbu_cvu", sa.String(length=30), nullable=True),
        sa.Column("bank_alias", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("vendor_status", sa.String(length=20), nullable=False, server_default="approved"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 2. Create bathrooms table with PostGIS geometry
    op.create_table(
        "bathrooms",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("vendor_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False, server_default="Buenos Aires"),
        sa.Column("province", sa.String(length=100), nullable=False, server_default="CABA"),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column(
            "location",
            geoalchemy2.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                spatial_index=False,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=False,
        ),
        sa.Column("price_base", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("turn_duration_minutes", sa.Integer(), nullable=False, server_default="15"),
        sa.Column("cleaning_interval_minutes", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "rules", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"
        ),
        sa.Column(
            "opening_hours",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "amenities",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "photos", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["vendor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bathrooms_vendor_id"), "bathrooms", ["vendor_id"], unique=False)
    op.create_index(op.f("ix_bathrooms_is_active"), "bathrooms", ["is_active"], unique=False)
    op.create_index(op.f("ix_bathrooms_is_approved"), "bathrooms", ["is_approved"], unique=False)
    op.create_index(
        "idx_bathrooms_location",
        "bathrooms",
        ["location"],
        unique=False,
        postgresql_using="gist",
    )

    # 3. Create bathroom_extras table
    op.create_table(
        "bathroom_extras",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("bathroom_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["bathroom_id"], ["bathrooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_bathroom_extras_bathroom_id"), "bathroom_extras", ["bathroom_id"], unique=False
    )


def downgrade() -> None:
    op.drop_table("bathroom_extras")
    op.drop_index(
        "idx_bathrooms_location",
        table_name="bathrooms",
        postgresql_using="gist",
    )
    op.drop_table("bathrooms")
    op.drop_table("users")
