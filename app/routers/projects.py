from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import (
    User, Project, ProjectAssignment, Session as DataSession, Rating,
    ProjectCreate, ProjectResponse, ProjectListItem, AssignRatersRequest, UserBasic
)
from ..dependencies import get_current_user, require_requester

router = APIRouter(prefix="/api/projects", tags=["projects"])


def get_project_stats(project: Project, db: Session) -> dict:
    """Get statistics for a project."""
    session_count = len(project.sessions)
    total_rows = 0
    rated_rows = 0

    for session in project.sessions:
        total_rows += len(session.rows)
        rated_rows += len(session.ratings)

    return {
        "session_count": session_count,
        "total_rows": total_rows,
        "rated_rows": rated_rows
    }


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Create a new project (requester only)."""
    project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        session_count=0,
        total_rows=0,
        rated_rows=0,
        assigned_raters=[]
    )


@router.get("/", response_model=List[ProjectListItem])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List projects for current user."""
    if current_user.role == "requester":
        # Requesters see their own projects
        projects = db.query(Project).filter(
            Project.owner_id == current_user.id
        ).order_by(Project.created_at.desc()).all()
    else:
        # Raters see projects they're assigned to
        assignments = db.query(ProjectAssignment).filter(
            ProjectAssignment.rater_id == current_user.id
        ).all()
        project_ids = [a.project_id for a in assignments]
        projects = db.query(Project).filter(
            Project.id.in_(project_ids)
        ).order_by(Project.created_at.desc()).all()

    result = []
    for project in projects:
        stats = get_project_stats(project, db)
        result.append(ProjectListItem(
            id=project.id,
            name=project.name,
            description=project.description,
            created_at=project.created_at,
            **stats
        ))

    return result


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project details."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check access
    if current_user.role == "requester":
        if project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Check if rater is assigned
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.rater_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")

    stats = get_project_stats(project, db)
    assigned_raters = [
        UserBasic(id=a.rater.id, username=a.rater.username)
        for a in project.assignments
    ]

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        assigned_raters=assigned_raters,
        **stats
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Delete a project (owner only)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(project)
    db.commit()

    return {"message": "Project deleted successfully"}


@router.post("/{project_id}/assign")
async def assign_raters(
    project_id: str,
    request: AssignRatersRequest,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Assign raters to a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate rater IDs
    for rater_id in request.rater_ids:
        rater = db.query(User).filter(
            User.id == rater_id,
            User.role == "rater"
        ).first()
        if not rater:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid rater ID: {rater_id}"
            )

        # Check if already assigned
        existing = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.rater_id == rater_id
        ).first()

        if not existing:
            assignment = ProjectAssignment(
                project_id=project_id,
                rater_id=rater_id
            )
            db.add(assignment)

    db.commit()

    return {"message": "Raters assigned successfully"}


@router.delete("/{project_id}/raters/{rater_id}")
async def remove_rater(
    project_id: str,
    rater_id: str,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Remove a rater from a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    assignment = db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id,
        ProjectAssignment.rater_id == rater_id
    ).first()

    if assignment:
        db.delete(assignment)
        db.commit()

    return {"message": "Rater removed successfully"}


@router.get("/{project_id}/sessions", response_model=List[dict])
async def get_project_sessions(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all sessions in a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check access
    if current_user.role == "requester":
        if project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.rater_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")

    sessions = []
    for session in project.sessions:
        sessions.append({
            "id": session.id,
            "name": session.name,
            "filename": session.filename,
            "created_at": session.created_at,
            "row_count": len(session.rows),
            "rated_count": len(session.ratings)
        })

    return sessions
