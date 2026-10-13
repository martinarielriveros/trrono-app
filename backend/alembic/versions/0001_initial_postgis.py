"""Enable PostGIS extension and establish baseline migration.

Revision ID: 0001_initial_postgis
Revises:
Create Date: 2026-10-12 14:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_postgis"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Ensure PostGIS extension is installed and available
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")


def downgrade() -> None:
    # Note: usually we don't drop postgis extension in production, but provide clean teardown
    op.execute("DROP EXTENSION IF EXISTS postgis;")
