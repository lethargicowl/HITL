from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
import os

from .database import init_db, get_db
from .routers import uploads, ratings, exports, auth, projects, users, questions, media
from .dependencies import get_current_user_optional, get_current_user
from .models import User

# Initialize FastAPI app
app = FastAPI(title="HITL Rating Platform", version="2.0.0")

# Get base directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Mount static files
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(questions.router)
app.include_router(users.router)
app.include_router(uploads.router)
app.include_router(ratings.router)
app.include_router(exports.router)
app.include_router(media.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()


# ==================== Page Routes ====================

@app.get("/")
async def home(request: Request, current_user: User = Depends(get_current_user_optional)):
    """Landing page - redirect to dashboard if logged in."""
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=302)
    return RedirectResponse(url="/login", status_code=302)


@app.get("/login")
async def login_page(request: Request, current_user: User = Depends(get_current_user_optional)):
    """Login page."""
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("auth/login.html", {"request": request})


@app.get("/register")
async def register_page(request: Request, current_user: User = Depends(get_current_user_optional)):
    """Registration page."""
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("auth/register.html", {"request": request})


@app.get("/dashboard")
async def dashboard(request: Request, current_user: User = Depends(get_current_user)):
    """Dashboard - role-specific."""
    if current_user.role == "requester":
        return templates.TemplateResponse("requester/dashboard.html", {
            "request": request,
            "current_user": current_user
        })
    else:
        return templates.TemplateResponse("rater/dashboard.html", {
            "request": request,
            "current_user": current_user
        })


@app.get("/projects/{project_id}")
async def project_detail(request: Request, project_id: str, current_user: User = Depends(get_current_user)):
    """Project detail page - role-specific."""
    if current_user.role == "requester":
        return templates.TemplateResponse("requester/project_detail.html", {
            "request": request,
            "current_user": current_user,
            "project_id": project_id
        })
    else:
        return templates.TemplateResponse("rater/project_sessions.html", {
            "request": request,
            "current_user": current_user,
            "project_id": project_id
        })


@app.get("/projects/{project_id}/rate")
async def project_rate(request: Request, project_id: str, current_user: User = Depends(get_current_user)):
    """Project sessions page for raters."""
    return templates.TemplateResponse("rater/project_sessions.html", {
        "request": request,
        "current_user": current_user,
        "project_id": project_id
    })


@app.get("/rate/{session_id}")
async def rating_page(request: Request, session_id: str, current_user: User = Depends(get_current_user)):
    """Render the rating page for a session."""
    return templates.TemplateResponse("rating.html", {
        "request": request,
        "current_user": current_user,
        "session_id": session_id
    })
