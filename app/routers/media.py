"""
Media file upload and serving endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json

from ..database import get_db
from ..models import (
    User, Project, ProjectAssignment, MediaFile,
    MediaFileResponse, MediaUploadResponse, SUPPORTED_MEDIA_TYPES
)
from ..dependencies import get_current_user
from ..services.media_service import media_storage

router = APIRouter(prefix="/api", tags=["media"])


def get_media_url(request: Request, media_id: str) -> str:
    """Generate the URL for accessing a media file."""
    return f"{request.base_url}api/media/{media_id}"


@router.post("/projects/{project_id}/media", response_model=MediaUploadResponse)
async def upload_media(
    project_id: str,
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload one or more media files to a project."""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only project owner can upload media
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project owner can upload media")

    uploaded_files = []
    errors = []

    for file in files:
        # Validate file type
        is_valid, mime_type, error = media_storage.validate_file(file)
        if not is_valid:
            errors.append(f"{file.filename}: {error}")
            continue

        try:
            # Save file to storage
            stored_filename, storage_path, size_bytes = await media_storage.save_file(
                file, project_id
            )

            # Create database record
            media_file = MediaFile(
                project_id=project_id,
                filename=stored_filename,
                original_name=file.filename,
                mime_type=mime_type,
                size_bytes=size_bytes,
                storage_path=storage_path
            )
            db.add(media_file)
            db.commit()
            db.refresh(media_file)

            # Build response
            uploaded_files.append(MediaFileResponse(
                id=media_file.id,
                project_id=media_file.project_id,
                filename=media_file.filename,
                original_name=media_file.original_name,
                mime_type=media_file.mime_type,
                size_bytes=media_file.size_bytes,
                storage_path=media_file.storage_path,
                url=get_media_url(request, media_file.id),
                created_at=media_file.created_at
            ))

        except Exception as e:
            db.rollback()
            errors.append(f"{file.filename}: Upload failed - {str(e)}")

    if errors and not uploaded_files:
        raise HTTPException(
            status_code=400,
            detail={"message": "All uploads failed", "errors": errors}
        )

    message = f"Uploaded {len(uploaded_files)} file(s)"
    if errors:
        message += f" with {len(errors)} error(s)"

    return MediaUploadResponse(files=uploaded_files, message=message)


@router.get("/projects/{project_id}/media", response_model=List[MediaFileResponse])
async def list_media(
    project_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all media files for a project."""
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

    media_files = db.query(MediaFile).filter(
        MediaFile.project_id == project_id
    ).order_by(MediaFile.created_at.desc()).all()

    return [
        MediaFileResponse(
            id=mf.id,
            project_id=mf.project_id,
            filename=mf.filename,
            original_name=mf.original_name,
            mime_type=mf.mime_type,
            size_bytes=mf.size_bytes,
            storage_path=mf.storage_path,
            url=get_media_url(request, mf.id),
            created_at=mf.created_at
        )
        for mf in media_files
    ]


@router.get("/media/{media_id}")
async def serve_media(
    media_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serve a media file with proper content type."""
    media_file = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")

    # Check access - user must have access to the project
    project = db.query(Project).filter(Project.id == media_file.project_id).first()
    if current_user.role == "requester":
        if project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == media_file.project_id,
            ProjectAssignment.rater_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")

    # Get file path
    file_path = media_storage.get_file_path(media_file.storage_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on storage")

    return FileResponse(
        path=str(file_path),
        media_type=media_file.mime_type,
        filename=media_file.original_name
    )


@router.delete("/media/{media_id}")
async def delete_media(
    media_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a media file."""
    media_file = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")

    # Only project owner can delete
    project = db.query(Project).filter(Project.id == media_file.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project owner can delete media")

    # Delete from storage
    media_storage.delete_file(media_file.storage_path)

    # Delete from database
    db.delete(media_file)
    db.commit()

    return {"message": "Media file deleted"}


@router.get("/media/{media_id}/info", response_model=MediaFileResponse)
async def get_media_info(
    media_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get metadata for a media file."""
    media_file = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")

    # Check access
    project = db.query(Project).filter(Project.id == media_file.project_id).first()
    if current_user.role == "requester":
        if project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == media_file.project_id,
            ProjectAssignment.rater_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")

    return MediaFileResponse(
        id=media_file.id,
        project_id=media_file.project_id,
        filename=media_file.filename,
        original_name=media_file.original_name,
        mime_type=media_file.mime_type,
        size_bytes=media_file.size_bytes,
        storage_path=media_file.storage_path,
        url=get_media_url(request, media_file.id),
        created_at=media_file.created_at
    )
