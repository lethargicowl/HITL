from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .database import Base
from pydantic import BaseModel, Field
from typing import Optional, List


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

    # Relationships
    owner = relationship("User", back_populates="owned_projects")
    sessions = relationship("Session", back_populates="project", cascade="all, delete-orphan")
    assignments = relationship("ProjectAssignment", back_populates="project", cascade="all, delete-orphan")


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
    rating = relationship("Rating", back_populates="data_row", uselist=False, cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_row_id = Column(String, ForeignKey("data_rows.id"), unique=True, nullable=False)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    rater_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating_value = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    rated_at = Column(DateTime, default=datetime.utcnow)

    data_row = relationship("DataRow", back_populates="rating")
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

class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    created_at: datetime
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


# --- Rating Schemas ---

class RatingResponse(BaseModel):
    id: str
    rating_value: int
    comment: Optional[str]
    rated_at: datetime
    rater_id: Optional[str] = None
    rater_username: Optional[str] = None

    class Config:
        from_attributes = True


class DataRowResponse(BaseModel):
    id: str
    row_index: int
    content: dict
    rating: Optional[RatingResponse] = None

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
    rating_value: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class RatingUpdate(BaseModel):
    rating_value: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class UploadResponse(BaseModel):
    session_id: str
    session_name: str
    filename: str
    row_count: int
    columns: List[str]
    project_id: str
    message: str
