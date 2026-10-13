"""API v1 master router."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    bathrooms,
    health,
    payments,
    reservations,
    uploads,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(bathrooms.router)
api_router.include_router(reservations.router)
api_router.include_router(payments.router)
api_router.include_router(admin.router)
api_router.include_router(uploads.router)
