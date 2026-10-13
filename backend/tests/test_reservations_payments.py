"""Tests for Phase 5 Reservations and Payments endpoints."""

from fastapi.testclient import TestClient


def test_create_reservation_and_mock_checkout(client: TestClient) -> None:
    """Test full cycle: search bathroom, create reservation, simulate payment."""
    # 1. Search bathrooms to get an ID
    res = client.get("/api/v1/bathrooms/search?lat=-31.6515&lng=-60.7098&radius_km=10")
    assert res.status_code == 200
    bathrooms = res.json()["items"]
    assert len(bathrooms) > 0
    test_bathroom = bathrooms[0]

    # 2. Create reservation
    payload = {
        "bathroom_id": test_bathroom["id"],
        "extra_ids": [ex["id"] for ex in test_bathroom.get("extras", [])[:1]],
    }
    create_res = client.post("/api/v1/reservations", json=payload)
    assert create_res.status_code == 201
    res_data = create_res.json()
    assert res_data["id"] is not None
    assert res_data["status"] == "pending_payment"
    assert res_data["qr_token"] is not None
    assert len(res_data["pin_code"]) == 6
    assert res_data["total_price"] >= test_bathroom["price_base"]

    res_id = res_data["id"]

    # 3. Create Mercado Pago preference
    pref_res = client.post(
        "/api/v1/payments/create-preference",
        json={"reservation_id": res_id},
    )
    assert pref_res.status_code == 200
    pref_data = pref_res.json()
    assert "preference_id" in pref_data
    assert "init_point" in pref_data

    # 4. Simulate mock approved payment
    mock_pay = client.post(
        "/api/v1/payments/mock-checkout",
        json={"reservation_id": res_id, "simulate_status": "approved"},
    )
    assert mock_pay.status_code == 200
    pay_data = mock_pay.json()
    assert pay_data["status"] == "approved"
    assert pay_data["gross_amount"] == res_data["total_price"]
    assert pay_data["fee_tronno"] > 0
    assert pay_data["net_vendor_amount"] > 0

    # 5. Check reservation status updated to paid
    get_res = client.get(f"/api/v1/reservations/{res_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "paid"


def test_create_reservation_invalid_bathroom(client: TestClient) -> None:
    """Test creating reservation for nonexistent bathroom returns 404."""
    response = client.post(
        "/api/v1/reservations",
        json={"bathroom_id": "nonexistent-uuid-1234"},
    )
    assert response.status_code == 404
    assert "no existe" in response.json()["detail"]


def test_get_my_reservations(client: TestClient) -> None:
    """Test retrieving user reservations."""
    response = client.get("/api/v1/reservations/me")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
