"""Tests for root and health check endpoints."""

from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient) -> None:
    """Verify that root endpoint returns app metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "Tronno API"
    assert "version" in data
    assert "environment" in data


def test_health_endpoint_healthy(client_with_mock_db: TestClient) -> None:
    """Verify /health returns status ok with postgis detected."""
    response = client_with_mock_db.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["postgis_installed"] is True
    assert "version" in data
    assert "timestamp" in data
    assert data["payments_mode"] in ["mock", "live"]


def test_v1_health_endpoint_healthy(client_with_mock_db: TestClient) -> None:
    """Verify /api/v1/health is routed properly."""
    response = client_with_mock_db.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
