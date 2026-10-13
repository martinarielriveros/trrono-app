import math
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.bathroom import Bathroom, BathroomExtra
from app.models.user import User
from app.schemas.bathroom import (
    BathroomCreate,
    BathroomExtraCreate,
    BathroomExtraResponse,
    BathroomListResponse,
    BathroomResponse,
    BathroomSearchResponse,
    BathroomSearchResult,
    BathroomUpdate,
)

router = APIRouter(prefix="/bathrooms", tags=["Bathrooms"])


def calculate_haversine_distance_meters(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate the great-circle distance between two GPS coordinates in meters."""
    r = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def _get_or_create_default_vendor(db: Session, vendor_id: str | None = None) -> User:
    """Ensure a vendor exists for creating bathrooms during early phases."""
    if vendor_id:
        user = db.get(User, vendor_id)
        if user:
            return user

    # Find existing vendor
    vendor = db.execute(select(User).where(User.role == "vendor")).scalars().first()
    if vendor:
        return vendor

    # Create default demo vendor
    default_vendor = User(
        id=str(uuid.uuid4()),
        email="vendedor.demo@tronno.com.ar",
        full_name="Café San Telmo (Vendedor Demo)",
        phone="+54 11 4321-8765",
        role="vendor",
        cbu_cvu="0000003100012345678901",
        bank_alias="CAFE.SANTELMO.TRONNO",
        vendor_status="approved",
        is_active=True,
    )
    db.add(default_vendor)
    db.commit()
    db.refresh(default_vendor)
    return default_vendor


@router.get(
    "",
    response_model=BathroomListResponse,
    summary="List bathrooms",
)
def list_bathrooms(
    vendor_id: str | None = Query(None, description="Filtrar por ID de vendedor"),
    is_active: bool | None = Query(None, description="Filtrar por estado activo"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve bathrooms with optional filtering by vendor and active status."""
    query = select(Bathroom).options(selectinload(Bathroom.extras))

    if vendor_id:
        query = query.where(Bathroom.vendor_id == vendor_id)
    if is_active is not None:
        query = query.where(Bathroom.is_active == is_active)

    query = query.order_by(Bathroom.created_at.desc())
    bathrooms = db.execute(query.limit(limit).offset(offset)).scalars().all()

    # Total count
    count_query = select(Bathroom)
    if vendor_id:
        count_query = count_query.where(Bathroom.vendor_id == vendor_id)
    if is_active is not None:
        count_query = count_query.where(Bathroom.is_active == is_active)
    total = len(db.execute(count_query).scalars().all())

    return BathroomListResponse(
        items=[BathroomResponse.model_validate(b) for b in bathrooms],
        total=total,
    )


@router.post(
    "",
    response_model=BathroomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new bathroom",
)
def create_bathroom(
    data: BathroomCreate,
    db: Session = Depends(get_db),
) -> Any:
    """Create a new bathroom with spatial geometry, weekly hours, amenities and extras."""
    # Enforce minimum price validation
    if data.price_base < settings.MIN_BATHROOM_PRICE:
        msg = f"El precio base no puede ser inferior a ${settings.MIN_BATHROOM_PRICE:.2f} ARS."
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=msg,
        )

    vendor = _get_or_create_default_vendor(db, data.vendor_id)

    # PostGIS WKT POINT geometry: POINT(lng lat)
    point_geom = WKTElement(f"POINT({data.longitude} {data.latitude})", srid=4326)

    bathroom_id = str(uuid.uuid4())
    bathroom = Bathroom(
        id=bathroom_id,
        vendor_id=vendor.id,
        title=data.title,
        description=data.description,
        address=data.address,
        city=data.city,
        province=data.province,
        postal_code=data.postal_code,
        latitude=data.latitude,
        longitude=data.longitude,
        location=point_geom,
        price_base=data.price_base,
        turn_duration_minutes=data.turn_duration_minutes,
        cleaning_interval_minutes=data.cleaning_interval_minutes,
        rules=data.rules,
        opening_hours=[h.model_dump() for h in data.opening_hours],
        amenities=data.amenities,
        photos=[p.model_dump() for p in data.photos],
        is_active=True,
        is_approved=True,
    )
    db.add(bathroom)

    # Add optional extras
    for extra_data in data.extras:
        extra = BathroomExtra(
            id=str(uuid.uuid4()),
            bathroom_id=bathroom_id,
            name=extra_data.name,
            description=extra_data.description,
            price=extra_data.price,
            is_active=extra_data.is_active,
        )
        db.add(extra)

    db.commit()

    # Re-query with eager loaded extras
    result = db.execute(
        select(Bathroom).options(selectinload(Bathroom.extras)).where(Bathroom.id == bathroom_id)
    ).scalar_one()

    return BathroomResponse.model_validate(result)


