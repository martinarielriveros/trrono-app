"""Authentication endpoints: Register, Login, Me and Google OAuth."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginRequest, Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user or vendor account",
)
def register(
    data: UserCreate,
    db: Session = Depends(get_db),
) -> Token:
    """Register account with email, password and role (user | vendor)."""
    existing = db.execute(select(User).where(User.email == data.email.lower())).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta registrada con este correo electrónico.",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role if data.role in ["user", "vendor"] else "user",
        phone=data.phone,
        cbu_cvu=data.cbu_cvu,
        bank_alias=data.bank_alias,
        vendor_status="approved",  # In dev, auto-approve
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Log in with email and password",
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Authenticate and return JWT access token."""
    user = db.execute(select(User).where(User.email == data.email.lower())).scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta ha sido desactivada.",
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Retrieve currently logged in user profile."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/google",
    response_model=Token,
    summary="Google OAuth login or registration",
)
def login_with_google(
    data: GoogleLoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Login with Google credential. In mock or dev, handles mock token gracefully."""
    # If mock token or email passed
    email = "usuario.google@tronno.com.ar"
    full_name = "Usuario Google"

    if "@" in data.credential:
        email = data.credential.lower()
        full_name = email.split("@")[0].capitalize()

    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name,
            role=data.role if data.role in ["user", "vendor"] else "user",
            vendor_status="approved",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
