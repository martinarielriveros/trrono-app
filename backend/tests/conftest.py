"""Pytest fixtures for backend tests."""

from collections.abc import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.main import app


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Test client for FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_db_session() -> Generator[Session, None, None]:
    """Mock database session simulating healthy PostgreSQL + PostGIS."""
    mock_session = MagicMock(spec=Session)

    def execute_side_effect(statement, *args, **kwargs):
        stmt_str = str(statement).lower()
        mock_res = MagicMock()
        if "postgis_version" in stmt_str:
            mock_res.scalar.return_value = "3.4 USE_GEOS=1 USE_PROJ=1"
        else:
            mock_res.scalar.return_value = 1
        mock_res.scalar_one_or_none.return_value = None
        mock_res.scalars.return_value.all.return_value = []
        mock_res.scalars.return_value.first.return_value = None
        return mock_res

    mock_session.execute.side_effect = execute_side_effect
    mock_session.get.return_value = None
    yield mock_session


@pytest.fixture
def client_with_mock_db(mock_db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with overridden DB dependency for isolated unit tests."""
    app.dependency_overrides[get_db] = lambda: mock_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
