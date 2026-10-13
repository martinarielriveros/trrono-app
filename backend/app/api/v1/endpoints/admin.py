"""Admin Panel API endpoints."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.bathroom import Bathroom
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


class AdminStatsResponse(BaseModel):
    """Global system KPIs for the admin dashboard."""

    total_gross_collected: float
    total_admin_earnings: float
    total_pending_payouts: float
    total_reservations_count: int
    paid_reservations_count: int
    total_bathrooms_count: int
    active_bathrooms_count: int
    pending_approval_bathrooms_count: int
    total_users_count: int
    total_vendors_count: int
    pending_vendors_count: int


class BathroomApprovalUpdate(BaseModel):
    """Schema to update bathroom approval or active status."""

    is_approved: bool | None = None
    is_active: bool | None = None


class VendorStatusUpdate(BaseModel):
    """Schema to update vendor approval status."""

    vendor_status: str = Field(..., description="'approved', 'pending' o 'suspended'")


class SettlePayoutRequest(BaseModel):
    """Schema to record an administrative bank transfer settlement."""

    vendor_id: str
    amount: float
    reference_note: str | None = None


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get global administrative KPIs",
)
def get_admin_stats(
    db: Session = Depends(get_db),
) -> Any:
    """Calculate platform-wide totals for revenue, bathrooms, and vendors."""
    # Financial metrics from payments
    approved_payments = (
        db.execute(select(Payment).where(Payment.status == "approved")).scalars().all()
    )
    total_gross = sum(float(p.gross_amount) for p in approved_payments)
    total_admin_earnings = sum(float(p.fee_tronno) for p in approved_payments)
    total_pending_payouts = sum(float(p.net_vendor_amount) for p in approved_payments)

    # Reservations
    all_reservations = db.execute(select(Reservation)).scalars().all()
    paid_reservations = [r for r in all_reservations if r.status in ["paid", "used"]]

    # Bathrooms
    all_bathrooms = db.execute(select(Bathroom)).scalars().all()
    active_bathrooms = [b for b in all_bathrooms if b.is_active]
    pending_bathrooms = [b for b in all_bathrooms if not b.is_approved]

    # Users and vendors
    all_users = db.execute(select(User)).scalars().all()
    vendors = [u for u in all_users if u.role == "vendor"]
    pending_vendors = [v for v in vendors if v.vendor_status == "pending"]

    return AdminStatsResponse(
        total_gross_collected=round(total_gross, 2),
        total_admin_earnings=round(total_admin_earnings, 2),
        total_pending_payouts=round(total_pending_payouts, 2),
        total_reservations_count=len(all_reservations),
        paid_reservations_count=len(paid_reservations),
        total_bathrooms_count=len(all_bathrooms),
        active_bathrooms_count=len(active_bathrooms),
        pending_approval_bathrooms_count=len(pending_bathrooms),
        total_users_count=len(all_users),
        total_vendors_count=len(vendors),
        pending_vendors_count=len(pending_vendors),
    )


@router.get(
    "/bathrooms",
    summary="List all bathrooms for admin moderation",
)
def get_admin_bathrooms(
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve full list of bathrooms with vendor profile details."""
    query = (
        select(Bathroom)
        .options(selectinload(Bathroom.extras), selectinload(Bathroom.vendor))
        .order_by(Bathroom.created_at.desc())
    )
    bathrooms = db.execute(query).scalars().all()

    items = []
    for b in bathrooms:
        items.append(
            {
                "id": b.id,
                "title": b.title,
                "description": b.description,
                "address": b.address,
                "city": b.city,
                "province": b.province,
                "latitude": b.latitude,
                "longitude": b.longitude,
                "price_base": float(b.price_base),
                "is_active": b.is_active,
                "is_approved": b.is_approved,
                "turn_duration_minutes": b.turn_duration_minutes,
                "amenities": b.amenities or [],
                "photos": b.photos or [],
                "created_at": b.created_at,
                "vendor": {
                    "id": b.vendor.id if b.vendor else b.vendor_id,
                    "full_name": b.vendor.full_name if b.vendor else "Vendedor",
                    "email": b.vendor.email if b.vendor else "",
                    "phone": b.vendor.phone if b.vendor else "",
                    "cbu_cvu": b.vendor.cbu_cvu if b.vendor else "",
                    "bank_alias": b.vendor.bank_alias if b.vendor else "",
                },
                "extras_count": len(b.extras or []),
            }
        )

    return {"items": items, "total": len(items)}


