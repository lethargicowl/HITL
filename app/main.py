from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from .config import settings
from .database import init_db
from .routers import uploads, ratings, exports, auth, projects, users, questions, media, examples

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get base directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# React frontend build directory
REACT_BUILD_DIR = os.path.join(BASE_DIR, "frontend", "dist")

# Mount React assets
app.mount("/assets", StaticFiles(directory=os.path.join(REACT_BUILD_DIR, "assets")), name="react-assets")

@app.get("/vite.svg")
async def serve_vite_svg():
    return FileResponse(os.path.join(REACT_BUILD_DIR, "vite.svg"))

# Include API routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(questions.router)
app.include_router(users.router)
app.include_router(uploads.router)
app.include_router(ratings.router)
app.include_router(exports.router)
app.include_router(media.router)
app.include_router(examples.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()


# ==================== Health Check ====================

@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.APP_VERSION,
        }
    )


@app.get("/api/health", tags=["health"])
async def api_health_check():
    """API health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.APP_VERSION,
        }
    )


# Helper function to serve React SPA
def serve_react_spa():
    """Serve the React SPA index.html."""
    return FileResponse(os.path.join(REACT_BUILD_DIR, "index.html"))


# ==================== React SPA Routes ====================

@app.get("/")
async def home():
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/login")
async def login_page():
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/register")
async def register_page():
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/dashboard")
async def dashboard():
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/requester/dashboard")
async def requester_dashboard():
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/requester/projects/{project_id}")
async def requester_project_detail(project_id: str):
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/rater/dashboard")
async def rater_dashboard():
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/projects/{project_id}/rate")
async def project_rate(project_id: str):
    """Serve React SPA."""
    return serve_react_spa()

@app.get("/sessions/{session_id}/rate")
async def session_rate(session_id: str):
    """Serve React SPA."""
    return serve_react_spa()
