"""Authentication and user schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user fields."""

    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field("user", description="user | vendor | admin")
    phone: str | None = None
    cbu_cvu: str | None = None
    bank_alias: str | None = None


class UserCreate(UserBase):
    """User registration payload."""

    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    """Standard credentials login."""

    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    """Google OAuth callback or ID token."""

    credential: str  # Google ID Token or mock code
    role: str = "user"


class UserResponse(UserBase):
    """Public user response."""

    id: str
    is_active: bool
    vendor_status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
