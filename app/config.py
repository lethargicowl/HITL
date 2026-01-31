"""
Application configuration from environment variables.
"""
import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = os.getenv("APP_NAME", "HITL Rating Platform")
    APP_VERSION: str = os.getenv("APP_VERSION", "2.0.0")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    SESSION_EXPIRE_DAYS: int = int(os.getenv("SESSION_EXPIRE_DAYS", "7"))
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ]

    # File storage
    DATA_DIR: str = os.getenv("DATA_DIR", "")
    MEDIA_DIR: str = os.getenv("MEDIA_DIR", "")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", str(50 * 1024 * 1024)))  # 50MB default

    @classmethod
    def get_database_url(cls) -> str:
        """Get database URL, defaulting to SQLite in data directory."""
        if cls.DATABASE_URL:
            return cls.DATABASE_URL
        data_dir = cls.get_data_dir()
        return f"sqlite:///{os.path.join(data_dir, 'hitl.db')}"

    @classmethod
    def get_data_dir(cls) -> str:
        """Get data directory path."""
        if cls.DATA_DIR:
            return cls.DATA_DIR
        base_dir = os.path.dirname(os.path.dirname(__file__))
        return os.path.join(base_dir, "data")

    @classmethod
    def get_media_dir(cls) -> str:
        """Get media directory path."""
        if cls.MEDIA_DIR:
            return cls.MEDIA_DIR
        return os.path.join(cls.get_data_dir(), "media")


# Global settings instance
settings = Settings()
