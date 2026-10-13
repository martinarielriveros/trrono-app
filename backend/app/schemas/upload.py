"""Schemas for image uploads and Cloudinary signatures."""

from pydantic import BaseModel


class CloudinarySignatureResponse(BaseModel):
    """Cloudinary signed upload parameters."""

    signature: str
    timestamp: int
    api_key: str
    cloud_name: str
    folder: str
    upload_url: str


class DirectUploadResponse(BaseModel):
    """Result of uploading an image."""

    url: str
    public_id: str
    format: str
    width: int | None = None
    height: int | None = None
