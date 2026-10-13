"""Payments and Mercado Pago Checkout Pro API endpoints."""

import json
import logging
import uuid
from typing import Any
from urllib import request as url_request

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.schemas.payment import (
    CreatePreferenceRequest,
    MockCheckoutRequest,
    PaymentResponse,
    PreferenceResponse,
)

logger = logging.getLogger("tronno")
router = APIRouter(prefix="/payments", tags=["Payments"])

TRONNO_COMMISSION_RATE = 0.15  # 15% platform commission


@router.post(
    "/create-preference",
    response_model=PreferenceResponse,
    summary="Create Mercado Pago Checkout Pro preference",
)
def create_preference(
    data: CreatePreferenceRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Generate checkout preference for a reservation."""
    res = db.execute(
        select(Reservation)
        .options(selectinload(Reservation.bathroom))
        .where(Reservation.id == data.reservation_id)
    ).scalar_one_or_none()

    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La reserva a abonar no existe.",
        )

    if res.status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta reserva ya se encuentra pagada.",
        )

    total_amount = float(res.total_price)

    # 1. Modo Live: Checkout Pro real vía API de Mercado Pago
    if (
        settings.PAYMENTS_MODE.lower() == "live"
        and settings.MERCADO_PAGO_ACCESS_TOKEN
        and not settings.MERCADO_PAGO_ACCESS_TOKEN.startswith("TEST-0000")
    ):
        try:
            mp_url = "https://api.mercadopago.com/checkout/preferences"
            headers = {
                "Authorization": f"Bearer {settings.MERCADO_PAGO_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            }
            body = {
                "items": [
                    {
                        "id": res.id,
                        "title": f"Tronno Turno - {res.bathroom.title if res.bathroom else 'Baño'}",
                        "quantity": 1,
                        "currency_id": "ARS",
                        "unit_price": total_amount,
                    }
                ],
                "back_urls": {
                    "success": f"{settings.FRONTEND_URL}/usuario?payment=success&res_id={res.id}",
                    "failure": f"{settings.FRONTEND_URL}/usuario?payment=failure&res_id={res.id}",
                    "pending": f"{settings.FRONTEND_URL}/usuario?payment=pending&res_id={res.id}",
                },
                "auto_return": "approved",
                "external_reference": res.id,
            }
            req = url_request.Request(
                mp_url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with url_request.urlopen(req, timeout=10) as response:
                mp_data = json.loads(response.read().decode("utf-8"))
                return PreferenceResponse(
                    preference_id=mp_data["id"],
                    init_point=mp_data.get("init_point", ""),
                    sandbox_init_point=mp_data.get("sandbox_init_point", ""),
                    mode="live",
                    total_amount=total_amount,
                )
        except Exception as exc:
            logger.error("Error conectando con API de Mercado Pago: %s", exc)
            # Fallback seguro a simulación si falla conexión en pruebas
            pass

    # 2. Modo Mock: Simulación local sin credenciales externas
    mock_id = f"MOCK-PREF-{uuid.uuid4().hex[:12].upper()}"
    return PreferenceResponse(
        preference_id=mock_id,
        init_point=f"{settings.FRONTEND_URL}/usuario?mock_checkout={res.id}",
        sandbox_init_point=f"{settings.FRONTEND_URL}/usuario?mock_checkout={res.id}",
        mode="mock",
        total_amount=total_amount,
    )


@router.post(
    "/mock-checkout",
    response_model=PaymentResponse,
    summary="Simulate payment in development mode",
)
def mock_checkout(
    data: MockCheckoutRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Instantly simulate approved or rejected payment for local development."""
    res = db.execute(
        select(Reservation).where(Reservation.id == data.reservation_id)
    ).scalar_one_or_none()

    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La reserva a abonar no existe.",
        )

    gross = float(res.total_price)
    fee = round(gross * TRONNO_COMMISSION_RATE, 2)
    net_vendor = round(gross - fee, 2)

    is_approved = data.simulate_status.lower() == "approved"
    pay_status = "approved" if is_approved else "rejected"

    payment = Payment(
        id=str(uuid.uuid4()),
        reservation_id=res.id,
        mp_preference_id=f"MOCK-PREF-{uuid.uuid4().hex[:8].upper()}",
        mp_payment_id=f"MOCK-PAY-{uuid.uuid4().hex[:10].upper()}",
        status=pay_status,
        payment_method="mock_mercado_pago",
        gross_amount=gross,
        fee_tronno=fee,
        net_vendor_amount=net_vendor,
        raw_payload={
            "simulation": True,
            "status": pay_status,
            "reason": "Simulación local de desarrollo",
        },
    )
    db.add(payment)

    if is_approved:
        res.status = "paid"
        logger.info(
            "Pago simulado APROBADO para reserva %s ($%.2f ARS)",
            res.id,
            gross,
        )
    else:
        logger.warning(
            "Pago simulado RECHAZADO para reserva %s ($%.2f ARS)",
            res.id,
            gross,
        )

    db.commit()
    db.refresh(payment)

    return PaymentResponse(
        id=payment.id,
        reservation_id=payment.reservation_id,
        mp_preference_id=payment.mp_preference_id,
        mp_payment_id=payment.mp_payment_id,
        status=payment.status,
        payment_method=payment.payment_method,
        gross_amount=float(payment.gross_amount),
        fee_tronno=float(payment.fee_tronno),
        net_vendor_amount=float(payment.net_vendor_amount),
        created_at=payment.created_at,
    )


@router.post(
    "/webhook",
    summary="Mercado Pago IPN / Webhook Notification Handler",
)
async def mercadopago_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> Any:
    """Receive Mercado Pago webhook notifications."""
    try:
        body = await request.json()
        logger.info("Webhook recibido de Mercado Pago: %s", body)

        # Topic/action payment verification
        action = body.get("action")
        data = body.get("data", {})
        payment_id = data.get("id") or body.get("id")

        if action in ["payment.created", "payment.updated"] and payment_id:
            logger.info("Procesando pago MP ID: %s", payment_id)
            # En producción se consulta GET /v1/payments/{payment_id} para actualizar la reserva
        return {"status": "ok"}
    except Exception as exc:
        logger.warning("Aviso en webhook de Mercado Pago: %s", exc)
        return {"status": "received"}
