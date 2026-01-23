from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from ..database import get_db
import json

from ..models import (
    User, Project, ProjectAssignment, Session as DataSession, Rating, EvaluationQuestion,
    ProjectCreate, ProjectResponse, ProjectListItem, AssignRatersRequest, UserBasic,
    EvaluationQuestionResponse, ProjectWithQuestionsResponse
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


def get_default_evaluation_config(eval_type: str) -> dict:
    """Get default configuration for an evaluation type."""
    if eval_type == "rating":
        return {"min": 1, "max": 5, "labels": {"1": "Poor", "5": "Excellent"}}
    elif eval_type == "binary":
        return {"options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]}
    elif eval_type == "multi_label":
        return {"options": [{"value": "option1", "label": "Option 1"}], "min_select": 0, "max_select": None}
    elif eval_type == "multi_criteria":
        return {"criteria": [{"key": "quality", "label": "Quality", "min": 1, "max": 5}]}
    return {}


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Create a new project (requester only)."""
    eval_type = project_data.evaluation_type or "rating"
    eval_config = project_data.evaluation_config or get_default_evaluation_config(eval_type)

    project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id,
        evaluation_type=eval_type,
        evaluation_config=json.dumps(eval_config) if eval_config else None,
        instructions=project_data.instructions
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
        evaluation_type=project.evaluation_type,
        evaluation_config=json.loads(project.evaluation_config) if project.evaluation_config else None,
        instructions=project.instructions,
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
            evaluation_type=project.evaluation_type or "rating",
            **stats
        ))

    return result


def get_questions_for_project(project: Project) -> list:
    """Get formatted questions for a project."""
    return [
        EvaluationQuestionResponse(
            id=q.id,
            project_id=q.project_id,
            order=q.order,
            key=q.key,
            label=q.label,
            description=q.description,
            question_type=q.question_type,
            config=json.loads(q.config) if q.config else {},
            required=q.required,
            conditional=json.loads(q.conditional) if q.conditional else None,
            created_at=q.created_at
        )
        for q in sorted(project.questions, key=lambda x: x.order)
    ]


@router.get("/{project_id}", response_model=ProjectWithQuestionsResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project details including questions if multi-question mode."""
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

    questions = get_questions_for_project(project) if project.use_multi_questions else []

    return ProjectWithQuestionsResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        created_at=project.created_at,
        evaluation_type=project.evaluation_type or "rating",
        evaluation_config=json.loads(project.evaluation_config) if project.evaluation_config else None,
        instructions=project.instructions,
        use_multi_questions=project.use_multi_questions or False,
        questions=questions,
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


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    evaluation_type: Optional[str] = None
    evaluation_config: Optional[dict] = None
    instructions: Optional[str] = None
    use_multi_questions: Optional[bool] = None


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(require_requester),
    db: Session = Depends(get_db)
):
    """Update project settings (owner only)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update fields if provided
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.evaluation_type is not None:
        project.evaluation_type = project_data.evaluation_type
    if project_data.evaluation_config is not None:
        project.evaluation_config = json.dumps(project_data.evaluation_config)
    if project_data.instructions is not None:
        project.instructions = project_data.instructions
    if project_data.use_multi_questions is not None:
        project.use_multi_questions = project_data.use_multi_questions

    db.commit()
    db.refresh(project)

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
        evaluation_type=project.evaluation_type or "rating",
        evaluation_config=json.loads(project.evaluation_config) if project.evaluation_config else None,
        instructions=project.instructions,
        assigned_raters=assigned_raters,
        **stats
    )


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