@router.patch(
    "/bathrooms/{bathroom_id}",
    summary="Approve or update bathroom status",
)
def update_bathroom_status(
    bathroom_id: str,
    data: BathroomApprovalUpdate,
    db: Session = Depends(get_db),
) -> Any:
    """Update approval or active flag for a specific bathroom."""
    b = db.get(Bathroom, bathroom_id)
    if not b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El baño indicado no existe.",
        )

    if data.is_approved is not None:
        b.is_approved = data.is_approved
    if data.is_active is not None:
        b.is_active = data.is_active

    db.commit()
    db.refresh(b)
    return {
        "id": b.id,
        "is_approved": b.is_approved,
        "is_active": b.is_active,
        "message": "Estado del baño actualizado con éxito.",
    }


@router.get(
    "/vendors",
    summary="List all vendors with banking and balance data",
)
def get_admin_vendors(
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve vendor accounts with CBU/CVU, bathrooms count and accumulated balances."""
    vendors = (
        db.execute(select(User).where(User.role == "vendor").order_by(User.created_at.desc()))
        .scalars()
        .all()
    )

    items = []
    for v in vendors:
        # Bathrooms owned by this vendor
        b_list = db.execute(select(Bathroom).where(Bathroom.vendor_id == v.id)).scalars().all()

        # Reservations and sales
        b_ids = [b.id for b in b_list]
        sales_total = 0.0
        payout_due = 0.0

        if b_ids:
            res_list = (
                db.execute(
                    select(Reservation).where(
                        Reservation.bathroom_id.in_(b_ids),
                        Reservation.status.in_(["paid", "used"]),
                    )
                )
                .scalars()
                .all()
            )
            sales_total = sum(float(r.total_price) for r in res_list)
            payout_due = round(sales_total * 0.85, 2)

        items.append(
            {
                "id": v.id,
                "email": v.email,
                "full_name": v.full_name,
                "phone": v.phone,
                "cbu_cvu": v.cbu_cvu or "No registrado",
                "bank_alias": v.bank_alias or "No registrado",
                "vendor_status": v.vendor_status,
                "is_active": v.is_active,
                "bathrooms_count": len(b_list),
                "total_sales": sales_total,
                "payout_due": payout_due,
                "created_at": v.created_at,
            }
        )

    return {"items": items, "total": len(items)}


@router.patch(
    "/vendors/{vendor_id}/status",
    summary="Approve or suspend vendor account",
)
def update_vendor_status(
    vendor_id: str,
    data: VendorStatusUpdate,
    db: Session = Depends(get_db),
) -> Any:
    """Update vendor verification status."""
    v = db.get(User, vendor_id)
    if not v:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El vendedor indicado no existe.",
        )

    v.vendor_status = data.vendor_status
    if data.vendor_status == "suspended":
        v.is_active = False
    elif data.vendor_status == "approved":
        v.is_active = True

    db.commit()
    db.refresh(v)
    return {
        "id": v.id,
        "vendor_status": v.vendor_status,
        "is_active": v.is_active,
        "message": f"Estado del vendedor actualizado a '{v.vendor_status}'.",
    }


@router.get(
    "/reservations",
    summary="Global reservations ledger",
)
def get_admin_reservations(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve system-wide reservations ledger."""
    query = (
        select(Reservation)
        .options(selectinload(Reservation.bathroom), selectinload(Reservation.user))
        .order_by(Reservation.created_at.desc())
        .limit(limit)
    )
    reservations = db.execute(query).scalars().all()

    items = []
    for r in reservations:
        items.append(
            {
                "id": r.id,
                "status": r.status,
                "user_name": r.user.full_name if r.user else "Usuario",
                "user_email": r.user.email if r.user else "",
                "bathroom_title": r.bathroom.title if r.bathroom else "Baño",
                "city": r.bathroom.city if r.bathroom else "",
                "total_price": float(r.total_price),
                "price_base": float(r.price_base),
                "price_extras": float(r.price_extras),
                "turn_duration_minutes": r.turn_duration_minutes,
                "qr_token": r.qr_token,
                "pin_code": r.pin_code,
                "checked_in_at": r.checked_in_at,
                "created_at": r.created_at,
            }
        )

    return {"items": items, "total": len(items)}


@router.post(
    "/payouts/settle",
    summary="Record bank settlement transfer to a vendor",
)
def record_payout_settlement(
    data: SettlePayoutRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Record manual bank payout transfer made to vendor's CBU/CVU."""
    v = db.get(User, data.vendor_id)
    if not v:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El vendedor no existe.",
        )

    settlement_id = f"SETTLE-{uuid.uuid4().hex[:8].upper()}"
    return {
        "settlement_id": settlement_id,
        "vendor_id": v.id,
        "vendor_name": v.full_name,
        "cbu_cvu": v.cbu_cvu,
        "amount_transferred": data.amount,
        "settled_at": datetime.now(UTC),
        "reference_note": data.reference_note or "Transferencia de liquidación Tronno",
        "message": f"Transferencia registrada con éxito para {v.full_name}.",
    }
