from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .database import Base
from pydantic import BaseModel, Field
from typing import Optional, List, Any


# ============== SQLAlchemy ORM Models ==============

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # "requester" or "rater"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owned_projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="rater")
    project_assignments = relationship("ProjectAssignment", back_populates="rater", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True)  # Session token
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Evaluation schema fields (legacy single-question mode)
    evaluation_type = Column(String, default="rating")  # rating, binary, multi_label, multi_criteria, pairwise
    evaluation_config = Column(Text, nullable=True)  # JSON config for the evaluation type
    instructions = Column(Text, nullable=True)  # Markdown instructions for raters

    # Multi-question mode
    use_multi_questions = Column(Boolean, default=False)  # If True, use questions table instead of evaluation_type

    # Relationships
    owner = relationship("User", back_populates="owned_projects")
    sessions = relationship("Session", back_populates="project", cascade="all, delete-orphan")
    assignments = relationship("ProjectAssignment", back_populates="project", cascade="all, delete-orphan")
    questions = relationship("EvaluationQuestion", back_populates="project", cascade="all, delete-orphan", order_by="EvaluationQuestion.order")
    media_files = relationship("MediaFile", back_populates="project", cascade="all, delete-orphan")
    examples = relationship("AnnotationExample", back_populates="project", cascade="all, delete-orphan", order_by="AnnotationExample.order")


class MediaFile(Base):
    """Uploaded media file (images, videos, audio, PDFs)."""
    __tablename__ = "media_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)  # Stored filename (UUID-based)
    original_name = Column(String, nullable=False)  # Original uploaded filename
    mime_type = Column(String, nullable=False)  # e.g., "image/png", "video/mp4"
    size_bytes = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)  # Relative path in storage
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="media_files")


class EvaluationQuestion(Base):
    """Individual evaluation question within a project."""
    __tablename__ = "evaluation_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    order = Column(Integer, default=0)  # Display order
    key = Column(String, nullable=False)  # Unique key within project (e.g., "quality", "safety")
    label = Column(String, nullable=False)  # Display label (e.g., "Overall Quality")
    description = Column(Text, nullable=True)  # Help text shown to raters
    question_type = Column(String, nullable=False)  # rating, binary, multi_label, multi_criteria, pairwise
    config = Column(Text, nullable=False)  # JSON config for this question type
    required = Column(Boolean, default=True)
    conditional = Column(Text, nullable=True)  # JSON: {"question": "is_safe", "equals": "no"}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Unique key per project
    __table_args__ = (UniqueConstraint('project_id', 'key', name='unique_question_key_per_project'),)

    project = relationship("Project", back_populates="questions")


class AnnotationExample(Base):
    """Example annotation to guide raters."""
    __tablename__ = "annotation_examples"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)  # Example title (e.g., "High Quality Response")
    content = Column(Text, nullable=False)  # JSON: the example data item
    example_response = Column(Text, nullable=False)  # JSON: the correct/expected response
    explanation = Column(Text, nullable=True)  # Why this is the correct answer
    is_positive = Column(Boolean, default=True)  # True = good example, False = bad example
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="examples")


class ProjectAssignment(Base):
    __tablename__ = "project_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    rater_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('project_id', 'rater_id'),)

    project = relationship("Project", back_populates="assignments")
    rater = relationship("User", back_populates="project_assignments")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    columns = Column(Text, nullable=False)  # JSON array of column names
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sessions")
    rows = relationship("DataRow", back_populates="session", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="session", cascade="all, delete-orphan")


