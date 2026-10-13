"""Reservations API endpoints."""

import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    get_current_user_optional,
    get_current_vendor,
)
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.bathroom import Bathroom
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import (
    ReservationBathroomSummary,
    ReservationCreate,
    ReservationListResponse,
    ReservationResponse,
)

router = APIRouter(prefix="/reservations", tags=["Reservations"])


def _get_or_create_demo_user(db: Session) -> User:
    """Find or create a default demo user for guest reservations."""
    email = "usuario.demo@tronno.com.ar"
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=get_password_hash("UsuarioDemo123!"),
            full_name="Usuario Demo Tronno",
            phone="+54 11 5555-1234",
            role="user",
            is_active=True,
            vendor_status="approved",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _build_reservation_response(res: Reservation) -> ReservationResponse:
    """Build response with embedded bathroom summary."""
    b_summary = None
    if res.bathroom:
        b_summary = ReservationBathroomSummary(
            id=res.bathroom.id,
            title=res.bathroom.title,
            address=res.bathroom.address,
            city=res.bathroom.city,
            province=res.bathroom.province,
            latitude=res.bathroom.latitude,
            longitude=res.bathroom.longitude,
            photos=res.bathroom.photos or [],
        )

    return ReservationResponse(
        id=res.id,
        user_id=res.user_id,
        bathroom_id=res.bathroom_id,
        turn_start=res.turn_start,
        turn_end=res.turn_end,
        turn_duration_minutes=res.turn_duration_minutes,
        status=res.status,
        price_base=float(res.price_base),
        price_extras=float(res.price_extras),
        total_price=float(res.total_price),
        selected_extras=res.selected_extras or [],
        qr_token=res.qr_token,
        pin_code=res.pin_code,
        checked_in_at=res.checked_in_at,
        created_at=res.created_at,
        bathroom=b_summary,
    )


@router.post(
    "",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new bathroom reservation",
)
def create_reservation(
    data: ReservationCreate,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> Any:
    """Reserve a bathroom slot and calculate totals with selected extras."""
    user = current_user or _get_or_create_demo_user(db)

    bathroom = db.execute(
        select(Bathroom)
        .options(selectinload(Bathroom.extras))
        .where(Bathroom.id == data.bathroom_id)
    ).scalar_one_or_none()

    if not bathroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El baño solicitado no existe.",
        )

    if not bathroom.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este baño se encuentra temporalmente inactivo.",
        )

    turn_start = data.turn_start or (datetime.now(UTC) + timedelta(minutes=5))
    turn_end = turn_start + timedelta(minutes=bathroom.turn_duration_minutes)

    # Process extras
    selected_extras_data: list[dict[str, Any]] = []
    extras_total = 0.0

    if data.extra_ids:
        extras_map = {ex.id: ex for ex in (bathroom.extras or [])}
        for ex_id in data.extra_ids:
            if ex_id in extras_map:
                extra = extras_map[ex_id]
                extras_total += float(extra.price)
                selected_extras_data.append(
                    {
                        "id": extra.id,
                        "name": extra.name,
                        "price": float(extra.price),
                    }
                )

    base_price = float(bathroom.price_base)
    total_price = base_price + extras_total

    # Cryptographic access credentials
    qr_token = secrets.token_urlsafe(32)
    pin_code = f"{secrets.randbelow(900000) + 100000}"

    reservation = Reservation(
        id=str(uuid.uuid4()),
        user_id=user.id,
        bathroom_id=bathroom.id,
        turn_start=turn_start,
        turn_end=turn_end,
        turn_duration_minutes=bathroom.turn_duration_minutes,
        status="pending_payment",
        price_base=base_price,
        price_extras=extras_total,
        total_price=total_price,
        selected_extras=selected_extras_data,
        qr_token=qr_token,
        pin_code=pin_code,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    return _build_reservation_response(reservation)


@router.get(
    "/me",
    response_model=ReservationListResponse,
    summary="Get current user's reservations",
)
def get_my_reservations(
    current_user: User | None = Depends(get_current_user_optional),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve reservations for the logged-in user or demo user."""
    user = current_user or _get_or_create_demo_user(db)

    query = (
        select(Reservation)
        .options(selectinload(Reservation.bathroom))
        .where(Reservation.user_id == user.id)
        .order_by(Reservation.created_at.desc())
    )

    items = db.execute(query.limit(limit).offset(offset)).scalars().all()
    count_query = select(Reservation).where(Reservation.user_id == user.id)
    total = len(db.execute(count_query).scalars().all())

    return ReservationListResponse(
        items=[_build_reservation_response(r) for r in items],
        total=total,
    )


@router.get(
    "/vendor/me",
    response_model=ReservationListResponse,
    summary="Get vendor's incoming reservations",
)
def get_vendor_reservations(
    current_vendor: User = Depends(get_current_vendor),
    status_filter: str | None = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve reservations for bathrooms belonging to the authenticated vendor."""
    query = (
        select(Reservation)
        .join(Bathroom, Reservation.bathroom_id == Bathroom.id)
        .options(selectinload(Reservation.bathroom))
        .where(Bathroom.vendor_id == current_vendor.id)
    )

    if status_filter:
        query = query.where(Reservation.status == status_filter)

    query = query.order_by(Reservation.created_at.desc())
    items = db.execute(query).scalars().all()

    return ReservationListResponse(
        items=[_build_reservation_response(r) for r in items],
        total=len(items),
    )


@router.get(
    "/{reservation_id}",
    response_model=ReservationResponse,
    summary="Get reservation by ID",
)
def get_reservation(
    reservation_id: str,
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve reservation details."""
    res = db.execute(
        select(Reservation)
        .options(selectinload(Reservation.bathroom))
        .where(Reservation.id == reservation_id)
    ).scalar_one_or_none()

    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La reserva solicitada no existe.",
        )

    return _build_reservation_response(res)
