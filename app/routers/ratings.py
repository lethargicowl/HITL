from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
import uuid
import math

from ..database import get_db
from ..models import (
    Session as DBSession, DataRow, Rating, ProjectAssignment, User,
    RatingCreate, RatingResponse, DataRowResponse, PaginatedRowsResponse
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["ratings"])


def check_session_access(session: DBSession, current_user: User, db: Session):
    """Verify user has access to the session."""
    project = session.project
    if current_user.role == "requester":
        if project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == project.id,
            ProjectAssignment.rater_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")


@router.get("/sessions/{session_id}/rows", response_model=PaginatedRowsResponse)
async def get_session_rows(
    session_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    filter: Optional[str] = Query(None, pattern="^(all|rated|unrated)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated rows for a session with their ratings."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check access
    check_session_access(session, current_user, db)

    # Base query
    query = db.query(DataRow).filter(DataRow.session_id == session_id)

    # Apply filter
    if filter == "rated":
        query = query.filter(DataRow.rating != None)
    elif filter == "unrated":
        query = query.filter(DataRow.rating == None)

    # Get total count
    total = query.count()
    total_pages = math.ceil(total / per_page) if total > 0 else 1

    # Get paginated rows
    rows = query.order_by(DataRow.row_index).offset((page - 1) * per_page).limit(per_page).all()

    # Get rated count for session
    rated_count = db.query(Rating).filter(Rating.session_id == session_id).count()

    # Build response
    items = []
    for row in rows:
        rating_data = None
        if row.rating:
            rating_data = RatingResponse(
                id=row.rating.id,
                rating_value=row.rating.rating_value,
                comment=row.rating.comment,
                rated_at=row.rating.rated_at,
                rater_id=row.rating.rater_id,
                rater_username=row.rating.rater.username if row.rating.rater else None
            )

        items.append(DataRowResponse(
            id=row.id,
            row_index=row.row_index,
            content=json.loads(row.content),
            rating=rating_data
        ))

    return PaginatedRowsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        rated_count=rated_count
    )


@router.post("/ratings", response_model=RatingResponse)
async def create_or_update_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a rating for a data row."""
    # Verify data row exists
    data_row = db.query(DataRow).filter(DataRow.id == rating_data.data_row_id).first()
    if not data_row:
        raise HTTPException(status_code=404, detail="Data row not found")

    # Verify session matches
    if data_row.session_id != rating_data.session_id:
        raise HTTPException(status_code=400, detail="Session ID mismatch")

    # Get session and check access
    session = db.query(DBSession).filter(DBSession.id == rating_data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    check_session_access(session, current_user, db)

    # Check for existing rating
    existing = db.query(Rating).filter(Rating.data_row_id == rating_data.data_row_id).first()

    if existing:
        # Update existing rating
        existing.rating_value = rating_data.rating_value
        existing.comment = rating_data.comment
        existing.rater_id = current_user.id  # Update rater
        db.commit()
        db.refresh(existing)
        return RatingResponse(
            id=existing.id,
            rating_value=existing.rating_value,
            comment=existing.comment,
            rated_at=existing.rated_at,
            rater_id=existing.rater_id,
            rater_username=current_user.username
        )

    # Create new rating
    new_rating = Rating(
        id=str(uuid.uuid4()),
        data_row_id=rating_data.data_row_id,
        session_id=rating_data.session_id,
        rater_id=current_user.id,
        rating_value=rating_data.rating_value,
        comment=rating_data.comment
    )
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    return RatingResponse(
        id=new_rating.id,
        rating_value=new_rating.rating_value,
        comment=new_rating.comment,
        rated_at=new_rating.rated_at,
        rater_id=new_rating.rater_id,
        rater_username=current_user.username
    )
