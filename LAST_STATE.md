# HITL Platform - Current Implementation State

## Overview
A Human-in-the-Loop (HITL) platform for uploading datasets and collecting human ratings. Built with FastAPI backend and vanilla JavaScript frontend.

## Tech Stack
- **Backend**: FastAPI (Python 3.9+)
- **Database**: SQLite with SQLAlchemy ORM
- **Frontend**: Jinja2 templates, vanilla JavaScript, CSS
- **Auth**: Session-based with bcrypt password hashing

## Implemented Features

### Authentication System
- User registration with role selection (Requester or Rater)
- Session-based login with secure cookies (7-day expiry)
- Role-based access control (RBAC)
- Logout functionality

### User Roles
1. **Requester**: Creates projects, uploads datasets, assigns raters, views all ratings, exports results
2. **Rater**: Views assigned projects, rates data rows, sees other raters' ratings

### Project Management
- Create/delete projects with name and description
- Assign multiple raters to projects
- Remove raters from projects
- View project statistics (session count, total rows, rated rows)

### Dataset Management
- Upload Excel (.xlsx, .xls) or CSV files
- Automatic column detection
- Session naming (defaults to filename)
- Delete sessions

### Rating System
- **Multiple ratings per row**: Each rater can give their own rating (1-5 stars)
- Comments support for each rating
- View all ratings from other raters on each row
- Filter rows by: All, Rated (by you), Unrated (by you)
- Keyboard shortcuts: 1-5 for rating, arrows for navigation, Enter to save

### Export
- Export to Excel (.xlsx) or CSV
- Includes original data columns
- Separate rating/comment columns for each rater
- Average rating and rating count per row

## File Structure
```
HITL/
├── app/
│   ├── __init__.py
│   ├── database.py          # SQLite setup, session management
│   ├── dependencies.py      # Auth dependencies (get_current_user, etc.)
│   ├── main.py              # FastAPI app, page routes
│   ├── models.py            # SQLAlchemy models + Pydantic schemas
│   ├── routers/
│   │   ├── auth.py          # Register, login, logout, me
│   │   ├── exports.py       # Export session data
│   │   ├── projects.py      # Project CRUD, rater assignment
│   │   ├── ratings.py       # Get rows, create/update ratings
│   │   ├── uploads.py       # File upload, session management
│   │   └── users.py         # List raters
│   └── services/
│       ├── auth_service.py  # Password hashing, session tokens
│       └── excel_parser.py  # Parse Excel/CSV files
├── data/
│   └── hitl.db              # SQLite database
├── static/
│   ├── css/styles.css       # All styles
│   └── js/app.js            # Shared JS functions
├── templates/
│   ├── auth/
│   │   ├── login.html
│   │   └── register.html
│   ├── rater/
│   │   ├── dashboard.html
│   │   └── project_sessions.html
│   ├── requester/
│   │   ├── dashboard.html
│   │   └── project_detail.html
│   ├── base.html            # Base template with nav
│   └── rating.html          # Rating interface
├── requirements.txt
├── PRD.md
└── LAST_STATE.md
```

## Database Schema

### Users
- id, username, password_hash, role, created_at

### UserSession
- id (token), user_id, created_at, expires_at

### Project
- id, name, description, owner_id, created_at

### ProjectAssignment
- id, project_id, rater_id, assigned_at
- Unique constraint: (project_id, rater_id)

### Session (Dataset)
- id, name, filename, columns (JSON), project_id, created_at

### DataRow
- id, session_id, row_index, content (JSON)

### Rating
- id, data_row_id, session_id, rater_id, rating_value, comment, rated_at
- Unique constraint: (data_row_id, rater_id) - one rating per rater per row

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login, get session cookie
- `POST /api/auth/logout` - Logout, clear session
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects (role-filtered)
- `POST /api/projects` - Create project (requester only)
- `GET /api/projects/{id}` - Get project details
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/assign` - Assign raters
- `DELETE /api/projects/{id}/raters/{rater_id}` - Remove rater
- `GET /api/projects/{id}/sessions` - List sessions

### Sessions & Ratings
- `POST /api/projects/{id}/upload` - Upload dataset
- `GET /api/sessions/{id}` - Get session details
- `DELETE /api/sessions/{id}` - Delete session
- `GET /api/sessions/{id}/rows` - Get paginated rows with ratings
- `GET /api/sessions/{id}/export` - Export to Excel/CSV
- `POST /api/ratings` - Create/update rating

### Users
- `GET /api/users/raters` - List all raters (for assignment)

## Running the Application
```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python3 -m uvicorn app.main:app --reload --port 8000

# Access at http://localhost:8000
```

## Known Issues / Future Work
- No password reset functionality
- No email verification
- No pagination on dashboard project lists
- No bulk rating operations
- No inter-rater agreement metrics
- No admin panel
