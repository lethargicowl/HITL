from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from ..database import get_db
from ..models import (
    Project, AnnotationExample, User,
    AnnotationExampleCreate, AnnotationExampleUpdate,
    AnnotationExampleResponse, ExamplesReorderRequest
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/projects", tags=["examples"])


def get_project_for_owner(project_id: str, current_user: User, db: Session) -> Project:
    """Get project and verify ownership."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return project


@router.get("/{project_id}/examples", response_model=List[AnnotationExampleResponse])
async def list_examples(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all annotation examples for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Allow both owners and assigned raters to view examples
    if current_user.role == "requester" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    examples = db.query(AnnotationExample).filter(
        AnnotationExample.project_id == project_id
    ).order_by(AnnotationExample.order).all()

    return [
        AnnotationExampleResponse(
            id=e.id,
            project_id=e.project_id,
            title=e.title,
            content=json.loads(e.content),
            example_response=json.loads(e.example_response),
            explanation=e.explanation,
            is_positive=e.is_positive,
            order=e.order,
            created_at=e.created_at
        )
        for e in examples
    ]


@router.post("/{project_id}/examples", response_model=AnnotationExampleResponse)
async def create_example(
    project_id: str,
    example: AnnotationExampleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new annotation example for a project."""
    project = get_project_for_owner(project_id, current_user, db)

    # Get max order
    max_order = db.query(AnnotationExample).filter(
        AnnotationExample.project_id == project_id
    ).count()

    db_example = AnnotationExample(
        project_id=project_id,
        title=example.title,
        content=json.dumps(example.content),
        example_response=json.dumps(example.example_response),
        explanation=example.explanation,
        is_positive=example.is_positive,
        order=example.order if example.order is not None else max_order
    )

    db.add(db_example)
    db.commit()
    db.refresh(db_example)

    return AnnotationExampleResponse(
        id=db_example.id,
        project_id=db_example.project_id,
        title=db_example.title,
        content=json.loads(db_example.content),
        example_response=json.loads(db_example.example_response),
        explanation=db_example.explanation,
        is_positive=db_example.is_positive,
        order=db_example.order,
        created_at=db_example.created_at
    )


@router.get("/{project_id}/examples/{example_id}", response_model=AnnotationExampleResponse)
async def get_example(
    project_id: str,
    example_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single annotation example."""
    example = db.query(AnnotationExample).filter(
        AnnotationExample.id == example_id,
        AnnotationExample.project_id == project_id
    ).first()

    if not example:
        raise HTTPException(status_code=404, detail="Example not found")

    project = example.project
    if current_user.role == "requester" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return AnnotationExampleResponse(
        id=example.id,
        project_id=example.project_id,
        title=example.title,
        content=json.loads(example.content),
        example_response=json.loads(example.example_response),
        explanation=example.explanation,
        is_positive=example.is_positive,
        order=example.order,
        created_at=example.created_at
    )


@router.patch("/{project_id}/examples/{example_id}", response_model=AnnotationExampleResponse)
async def update_example(
    project_id: str,
    example_id: str,
    update: AnnotationExampleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an annotation example."""
    project = get_project_for_owner(project_id, current_user, db)

    example = db.query(AnnotationExample).filter(
        AnnotationExample.id == example_id,
        AnnotationExample.project_id == project_id
    ).first()

    if not example:
        raise HTTPException(status_code=404, detail="Example not found")

    if update.title is not None:
        example.title = update.title
    if update.content is not None:
        example.content = json.dumps(update.content)
    if update.example_response is not None:
        example.example_response = json.dumps(update.example_response)
    if update.explanation is not None:
        example.explanation = update.explanation
    if update.is_positive is not None:
        example.is_positive = update.is_positive
    if update.order is not None:
        example.order = update.order

    db.commit()
    db.refresh(example)

    return AnnotationExampleResponse(
        id=example.id,
        project_id=example.project_id,
        title=example.title,
        content=json.loads(example.content),
        example_response=json.loads(example.example_response),
        explanation=example.explanation,
        is_positive=example.is_positive,
        order=example.order,
        created_at=example.created_at
    )


@router.delete("/{project_id}/examples/{example_id}")
async def delete_example(
    project_id: str,
    example_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an annotation example."""
    project = get_project_for_owner(project_id, current_user, db)

    example = db.query(AnnotationExample).filter(
        AnnotationExample.id == example_id,
        AnnotationExample.project_id == project_id
    ).first()

    if not example:
        raise HTTPException(status_code=404, detail="Example not found")

    db.delete(example)
    db.commit()

    return {"message": "Example deleted"}


@router.post("/{project_id}/examples/reorder")
async def reorder_examples(
    project_id: str,
    request: ExamplesReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder examples by providing an ordered list of example IDs."""
    project = get_project_for_owner(project_id, current_user, db)

    examples = db.query(AnnotationExample).filter(
        AnnotationExample.project_id == project_id
    ).all()

    example_map = {e.id: e for e in examples}

    for i, eid in enumerate(request.example_ids):
        if eid in example_map:
            example_map[eid].order = i

    db.commit()

    return {"message": "Examples reordered"}


@router.post("/{project_id}/examples/bulk", response_model=List[AnnotationExampleResponse])
async def create_examples_bulk(
    project_id: str,
    examples: List[AnnotationExampleCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create multiple examples at once."""
    project = get_project_for_owner(project_id, current_user, db)

    # Get max order
    max_order = db.query(AnnotationExample).filter(
        AnnotationExample.project_id == project_id
    ).count()

    created = []
    for i, example in enumerate(examples):
        db_example = AnnotationExample(
            project_id=project_id,
            title=example.title,
            content=json.dumps(example.content),
            example_response=json.dumps(example.example_response),
            explanation=example.explanation,
            is_positive=example.is_positive,
            order=example.order if example.order is not None else max_order + i
        )
        db.add(db_example)
        created.append(db_example)

    db.commit()

    return [
        AnnotationExampleResponse(
            id=e.id,
            project_id=e.project_id,
            title=e.title,
            content=json.loads(e.content),
            example_response=json.loads(e.example_response),
            explanation=e.explanation,
            is_positive=e.is_positive,
            order=e.order,
            created_at=e.created_at
        )
        for e in created
    ]