class DataRow(Base):
    __tablename__ = "data_rows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)  # JSON object of row data

    session = relationship("Session", back_populates="rows")
    ratings = relationship("Rating", back_populates="data_row", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_row_id = Column(String, ForeignKey("data_rows.id"), nullable=False)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    rater_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating_value = Column(Integer, nullable=True)  # Kept for backward compatibility and simple queries
    response = Column(Text, nullable=True)  # JSON - flexible response for all evaluation types
    comment = Column(Text, nullable=True)
    time_spent_ms = Column(Integer, nullable=True)  # Time spent on this rating
    rated_at = Column(DateTime, default=datetime.utcnow)

    # One rating per rater per row
    __table_args__ = (UniqueConstraint('data_row_id', 'rater_id', name='unique_rating_per_rater'),)

    data_row = relationship("DataRow", back_populates="ratings")
    session = relationship("Session", back_populates="ratings")
    rater = relationship("User", back_populates="ratings")


# ============== Pydantic Schemas ==============

# --- User Schemas ---

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    role: str = Field(pattern="^(requester|rater)$")


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    id: str
    username: str

    class Config:
        from_attributes = True


# --- Project Schemas ---

class EvaluationConfig(BaseModel):
    """Configuration for different evaluation types."""
    # For rating type
    min: Optional[int] = 1
    max: Optional[int] = 5
    labels: Optional[dict] = None  # e.g., {"1": "Poor", "5": "Excellent"}

    # For binary type
    options: Optional[List[dict]] = None  # e.g., [{"value": "yes", "label": "Yes"}, ...]

    # For multi_label type
    min_select: Optional[int] = 0
    max_select: Optional[int] = None

    # For multi_criteria type
    criteria: Optional[List[dict]] = None  # e.g., [{"key": "accuracy", "label": "Accuracy", "min": 1, "max": 5}]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    evaluation_type: Optional[str] = "rating"  # rating, binary, multi_label, multi_criteria
    evaluation_config: Optional[dict] = None
    instructions: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    created_at: datetime
    evaluation_type: str = "rating"
    evaluation_config: Optional[dict] = None
    instructions: Optional[str] = None
    session_count: int = 0
    total_rows: int = 0
    rated_rows: int = 0
    assigned_raters: List[UserBasic] = []

    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    evaluation_type: str = "rating"
    session_count: int = 0
    total_rows: int = 0
    rated_rows: int = 0

    class Config:
        from_attributes = True


class AssignRatersRequest(BaseModel):
    rater_ids: List[str]


# --- Session Schemas ---

class SessionCreate(BaseModel):
    name: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    name: str
    filename: str
    columns: List[str]
    project_id: str
    created_at: datetime
    row_count: int
    rated_count: int

    class Config:
        from_attributes = True


class SessionListItem(BaseModel):
    id: str
    name: str
    filename: str
    created_at: datetime
    row_count: int
    rated_count: int

    class Config:
        from_attributes = True


class ProjectBasic(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


class ProjectDetailForSession(BaseModel):
    id: str
    name: str
    evaluation_type: str = "rating"
    evaluation_config: Optional[dict] = None
    instructions: Optional[str] = None
    use_multi_questions: bool = False
    questions: List[dict] = []  # Simplified question list for session view

    class Config:
        from_attributes = True


class SessionDetailResponse(BaseModel):
    id: str
    name: str
    filename: str
    columns: List[str]
    project_id: str
    project: ProjectDetailForSession
    created_at: datetime
    row_count: int
    rated_count: int

    class Config:
        from_attributes = True


# --- Rating Schemas ---

class RatingResponse(BaseModel):
    id: str
    rating_value: Optional[int] = None
    response: Optional[dict] = None  # Flexible response for all evaluation types
    comment: Optional[str] = None
    rated_at: datetime
    rater_id: Optional[str] = None
    rater_username: Optional[str] = None

    class Config:
        from_attributes = True


class DataRowResponse(BaseModel):
    id: str
    row_index: int
    content: dict
    ratings: List[RatingResponse] = []
    my_rating: Optional[RatingResponse] = None  # Current user's rating

    class Config:
        from_attributes = True


class PaginatedRowsResponse(BaseModel):
    items: List[DataRowResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    rated_count: int


class RatingCreate(BaseModel):
    data_row_id: str
    session_id: str
    rating_value: Optional[int] = None  # Kept for backward compatibility
    response: Optional[dict] = None  # Flexible response for all evaluation types
    comment: Optional[str] = None
    time_spent_ms: Optional[int] = None


class RatingUpdate(BaseModel):
    rating_value: Optional[int] = None
    response: Optional[dict] = None
    comment: Optional[str] = None


class UploadResponse(BaseModel):
    session_id: str
    session_name: str
    filename: str
    row_count: int
    columns: List[str]
    project_id: str
    message: str


# --- Evaluation Question Schemas ---

class QuestionConditional(BaseModel):
    """Conditional display rule for a question."""
    question: str  # Key of the question to check
    equals: Optional[Any] = None  # Show if equals this value
    not_equals: Optional[Any] = None  # Show if not equals this value
    contains: Optional[Any] = None  # For multi-select: show if contains this value


class EvaluationQuestionCreate(BaseModel):
    key: str = Field(min_length=1, max_length=50, pattern="^[a-z][a-z0-9_]*$")
    label: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    question_type: str = Field(pattern="^(rating|binary|multi_label|multi_criteria|pairwise|text)$")
    config: dict  # Type-specific configuration
    required: bool = True
    conditional: Optional[QuestionConditional] = None
    order: Optional[int] = None


class EvaluationQuestionUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    required: Optional[bool] = None
    conditional: Optional[QuestionConditional] = None
    order: Optional[int] = None


class EvaluationQuestionResponse(BaseModel):
    id: str
    project_id: str
    order: int
    key: str
    label: str
    description: Optional[str] = None
    question_type: str
    config: dict
    required: bool = True
    conditional: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionsReorderRequest(BaseModel):
    """Request to reorder questions."""
    question_ids: List[str]  # Ordered list of question IDs


# --- Annotation Example Schemas ---

class AnnotationExampleCreate(BaseModel):
    """Create a new annotation example."""
    title: str = Field(min_length=1, max_length=200)
    content: dict  # The example data item (like a DataRow content)
    example_response: dict  # The expected/correct response
    explanation: Optional[str] = None
    is_positive: bool = True  # Good example (True) or bad example (False)
    order: Optional[int] = None


class AnnotationExampleUpdate(BaseModel):
    """Update an annotation example."""
    title: Optional[str] = None
    content: Optional[dict] = None
    example_response: Optional[dict] = None
    explanation: Optional[str] = None
    is_positive: Optional[bool] = None
    order: Optional[int] = None


class AnnotationExampleResponse(BaseModel):
    """Response for an annotation example."""
    id: str
    project_id: str
    title: str
    content: dict
    example_response: dict
    explanation: Optional[str] = None
    is_positive: bool = True
    order: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ExamplesReorderRequest(BaseModel):
    """Request to reorder examples."""
    example_ids: List[str]


class ProjectWithQuestionsResponse(BaseModel):
    """Project response including questions for multi-question mode."""
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    created_at: datetime
    evaluation_type: str = "rating"
    evaluation_config: Optional[dict] = None
    instructions: Optional[str] = None
    use_multi_questions: bool = False
    questions: List[EvaluationQuestionResponse] = []
    session_count: int = 0
    total_rows: int = 0
    rated_rows: int = 0
    assigned_raters: List[UserBasic] = []

    class Config:
        from_attributes = True


# --- Media File Schemas ---

class MediaFileResponse(BaseModel):
    """Response schema for a media file."""
    id: str
    project_id: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    storage_path: str
    url: str  # Computed URL for accessing the file
    created_at: datetime

    class Config:
        from_attributes = True


class MediaUploadResponse(BaseModel):
    """Response after uploading media files."""
    files: List[MediaFileResponse]
    message: str


class MediaContentType(BaseModel):
    """Describes how to render content in a data row."""
    type: str  # text, image, video, audio, pdf, code, html, url
    value: str  # The actual content or reference
    mime_type: Optional[str] = None  # MIME type if applicable
    label: Optional[str] = None  # Display label


# Supported MIME types for media files
SUPPORTED_MEDIA_TYPES = {
    # Images
    "image/png": "image",
    "image/jpeg": "image",
    "image/gif": "image",
    "image/webp": "image",
    "image/svg+xml": "image",
    # Videos
    "video/mp4": "video",
    "video/webm": "video",
    "video/ogg": "video",
    # Audio
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/ogg": "audio",
    "audio/webm": "audio",
    # Documents
    "application/pdf": "pdf",
}
