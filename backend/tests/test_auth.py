"""Tests for authentication and security functions."""

from fastapi.testclient import TestClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


def test_password_hashing() -> None:
    """Verify bcrypt hash generation and verification."""
    password = "SuperPassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_roundtrip() -> None:
    """Verify access token creation and decoding."""
    token = create_access_token(subject="user_123", extra_claims={"role": "vendor"})
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_123"
    assert decoded["role"] == "vendor"


def test_auth_me_requires_token(client: TestClient) -> None:
    """Verify accessing /api/v1/auth/me without token returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "iniciar sesión" in response.json()["detail"]


def test_google_login_flow(client_with_mock_db: TestClient) -> None:
    """Verify Google login creates or retrieves user with token."""
    payload = {"credential": "test.google.user@tronno.com.ar", "role": "user"}
    response = client_with_mock_db.post("/api/v1/auth/google", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test.google.user@tronno.com.ar"
    assert data["user"]["role"] == "user"
