from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import settings
from ..models import User, UserSession, UserCreate, UserLogin, UserResponse
from ..services.auth_service import (
    hash_password, verify_password, create_session_token, get_session_expiry
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        created_at=user.created_at
    )


@router.post("/login")
async def login(
    user_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login and get session cookie."""
    # Find user
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Create session
    session_token = create_session_token()
    user_session = UserSession(
        id=session_token,
        user_id=user.id,
        expires_at=get_session_expiry()
    )
    db.add(user_session)
    db.commit()

    # Set cookie with production-safe settings
    response.set_cookie(
        key="session_id",
        value=session_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,  # True in production (HTTPS)
        samesite=settings.COOKIE_SAMESITE,
        max_age=60 * 60 * 24 * settings.SESSION_EXPIRE_DAYS,
    )

    return {
        "message": "Login successful",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            created_at=user.created_at
        )
    }


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout and clear session."""
    # Delete all sessions for this user (or just the current one)
    db.query(UserSession).filter(UserSession.user_id == current_user.id).delete()
    db.commit()

    # Clear cookie
    response.delete_cookie(key="session_id")

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        created_at=current_user.created_at
    )
