from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
import os

from .database import init_db
from .routers import uploads, ratings, exports

# Initialize FastAPI app
app = FastAPI(title="HITL Rating Platform", version="1.0.0")

# Get base directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Mount static files
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Include routers
app.include_router(uploads.router)
app.include_router(ratings.router)
app.include_router(exports.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()


@app.get("/")
async def home(request: Request):
    """Render the home/upload page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/rate/{session_id}")
async def rating_page(request: Request, session_id: str):
    """Render the rating page for a session."""
    return templates.TemplateResponse("rating.html", {
        "request": request,
        "session_id": session_id
    })
