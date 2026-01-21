from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, UserBasic
from ..dependencies import require_requester

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/raters", response_model=List[UserBasic])
async def list_raters(
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """List all raters (for assignment by requesters)."""
    raters = db.query(User).filter(User.role == "rater").all()
    return [UserBasic(id=r.id, username=r.username) for r in raters]
