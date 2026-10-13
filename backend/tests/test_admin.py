"""Tests for Admin API endpoints."""

from fastapi.testclient import TestClient


def test_get_admin_stats(client: TestClient) -> None:
    """Test retrieving global administrative stats."""
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_gross_collected" in data
    assert "total_admin_earnings" in data
    assert "total_pending_payouts" in data
    assert "total_bathrooms_count" in data
    assert "total_vendors_count" in data
    assert data["total_bathrooms_count"] >= 5


def test_get_admin_bathrooms(client: TestClient) -> None:
    """Test listing bathrooms for admin moderation."""
    response = client.get("/api/v1/admin/bathrooms")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 5


def test_get_admin_vendors(client: TestClient) -> None:
    """Test listing vendors with bank details."""
    response = client.get("/api/v1/admin/vendors")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1


def test_update_bathroom_approval_status(client: TestClient) -> None:
    """Test approving/pausing a bathroom."""
    bathrooms_res = client.get("/api/v1/admin/bathrooms")
    first_b = bathrooms_res.json()["items"][0]

    response = client.patch(
        f"/api/v1/admin/bathrooms/{first_b['id']}",
        json={"is_approved": True, "is_active": True},
    )
    assert response.status_code == 200
    assert response.json()["is_approved"] is True
