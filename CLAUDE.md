# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HITL (Human-in-the-Loop) Platform is a web-based system for collecting human ratings on datasets. Requesters create projects and upload CSV/Excel files, assign raters, and export results. Raters evaluate items using configurable evaluation questions with optional comments.

## Commands

### Run Development Server (Backend)
```bash
python3 -m uvicorn app.main:app --reload --port 8000
```

### Run Frontend Dev Server (for development)
```bash
cd frontend && npm run dev
```

### Build Frontend
```bash
cd frontend && npm run build
```

### Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Install Frontend Dependencies
```bash
cd frontend && npm install
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
- Frontend Dev: http://localhost:3000 (when running npm run dev)

## Architecture

### Backend (FastAPI + SQLite)
```
app/main.py           → FastAPI app, serves React SPA
app/models.py         → SQLAlchemy ORM models + Pydantic schemas
app/database.py       → DB engine and session management
app/dependencies.py   → Auth middleware, role-based access
app/routers/          → API endpoints
  ├── auth.py         → register, login, logout, me
  ├── projects.py     → CRUD, assign/remove raters
  ├── questions.py    → Question CRUD
  ├── uploads.py      → File upload
  ├── ratings.py      → Create/update ratings
  ├── exports.py      → Excel/CSV download
  ├── users.py        → List raters
  ├── media.py        → Media file upload/serve
  └── examples.py     → Annotation examples CRUD
app/services/
  ├── auth_service.py → Password hashing, session management
  ├── excel_parser.py → CSV/Excel parsing
  └── media_service.py → Media storage abstraction
```

### Frontend (React + TypeScript + Vite)
```
frontend/
  ├── src/
  │   ├── api/           → Axios API client and endpoints
  │   ├── components/    → Reusable UI components
  │   │   ├── common/    → Button, Modal, Input, Card, etc.
  │   │   ├── layout/    → Header, MainLayout
  │   │   ├── auth/      → LoginForm, RegisterForm
  │   │   ├── project/   → ProjectCard, SessionList, QuestionList, etc.
  │   │   ├── evaluation/→ StarRating, BinaryChoice, MultiLabelSelect, etc.
  │   │   ├── media/     → ImageViewer, VideoPlayer, AudioPlayer, etc.
  │   │   └── examples/  → ExamplesPanel
  │   ├── contexts/      → AuthContext, ToastContext
  │   ├── hooks/         → React Query hooks for data fetching
  │   ├── pages/         → Page components (routes)
  │   ├── types/         → TypeScript interfaces
  │   └── utils/         → Helper functions
  ├── package.json
  ├── vite.config.ts
  └── tailwind.config.js
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
- **AnnotationExample**: id, project_id, title, content, response, explanation, order
- **UserSession**: id, user_id, expires_at

### Data Flow
1. Requester creates project with name/description
2. Requester adds evaluation questions (rating, binary, multi-label, text, etc.)
3. Requester uploads CSV/Excel → rows stored as JSON in DataRow
4. Requester assigns raters to project via ProjectAssignment
5. Raters see assigned projects → rate items → stored in Rating.response
6. Requester exports results as Excel/CSV with per-rater columns

## API Structure

| Prefix | Router | Purpose |
|--------|--------|---------|
| /api/auth | auth.py | register, login, logout, me |
| /api/projects | projects.py | CRUD, assign/remove raters |
| /api/projects/{id}/questions | questions.py | Question CRUD, bulk create, reorder |
| /api/projects/{id}/upload | uploads.py | File upload |
| /api/projects/{id}/media | media.py | Media file upload |
| /api/projects/{id}/examples | examples.py | Annotation examples CRUD |
| /api/media/{id} | media.py | Serve/delete media files |
| /api/sessions | uploads.py, ratings.py | Session management, get rows |
| /api/ratings | ratings.py | Create/update ratings |
| /api/sessions/{id}/export | exports.py | Excel/CSV download |
| /api/users | users.py | List raters |

## Evaluation Questions

Projects use the `EvaluationQuestion` table for evaluation configuration. Each question has:
- `key`: Unique identifier (used in exports)
- `label`: Display text
- `question_type`: rating, binary, multi_label, text, multi_criteria, pairwise
- `config`: Type-specific configuration
- `required`: Whether answer is mandatory
- `conditional`: Show only if another question has specific value

### Question Types
| Type | Description | Config Example |
|------|-------------|----------------|
| `rating` | Numeric scale | `{"min": 1, "max": 5, "labels": {"1": "Poor", "5": "Excellent"}}` |
| `binary` | Two-choice selection | `{"options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]}` |
| `multi_label` | Select multiple labels | `{"options": [...], "min_select": 0, "max_select": null}` |
| `multi_criteria` | Rate on multiple dimensions | `{"criteria": [{"key": "accuracy", "label": "Accuracy", "min": 1, "max": 5}]}` |
| `pairwise` | A vs B comparison | `{"show_confidence": true, "allow_tie": true}` |
| `text` | Free text input | `{"placeholder": "Enter your feedback...", "max_length": 1000}` |

Rating responses stored as: `{"question_key": {"value": ...}, ...}`

## Multi-Modal Content

### Supported Media Types
| Type | Formats | Display |
|------|---------|---------|
| Images | PNG, JPG, GIF, WebP, SVG | Inline with zoom lightbox |
| Videos | MP4, WebM + YouTube/Vimeo URLs | Custom player with frame stepping |
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

## Frontend Tech Stack

- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router v6** - Client-side routing
- **TanStack Query** - Server state management
- **React Context** - Auth and toast state
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Production Deployment

### Using Docker (Recommended)
```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t hitl .
docker run -p 8000:8000 -v hitl-data:/app/data hitl
```

### Configuration
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your settings
```

Key production settings:
- `SECRET_KEY`: Set a strong random string
- `COOKIE_SECURE=true`: Enable for HTTPS
- `DEBUG=false`: Disable in production
- `CORS_ORIGINS`: Set to your domain(s)

### Health Check
- `/health` - Basic health check
- `/api/health` - API health check

## Development Notes

- No test suite currently exists
- Frontend uses React Query for caching and data synchronization
- File parsing supports CSV (comma-separated, UTF-8) and Excel (.xlsx, .xls)
- Export generates multi-rater columns: {username}_response, {username}_comment
- Session-based auth with HTTP-only cookies (configurable expiry)
- Password hashing via bcrypt
- Video player supports keyboard shortcuts (space, comma, period for frame stepping)
- Environment configuration via `.env` file (python-dotenv)
