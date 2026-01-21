from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .database import Base
from pydantic import BaseModel, Field
from typing import Optional, List


# ============== SQLAlchemy ORM Models ==============

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    columns = Column(Text, nullable=False)  # JSON array of column names
    created_at = Column(DateTime, default=datetime.utcnow)

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
    rating_value = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    rated_at = Column(DateTime, default=datetime.utcnow)

    data_row = relationship("DataRow", back_populates="rating")
    session = relationship("Session", back_populates="ratings")


# ============== Pydantic Schemas ==============

class SessionCreate(BaseModel):
    name: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    name: str
    filename: str
    columns: List[str]
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


class RatingResponse(BaseModel):
    id: str
    rating_value: int
    comment: Optional[str]
    rated_at: datetime

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
    message: str
