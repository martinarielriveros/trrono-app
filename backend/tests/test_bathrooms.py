"""Tests for bathrooms and uploads endpoints."""

import io

from fastapi.testclient import TestClient


def test_cloudinary_signature_endpoint(client: TestClient) -> None:
    """Test generating Cloudinary upload signature parameters."""
    response = client.get("/api/v1/uploads/signature?folder=bathrooms")
    assert response.status_code == 200
    data = response.json()
    assert "signature" in data
    assert "timestamp" in data
    assert "upload_url" in data
    assert data["folder"] == "bathrooms"


def test_direct_image_upload(client: TestClient) -> None:
    """Test direct image upload for local development."""
    file_content = b"fake-jpeg-image-bytes"
    response = client.post(
        "/api/v1/uploads/direct",
        files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["url"].startswith("data:image/jpeg;base64,")
    assert "public_id" in data
    assert data["format"] == "jpg"


def test_direct_image_upload_rejects_non_image(client: TestClient) -> None:
    """Test that non-image file types are rejected."""
    text_content = b"Not an image"
    response = client.post(
        "/api/v1/uploads/direct",
        files={"file": ("document.txt", io.BytesIO(text_content), "text/plain")},
    )
    assert response.status_code == 400
    assert "imagen válida" in response.json()["detail"]


def test_create_bathroom_validates_min_price(client: TestClient) -> None:
    """Verify that creating a bathroom with price below minimum ($300) is rejected with 422."""
    payload = {
        "title": "Baño Económico",
        "address": "Defensa 1200",
        "latitude": -34.6215,
        "longitude": -58.3731,
        "price_base": 150.0,  # >= 100 so passes pydantic ge=100, but < MIN_BATHROOM_PRICE (300)
    }
    response = client.post("/api/v1/bathrooms", json=payload)
    assert response.status_code == 422
    assert "inferior" in response.json()["detail"]


def test_get_nonexistent_bathroom_returns_404(
    mock_db_session, client_with_mock_db: TestClient
) -> None:
    """Verify 404 is returned when bathroom does not exist."""
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
    mock_db_session.get.return_value = None

    response = client_with_mock_db.get("/api/v1/bathrooms/non-existent-uuid")
    assert response.status_code == 404
    assert "no existe" in response.json()["detail"]


def test_search_bathrooms_proximity(client_with_mock_db: TestClient) -> None:
    """Verify search endpoint responds with center coordinates, radius and items list."""
    response = client_with_mock_db.get(
        "/api/v1/bathrooms/search?lat=-34.6037&lng=-58.3816&radius_km=5.0"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["center_lat"] == -34.6037
    assert data["center_lng"] == -58.3816
    assert data["radius_km"] == 5.0
    assert "total" in data
