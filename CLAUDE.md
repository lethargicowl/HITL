# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HITL (Human-in-the-Loop) Platform is a web-based system for collecting human ratings on datasets. Requesters create projects and upload CSV/Excel files, assign raters, and export results. Raters evaluate items on a 1-5 scale with optional comments.

## Commands

### Run Development Server
```bash
python3 -m uvicorn app.main:app --reload --port 8000
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Reset Database
```bash
rm data/hitl.db
# Restart server - new DB auto-created
```

### Access Points
- Application: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc

## Architecture

### Backend (FastAPI + SQLite)
```
app/main.py           → FastAPI app, static files, templates
app/models.py         → SQLAlchemy ORM (User, Project, Session, DataRow, Rating, ProjectAssignment, UserSession)
app/database.py       → DB engine and session management
app/dependencies.py   → Auth middleware, role-based access (require_requester, require_rater)
app/routers/          → API endpoints (auth, projects, uploads, ratings, exports, users)
app/services/         → Business logic (auth_service.py, excel_parser.py)
```

### Frontend (Jinja2 + Vanilla JS)
```
templates/            → Server-side rendered HTML
  base.html          → Layout with navigation
  requester/         → Project management views
  rater/             → Rating interface views
  rating.html        → Main evaluation interface
static/js/app.js      → All client-side logic (426 lines)
static/css/styles.css → Styling
```

### Data Flow
1. Requester creates project → uploads CSV/Excel → rows stored as JSON in DataRow
2. Requester assigns raters to project via ProjectAssignment
3. Raters see assigned projects → rate items (1-5 + comment) → stored in Rating
4. Requester exports results as Excel/CSV with per-rater columns and averages

### Key Relationships
- User has role: "requester" or "rater"
- Project belongs to one User (owner), has many Sessions
- Session contains uploaded file data, has many DataRows
- Rating links DataRow + User (rater), unique constraint prevents duplicate ratings
- ProjectAssignment links Project + User (rater) for access control

### Authentication
Session-based with HTTP-only cookies (7-day expiry). Password hashing via bcrypt. Session tokens stored in UserSession table.

## API Structure

| Prefix | Router | Purpose |
|--------|--------|---------|
| /api/auth | auth.py | register, login, logout, me |
| /api/projects | projects.py | CRUD, assign/remove raters |
| /api/projects/{id}/upload | uploads.py | File upload |
| /api/sessions | uploads.py, ratings.py | Session management, get rows |
| /api/ratings | ratings.py | Create/update ratings |
| /api/sessions/{id}/export | exports.py | Excel/CSV download |
| /api/users | users.py | List raters |

## Database

SQLite file at `data/hitl.db`, auto-created on first run. Models use UUID primary keys. JSON columns store flexible row content (DataRow.content) and column headers (Session.columns).

## Evaluation Types

Projects support configurable evaluation types:

| Type | Description | Config Example |
|------|-------------|----------------|
| `rating` | Numeric scale (default) | `{"min": 1, "max": 5, "labels": {"1": "Poor", "5": "Excellent"}}` |
| `binary` | Two-choice selection | `{"options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]}` |
| `multi_label` | Select multiple labels | `{"options": [...], "min_select": 0, "max_select": null}` |
| `multi_criteria` | Rate on multiple dimensions | `{"criteria": [{"key": "accuracy", "label": "Accuracy", "min": 1, "max": 5}]}` |

Rating responses are stored as JSON in `Rating.response` field. The `Rating.rating_value` field is kept for backward compatibility with rating-type evaluations.

## Development Notes

- No test suite currently exists
- No linting configuration present
- Frontend uses Fetch API for all HTTP requests
- File parsing supports CSV (comma-separated, UTF-8) and Excel (.xlsx, .xls)
- Export generates multi-rater columns: {username}_rating, {username}_comment, plus average_rating and rating_count