@router.get(
    "/search",
    response_model=BathroomSearchResponse,
    summary="Search bathrooms by proximity, price and amenities",
)
def search_bathrooms(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitud del usuario"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitud del usuario"),
    radius_km: float = Query(5.0, ge=0.1, le=50.0, description="Radio de búsqueda en km"),
    max_price: float | None = Query(None, ge=100.0, description="Precio máximo en ARS"),
    amenity: str | None = Query(None, description="Comodidad requerida"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Any:
    """Find nearby bathrooms ordered by distance in meters, supporting spatial radius filtering."""
    query = (
        select(Bathroom).options(selectinload(Bathroom.extras)).where(Bathroom.is_active.is_(True))
    )

    if max_price is not None:
        query = query.where(Bathroom.price_base <= max_price)

    all_active = db.execute(query).scalars().all()

    radius_meters = radius_km * 1000.0
    results: list[BathroomSearchResult] = []

    for b in all_active:
        if amenity and amenity not in (b.amenities or []):
            continue

        dist_m = calculate_haversine_distance_meters(lat, lng, b.latitude, b.longitude)
        if dist_m <= radius_meters:
            result_item = BathroomSearchResult(
                id=b.id,
                vendor_id=b.vendor_id,
                title=b.title,
                description=b.description,
                address=b.address,
                city=b.city,
                province=b.province,
                postal_code=b.postal_code,
                latitude=b.latitude,
                longitude=b.longitude,
                price_base=float(b.price_base),
                turn_duration_minutes=b.turn_duration_minutes,
                cleaning_interval_minutes=b.cleaning_interval_minutes,
                rules=b.rules or [],
                amenities=b.amenities or [],
                opening_hours=b.opening_hours or [],
                photos=b.photos or [],
                is_active=b.is_active,
                is_approved=b.is_approved,
                created_at=b.created_at,
                updated_at=b.updated_at,
                extras=[BathroomExtraResponse.model_validate(ex) for ex in (b.extras or [])],
                distance_meters=round(dist_m, 1),
                distance_km=round(dist_m / 1000.0, 2),
            )
            results.append(result_item)

    # Sort results by distance closest first
    results.sort(key=lambda r: r.distance_meters)
    trimmed = results[:limit]

    return BathroomSearchResponse(
        items=trimmed,
        total=len(results),
        center_lat=lat,
        center_lng=lng,
        radius_km=radius_km,
    )


@router.get(
    "/{bathroom_id}",
    response_model=BathroomResponse,
    summary="Get bathroom by ID",
)
def get_bathroom(
    bathroom_id: str,
    db: Session = Depends(get_db),
) -> Any:
    """Fetch details of a specific bathroom."""
    bathroom = db.execute(
        select(Bathroom).options(selectinload(Bathroom.extras)).where(Bathroom.id == bathroom_id)
    ).scalar_one_or_none()

    if not bathroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El baño solicitado no existe.",
        )
    return BathroomResponse.model_validate(bathroom)


@router.put(
    "/{bathroom_id}",
    response_model=BathroomResponse,
    summary="Update a bathroom",
)
def update_bathroom(
    bathroom_id: str,
    data: BathroomUpdate,
    db: Session = Depends(get_db),
) -> Any:
    """Update existing bathroom information, location or availability."""
    bathroom = db.execute(
        select(Bathroom).options(selectinload(Bathroom.extras)).where(Bathroom.id == bathroom_id)
    ).scalar_one_or_none()

    if not bathroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El baño solicitado no existe.",
        )

    if data.price_base is not None and data.price_base < settings.MIN_BATHROOM_PRICE:
        msg = f"El precio base no puede ser inferior a ${settings.MIN_BATHROOM_PRICE:.2f} ARS."
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=msg,
        )

    update_dict = data.model_dump(exclude_unset=True, exclude={"extras"})

    # Update geometry if coordinates change
    new_lat = update_dict.get("latitude", bathroom.latitude)
    new_lng = update_dict.get("longitude", bathroom.longitude)
    if "latitude" in update_dict or "longitude" in update_dict:
        update_dict["location"] = WKTElement(f"POINT({new_lng} {new_lat})", srid=4326)

    if "opening_hours" in update_dict and update_dict["opening_hours"] is not None:
        update_dict["opening_hours"] = [
            h.model_dump() if hasattr(h, "model_dump") else h for h in update_dict["opening_hours"]
        ]
    if "photos" in update_dict and update_dict["photos"] is not None:
        update_dict["photos"] = [
            p.model_dump() if hasattr(p, "model_dump") else p for p in update_dict["photos"]
        ]

    for key, value in update_dict.items():
        setattr(bathroom, key, value)

    db.commit()

    # Re-fetch
    refreshed = db.execute(
        select(Bathroom).options(selectinload(Bathroom.extras)).where(Bathroom.id == bathroom_id)
    ).scalar_one()

    return BathroomResponse.model_validate(refreshed)


@router.delete(
    "/{bathroom_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete or deactivate bathroom",
)
def delete_bathroom(
    bathroom_id: str,
    db: Session = Depends(get_db),
) -> None:
    """Remove a bathroom from the marketplace."""
    bathroom = db.get(Bathroom, bathroom_id)
    if not bathroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El baño solicitado no existe.",
        )
    db.delete(bathroom)
    db.commit()


@router.post(
    "/{bathroom_id}/extras",
    response_model=BathroomExtraResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an extra to a bathroom",
)
def add_bathroom_extra(
    bathroom_id: str,
    data: BathroomExtraCreate,
    db: Session = Depends(get_db),
) -> Any:
    """Add a chargeable extra service to an existing bathroom."""
    bathroom = db.get(Bathroom, bathroom_id)
    if not bathroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El baño solicitado no existe.",
        )

    extra = BathroomExtra(
        id=str(uuid.uuid4()),
        bathroom_id=bathroom_id,
        name=data.name,
        description=data.description,
        price=data.price,
        is_active=data.is_active,
    )
    db.add(extra)
    db.commit()
    db.refresh(extra)
    return BathroomExtraResponse.model_validate(extra)
