from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from ..database import get_db
from ..models import (
    Project, EvaluationQuestion, User,
    EvaluationQuestionCreate, EvaluationQuestionUpdate,
    EvaluationQuestionResponse, QuestionsReorderRequest
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/projects", tags=["questions"])


def get_project_for_owner(project_id: str, current_user: User, db: Session) -> Project:
    """Get project and verify ownership."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return project


@router.get("/{project_id}/questions", response_model=List[EvaluationQuestionResponse])
async def list_questions(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all questions for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Allow both owners and assigned raters to view questions
    if current_user.role == "requester" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    questions = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id
    ).order_by(EvaluationQuestion.order).all()

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
        for q in questions
    ]


@router.post("/{project_id}/questions", response_model=EvaluationQuestionResponse)
async def create_question(
    project_id: str,
    question: EvaluationQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new evaluation question for a project."""
    project = get_project_for_owner(project_id, current_user, db)

    # Check for duplicate key
    existing = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id,
        EvaluationQuestion.key == question.key
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Question with key '{question.key}' already exists")

    # Get max order
    max_order = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id
    ).count()

    db_question = EvaluationQuestion(
        project_id=project_id,
        order=question.order if question.order is not None else max_order,
        key=question.key,
        label=question.label,
        description=question.description,
        question_type=question.question_type,
        config=json.dumps(question.config),
        required=question.required,
        conditional=json.dumps(question.conditional.dict()) if question.conditional else None
    )

    db.add(db_question)

    # Enable multi-question mode on the project
    project.use_multi_questions = True

    db.commit()
    db.refresh(db_question)

    return EvaluationQuestionResponse(
        id=db_question.id,
        project_id=db_question.project_id,
        order=db_question.order,
        key=db_question.key,
        label=db_question.label,
        description=db_question.description,
        question_type=db_question.question_type,
        config=json.loads(db_question.config),
        required=db_question.required,
        conditional=json.loads(db_question.conditional) if db_question.conditional else None,
        created_at=db_question.created_at
    )


@router.get("/{project_id}/questions/{question_id}", response_model=EvaluationQuestionResponse)
async def get_question(
    project_id: str,
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single question."""
    question = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.id == question_id,
        EvaluationQuestion.project_id == project_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    project = question.project
    if current_user.role == "requester" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return EvaluationQuestionResponse(
        id=question.id,
        project_id=question.project_id,
        order=question.order,
        key=question.key,
        label=question.label,
        description=question.description,
        question_type=question.question_type,
        config=json.loads(question.config),
        required=question.required,
        conditional=json.loads(question.conditional) if question.conditional else None,
        created_at=question.created_at
    )


@router.patch("/{project_id}/questions/{question_id}", response_model=EvaluationQuestionResponse)
async def update_question(
    project_id: str,
    question_id: str,
    update: EvaluationQuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a question."""
    project = get_project_for_owner(project_id, current_user, db)

    question = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.id == question_id,
        EvaluationQuestion.project_id == project_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if update.label is not None:
        question.label = update.label
    if update.description is not None:
        question.description = update.description
    if update.config is not None:
        question.config = json.dumps(update.config)
    if update.required is not None:
        question.required = update.required
    if update.conditional is not None:
        question.conditional = json.dumps(update.conditional.dict())
    if update.order is not None:
        question.order = update.order

    db.commit()
    db.refresh(question)

    return EvaluationQuestionResponse(
        id=question.id,
        project_id=question.project_id,
        order=question.order,
        key=question.key,
        label=question.label,
        description=question.description,
        question_type=question.question_type,
        config=json.loads(question.config),
        required=question.required,
        conditional=json.loads(question.conditional) if question.conditional else None,
        created_at=question.created_at
    )


@router.delete("/{project_id}/questions/{question_id}")
async def delete_question(
    project_id: str,
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a question."""
    project = get_project_for_owner(project_id, current_user, db)

    question = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.id == question_id,
        EvaluationQuestion.project_id == project_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()

    # Check if any questions remain
    remaining = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id
    ).count()

    if remaining == 0:
        project.use_multi_questions = False
        db.commit()

    return {"message": "Question deleted"}


@router.post("/{project_id}/questions/reorder")
async def reorder_questions(
    project_id: str,
    request: QuestionsReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder questions by providing an ordered list of question IDs."""
    project = get_project_for_owner(project_id, current_user, db)

    questions = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id
    ).all()

    question_map = {q.id: q for q in questions}

    for i, qid in enumerate(request.question_ids):
        if qid in question_map:
            question_map[qid].order = i

    db.commit()

    return {"message": "Questions reordered"}


@router.post("/{project_id}/questions/bulk", response_model=List[EvaluationQuestionResponse])
async def create_questions_bulk(
    project_id: str,
    questions: List[EvaluationQuestionCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create multiple questions at once."""
    project = get_project_for_owner(project_id, current_user, db)

    # Check for duplicate keys in request
    keys = [q.key for q in questions]
    if len(keys) != len(set(keys)):
        raise HTTPException(status_code=400, detail="Duplicate question keys in request")

    # Check for existing keys
    existing = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id,
        EvaluationQuestion.key.in_(keys)
    ).all()
    if existing:
        existing_keys = [e.key for e in existing]
        raise HTTPException(status_code=400, detail=f"Questions with keys {existing_keys} already exist")

    # Get max order
    max_order = db.query(EvaluationQuestion).filter(
        EvaluationQuestion.project_id == project_id
    ).count()

    created = []
    for i, question in enumerate(questions):
        db_question = EvaluationQuestion(
            project_id=project_id,
            order=question.order if question.order is not None else max_order + i,
            key=question.key,
            label=question.label,
            description=question.description,
            question_type=question.question_type,
            config=json.dumps(question.config),
            required=question.required,
            conditional=json.dumps(question.conditional.dict()) if question.conditional else None
        )
        db.add(db_question)
        created.append(db_question)

    # Enable multi-question mode
    project.use_multi_questions = True

    db.commit()

    return [
        EvaluationQuestionResponse(
            id=q.id,
            project_id=q.project_id,
            order=q.order,
            key=q.key,
            label=q.label,
            description=q.description,
            question_type=q.question_type,
            config=json.loads(q.config),
            required=q.required,
            conditional=json.loads(q.conditional) if q.conditional else None,
            created_at=q.created_at
        )
        for q in created
    ]
