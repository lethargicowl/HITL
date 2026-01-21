from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid

from ..database import get_db
from ..models import (
    Session as DBSession, DataRow, Project, ProjectAssignment, User,
    UploadResponse, SessionListItem, SessionResponse
)
from ..services.excel_parser import parse_file
from ..dependencies import get_current_user, require_requester

router = APIRouter(prefix="/api", tags=["uploads"])


@router.post("/projects/{project_id}/upload", response_model=UploadResponse)
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    session_name: Optional[str] = Form(None),
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Upload an Excel/CSV file to a project (requester only)."""
    # Verify project exists and user owns it
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Parse file (Excel or CSV)
    parsed = parse_file(file)

    # Create session
    session = DBSession(
        id=str(uuid.uuid4()),
        name=session_name or file.filename.rsplit('.', 1)[0],
        filename=file.filename,
        columns=json.dumps(parsed["columns"]),
        project_id=project_id
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
        project_id=project_id,
        message="Upload successful"
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session details."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check access
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

    return SessionResponse(
        id=session.id,
        name=session.name,
        filename=session.filename,
        columns=json.loads(session.columns),
        project_id=session.project_id,
        created_at=session.created_at,
        row_count=len(session.rows),
        rated_count=len(session.ratings)
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Delete a session and all its data (owner only)."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify ownership
    if session.project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(session)
    db.commit()

    return {"message": "Session deleted successfully"}
