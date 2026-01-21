from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid

from ..database import get_db
from ..models import Session as DBSession, DataRow, UploadResponse, SessionListItem, SessionResponse
from ..services.excel_parser import parse_file

router = APIRouter(prefix="/api", tags=["uploads"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    session_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload an Excel file and create a rating session."""
    # Parse file (Excel or CSV)
    parsed = parse_file(file)

    # Create session
    session = DBSession(
        id=str(uuid.uuid4()),
        name=session_name or file.filename.rsplit('.', 1)[0],
        filename=file.filename,
        columns=json.dumps(parsed["columns"])
    )
    db.add(session)

    # Create data rows
    for row_data in parsed["rows"]:
        data_row = DataRow(
            id=str(uuid.uuid4()),
            session_id=session.id,
            row_index=row_data["row_index"],
            content=row_data["content"]
        )
        db.add(data_row)

    db.commit()
    db.refresh(session)

    return UploadResponse(
        session_id=session.id,
        session_name=session.name,
        filename=session.filename,
        row_count=parsed["row_count"],
        columns=parsed["columns"],
        message="Upload successful"
    )


@router.get("/sessions", response_model=List[SessionListItem])
async def list_sessions(db: Session = Depends(get_db)):
    """List all sessions with their progress."""
    sessions = db.query(DBSession).order_by(DBSession.created_at.desc()).all()

    result = []
    for session in sessions:
        row_count = len(session.rows)
        rated_count = len(session.ratings)
        result.append(SessionListItem(
            id=session.id,
            name=session.name,
            filename=session.filename,
            created_at=session.created_at,
            row_count=row_count,
            rated_count=rated_count
        ))

    return result


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session details."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        id=session.id,
        name=session.name,
        filename=session.filename,
        columns=json.loads(session.columns),
        created_at=session.created_at,
        row_count=len(session.rows),
        rated_count=len(session.ratings)
    )


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a session and all its data."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()

    return {"message": "Session deleted successfully"}
