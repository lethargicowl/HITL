# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HITL (Human-in-the-Loop) Platform is a web-based system for collecting human ratings on datasets. Requesters create projects and upload CSV/Excel files, assign raters, and export results. Raters evaluate items using configurable evaluation types with optional comments.

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
app/models.py         → SQLAlchemy ORM models + Pydantic schemas
app/database.py       → DB engine and session management
app/dependencies.py   → Auth middleware, role-based access
app/routers/          → API endpoints
  ├── auth.py         → register, login, logout, me
  ├── projects.py     → CRUD, assign/remove raters
  ├── questions.py    → Multi-question CRUD
  ├── uploads.py      → File upload
  ├── ratings.py      → Create/update ratings
  ├── exports.py      → Excel/CSV download
  ├── users.py        → List raters
  └── media.py        → Media file upload/serve
app/services/
  ├── auth_service.py → Password hashing, session management
  ├── excel_parser.py → CSV/Excel parsing
  └── media_service.py → Media storage abstraction
```

### Frontend (Jinja2 + Vanilla JS)
```
templates/
  ├── base.html              → Layout with navigation
  ├── requester/
  │   ├── dashboard.html     → Project list
  │   └── project_detail.html → Project settings, questions, datasets
  ├── rater/
  │   ├── dashboard.html     → Assigned projects
  │   └── project_sessions.html → Sessions to rate
  └── rating.html            → Main evaluation interface
static/
  ├── js/app.js              → All client-side logic
  └── css/styles.css         → Styling
```

### Database Models
- **User**: id, username, password_hash, role (requester/rater)
- **Project**: id, name, description, owner_id, evaluation_type, evaluation_config, instructions, use_multi_questions
- **EvaluationQuestion**: id, project_id, order, key, label, description, question_type, config, required, conditional
- **Session**: id, project_id, name, filename, columns (JSON)
- **DataRow**: id, session_id, row_index, content (JSON)
- **Rating**: id, data_row_id, session_id, rater_id, rating_value, response (JSON), comment, time_spent_ms
- **ProjectAssignment**: project_id, rater_id
- **MediaFile**: id, project_id, filename, original_name, mime_type, size_bytes, storage_path
- **UserSession**: id, user_id, expires_at

### Data Flow
1. Requester creates project → configures evaluation (single or multi-question)
2. Requester uploads CSV/Excel → rows stored as JSON in DataRow
3. Requester assigns raters to project via ProjectAssignment
4. Raters see assigned projects → rate items → stored in Rating.response
5. Requester exports results as Excel/CSV with per-rater columns

## API Structure

| Prefix | Router | Purpose |
|--------|--------|---------|
| /api/auth | auth.py | register, login, logout, me |
| /api/projects | projects.py | CRUD, assign/remove raters |
| /api/projects/{id}/questions | questions.py | Question CRUD, bulk create, reorder |
| /api/projects/{id}/upload | uploads.py | File upload |
| /api/projects/{id}/media | media.py | Media file upload |
| /api/media/{id} | media.py | Serve/delete media files |
| /api/sessions | uploads.py, ratings.py | Session management, get rows |
| /api/ratings | ratings.py | Create/update ratings |
| /api/sessions/{id}/export | exports.py | Excel/CSV download |
| /api/users | users.py | List raters |

## Evaluation Types

### Single Question Mode
Projects can use one evaluation type:

| Type | Description | Config Example |
|------|-------------|----------------|
| `rating` | Numeric scale (default) | `{"min": 1, "max": 5, "labels": {"1": "Poor", "5": "Excellent"}}` |
| `binary` | Two-choice selection | `{"options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]}` |
| `multi_label` | Select multiple labels | `{"options": [...], "min_select": 0, "max_select": null}` |
| `multi_criteria` | Rate on multiple dimensions | `{"criteria": [{"key": "accuracy", "label": "Accuracy", "min": 1, "max": 5}]}` |
| `pairwise` | A vs B comparison | `{"show_confidence": true, "allow_tie": true}` |

### Multi-Question Mode
When `use_multi_questions=true`, projects use the `EvaluationQuestion` table instead. Each question has:
- `key`: Unique identifier (used in exports)
- `label`: Display text
- `question_type`: rating, binary, multi_label, text
- `config`: Type-specific configuration
- `required`: Whether answer is mandatory
- `conditional`: Show only if another question has specific value

Rating responses stored as: `{"question_key": {"value": ...}, ...}`

## Multi-Modal Content

### Supported Media Types
| Type | Formats | Display |
|------|---------|---------|
| Images | PNG, JPG, GIF, WebP, SVG | Inline with zoom lightbox |
| Videos | MP4, WebM + YouTube/Vimeo URLs | Embedded player |
| Audio | MP3, WAV, OGG | Audio player |
| PDFs | PDF files | Embedded viewer + download |

### Content Detection
Data row content automatically detects:
- `media://UUID` - Internal media file reference
- `https://...` URLs - External media/links
- `data:image/...` - Base64 encoded images
- YouTube/Vimeo URLs - Embedded video players

### Media Storage
- Local filesystem: `data/media/{project_id}/{uuid}.ext`
- Upload via: `POST /api/projects/{id}/media`
- Serve via: `GET /api/media/{id}`

## Development Notes

- No test suite currently exists
- No linting configuration present
- Frontend uses Fetch API for all HTTP requests
- File parsing supports CSV (comma-separated, UTF-8) and Excel (.xlsx, .xls)
- Export generates multi-rater columns: {username}_rating, {username}_comment, plus average_rating and rating_count
- Session-based auth with HTTP-only cookies (7-day expiry)
- Password hashing via bcrypt
