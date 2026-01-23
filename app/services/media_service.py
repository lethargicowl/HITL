"""
Media storage service for handling file uploads and retrieval.
Supports local filesystem storage with optional S3 support in the future.
"""

import os
import uuid
import shutil
import mimetypes
from pathlib import Path
from typing import Optional, Tuple, BinaryIO
from fastapi import UploadFile

from ..models import SUPPORTED_MEDIA_TYPES


class MediaStorageService:
    """Handles media file storage operations."""

    def __init__(self, base_path: str = "data/media"):
        """Initialize the storage service.

        Args:
            base_path: Base directory for storing media files
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def get_project_path(self, project_id: str) -> Path:
        """Get the storage path for a project's media files."""
        project_path = self.base_path / project_id
        project_path.mkdir(parents=True, exist_ok=True)
        return project_path

    def generate_filename(self, original_name: str) -> str:
        """Generate a unique filename while preserving extension."""
        ext = Path(original_name).suffix.lower()
        return f"{uuid.uuid4()}{ext}"

    def validate_file(self, file: UploadFile) -> Tuple[bool, str, str]:
        """Validate an uploaded file.

        Returns:
            Tuple of (is_valid, mime_type, error_message)
        """
        # Get MIME type
        mime_type = file.content_type
        if not mime_type:
            # Try to guess from filename
            mime_type, _ = mimetypes.guess_type(file.filename)

        if not mime_type:
            return False, "", "Could not determine file type"

        # Check if supported
        if mime_type not in SUPPORTED_MEDIA_TYPES:
            return False, mime_type, f"Unsupported file type: {mime_type}"

        return True, mime_type, ""

    async def save_file(
        self,
        file: UploadFile,
        project_id: str
    ) -> Tuple[str, str, int]:
        """Save an uploaded file to storage.

        Args:
            file: The uploaded file
            project_id: Project ID for organizing storage

        Returns:
            Tuple of (stored_filename, storage_path, size_bytes)
        """
        project_path = self.get_project_path(project_id)
        stored_filename = self.generate_filename(file.filename)
        file_path = project_path / stored_filename

        # Save the file
        size_bytes = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):  # Read in 8KB chunks
                buffer.write(chunk)
                size_bytes += len(chunk)

        # Return relative path from base
        relative_path = str(file_path.relative_to(self.base_path))
        return stored_filename, relative_path, size_bytes

    def get_file_path(self, storage_path: str) -> Path:
        """Get the full filesystem path for a stored file."""
        return self.base_path / storage_path

    def file_exists(self, storage_path: str) -> bool:
        """Check if a file exists in storage."""
        return self.get_file_path(storage_path).exists()

    def delete_file(self, storage_path: str) -> bool:
        """Delete a file from storage.

        Returns:
            True if deleted, False if not found
        """
        file_path = self.get_file_path(storage_path)
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def delete_project_media(self, project_id: str) -> int:
        """Delete all media files for a project.

        Returns:
            Number of files deleted
        """
        project_path = self.base_path / project_id
        if not project_path.exists():
            return 0

        count = 0
        for file_path in project_path.iterdir():
            if file_path.is_file():
                file_path.unlink()
                count += 1

        # Remove empty directory
        if project_path.exists() and not any(project_path.iterdir()):
            project_path.rmdir()

        return count

    def get_content_type(self, mime_type: str) -> str:
        """Get the content type category for a MIME type."""
        return SUPPORTED_MEDIA_TYPES.get(mime_type, "unknown")


# Module-level instance
media_storage = MediaStorageService()


def detect_content_type(value: str) -> Tuple[str, Optional[str]]:
    """Detect the content type of a value in a data row.

    Checks for:
    - media:// references (internal media files)
    - URLs (http/https)
    - Data URLs (base64 encoded)
    - Plain text

    Returns:
        Tuple of (content_type, media_id_or_url)
    """
    if not value or not isinstance(value, str):
        return "text", None

    value = value.strip()

    # Check for internal media reference
    if value.startswith("media://"):
        media_id = value[8:]  # Remove "media://" prefix
        return "media_ref", media_id

    # Check for YouTube/Vimeo URLs
    if "youtube.com" in value or "youtu.be" in value:
        return "youtube", value
    if "vimeo.com" in value:
        return "vimeo", value

    # Check for URLs
    if value.startswith(("http://", "https://")):
        # Try to determine type from URL
        lower = value.lower()
        if any(ext in lower for ext in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]):
            return "image_url", value
        if any(ext in lower for ext in [".mp4", ".webm", ".ogg"]):
            return "video_url", value
        if any(ext in lower for ext in [".mp3", ".wav"]):
            return "audio_url", value
        if ".pdf" in lower:
            return "pdf_url", value
        return "url", value

    # Check for data URLs (base64 encoded)
    if value.startswith("data:"):
        if value.startswith("data:image/"):
            return "image_data", value
        if value.startswith("data:video/"):
            return "video_data", value
        if value.startswith("data:audio/"):
            return "audio_data", value
        return "data_url", value

    # Default to text
    return "text", None
