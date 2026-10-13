"""Uploads endpoint: Cloudinary signature and direct image upload for local dev."""

import base64
import hashlib
import time
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.upload import CloudinarySignatureResponse, DirectUploadResponse

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.get(
    "/signature",
    response_model=CloudinarySignatureResponse,
    summary="Get Cloudinary signed upload parameters",
)
def get_cloudinary_signature(folder: str = "bathrooms") -> CloudinarySignatureResponse:
    """Generate SHA-1 signature for client-side direct upload to Cloudinary."""
    timestamp = int(time.time())
    api_secret = settings.CLOUDINARY_API_SECRET
    api_key = settings.CLOUDINARY_API_KEY
    cloud_name = settings.CLOUDINARY_CLOUD_NAME

    # Parameters must be ordered alphabetically by key for Cloudinary signature
    params_to_sign = f"folder={folder}&timestamp={timestamp}"
    signature = hashlib.sha1(f"{params_to_sign}{api_secret}".encode()).hexdigest()

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    return CloudinarySignatureResponse(
        signature=signature,
        timestamp=timestamp,
        api_key=api_key,
        cloud_name=cloud_name,
        folder=folder,
        upload_url=upload_url,
    )


@router.post(
    "/direct",
    response_model=DirectUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Direct image upload (works offline & in local dev)",
)
async def upload_image_direct(file: UploadFile = File(...)) -> DirectUploadResponse:
    """Upload image directly.

    In local dev / mock mode, converts to an optimized inline data URL or serves it,
    allowing the vendor to preview and publish bathrooms immediately without external credentials.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP).",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen no puede superar los 10MB de tamaño.",
        )

    # Encode as base64 data URI for instant local storage and display
    encoded = base64.b64encode(content).decode("utf-8")
    data_url = f"data:{file.content_type};base64,{encoded}"
    public_id = f"local_{uuid.uuid4().hex[:12]}"
    extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"

    return DirectUploadResponse(
        url=data_url,
        public_id=public_id,
        format=extension,
    )
