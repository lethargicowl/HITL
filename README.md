# HITL Platform

A Human-in-the-Loop platform for collecting and managing human ratings on datasets. Built for AI/ML teams who need quality human evaluations of model outputs, training data, or any content requiring human judgment.

## Features

- **Multi-user Support**: Requesters create projects and upload data; Raters evaluate and provide feedback
- **Multiple Ratings per Item**: Each rater gives independent ratings, enabling inter-rater agreement analysis
- **Project Management**: Organize datasets into projects, assign specific raters
- **Flexible Data Import**: Upload Excel (.xlsx, .xls) or CSV files
- **Rating Interface**: 1-5 star ratings with optional comments, keyboard shortcuts
- **Export Results**: Download ratings as Excel or CSV with per-rater columns and averages

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd HITL
pip install -r requirements.txt

# Start server
python3 -m uvicorn app.main:app --reload --port 8000

# Open in browser
open http://localhost:8000
```

## Usage

### As a Requester
1. Register with role "Requester"
2. Create a new project
3. Upload a dataset (CSV or Excel)
4. Assign raters to your project
5. Monitor progress and export results

### As a Rater
1. Register with role "Rater"
2. Wait to be assigned to a project
3. Open assigned projects from dashboard
4. Rate items using 1-5 stars (keyboard: 1-5)
5. Navigate with arrow keys, save with Enter

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy
- **Frontend**: Jinja2 templates, vanilla JS
- **Auth**: Session-based with bcrypt

## Project Structure

```
HITL/
├── app/
│   ├── main.py           # FastAPI app & routes
│   ├── models.py         # DB models & schemas
│   ├── database.py       # SQLite setup
│   ├── dependencies.py   # Auth middleware
│   ├── routers/          # API endpoints
│   └── services/         # Business logic
├── templates/            # HTML templates
├── static/               # CSS & JS
├── data/                 # SQLite database
└── requirements.txt
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/{id}/upload` | POST | Upload dataset |
| `/api/projects/{id}/assign` | POST | Assign raters |
| `/api/sessions/{id}/rows` | GET | Get rows with ratings |
| `/api/sessions/{id}/export` | GET | Export to Excel/CSV |
| `/api/ratings` | POST | Submit rating |

Full API docs available at `/docs` when server is running.

## License

MIT
