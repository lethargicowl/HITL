from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as DBSession
from datetime import datetime
from typing import Optional

from .database import get_db
from .models import User, UserSession


def get_current_user(
    request: Request,
    db: DBSession = Depends(get_db)
) -> User:
    """Extract and validate user from session cookie."""
    session_token = request.cookies.get("session_id")
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Look up session
    user_session = db.query(UserSession).filter(
        UserSession.id == session_token
    ).first()

    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )

    # Check if session expired
    if user_session.expires_at < datetime.utcnow():
        # Clean up expired session
        db.delete(user_session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )

    return user_session.user


def get_current_user_optional(
    request: Request,
    db: DBSession = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


def require_requester(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure current user is a requester."""
    if current_user.role != "requester":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requester role required"
        )
    return current_user


def require_rater(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure current user is a rater."""
    if current_user.role != "rater":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rater role required"
        )
    return current_user
