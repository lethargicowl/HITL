# HITL Platform - Implementation State

## Current State: Phase 1 Complete ✅

### What's Built
- User authentication (register, login, logout, sessions)
- Two roles: Requester and Rater
- Project CRUD with rater assignment
- Dataset upload (CSV, Excel)
- 1-5 star rating with comments
- Multiple ratings per row (one per rater)
- Export to Excel/CSV with all ratings

### Tech Stack
- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: Jinja2 templates + vanilla JS
- Auth: Session cookies + bcrypt

### Current File Structure
```
HITL/
├── app/
│   ├── __init__.py
│   ├── database.py
│   ├── dependencies.py
│   ├── main.py
│   ├── models.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── exports.py
│   │   ├── projects.py
│   │   ├── ratings.py
│   │   ├── uploads.py
│   │   └── users.py
│   └── services/
│       ├── auth_service.py
│       └── excel_parser.py
├── static/{css,js}/
├── templates/
└── data/hitl.db
```

---

## Phase 2: Implementation Tasks

### Task 2.1: Evaluation Schema System ✅ COMPLETE

**Goal**: Replace fixed 1-5 stars with configurable evaluation types.

**Implemented**:
- Added `evaluation_type`, `evaluation_config`, `instructions` fields to Project model
- Added flexible `response` JSON field to Rating model (keeps `rating_value` for backward compatibility)
- Created dynamic evaluation forms in frontend (rating, binary, multi_label, multi_criteria)
- Updated exports to handle different evaluation types
- Added PATCH endpoint for updating project evaluation settings

#### Models to Add (`models.py`)
```python
class EvaluationType(str, Enum):
    RATING = "rating"
    BINARY = "binary"
    MULTI_LABEL = "multi_label"
    PAIRWISE = "pairwise"
    MULTI_CRITERIA = "multi_criteria"

class EvaluationSchema(Base):
    __tablename__ = "evaluation_schemas"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # EvaluationType
    config = Column(Text, nullable=False)  # JSON config
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Project Model Changes
```python
class Project(Base):
    # Add these fields:
    evaluation_type = Column(String, default="rating")
    evaluation_config = Column(Text, nullable=True)  # JSON
    instructions = Column(Text, nullable=True)
```

#### Evaluation Model Changes (rename Rating → Evaluation)
```python
class Evaluation(Base):  # Was: Rating
    __tablename__ = "evaluations"
    # Change rating_value to flexible response:
    response = Column(Text, nullable=False)  # JSON
    time_spent_ms = Column(Integer, nullable=True)
```

#### Config Examples
```python
# Rating (1-10 scale)
{"type": "rating", "min": 1, "max": 10, "labels": {"1": "Terrible", "10": "Perfect"}}

# Binary
{"type": "binary", "options": [
    {"value": "yes", "label": "Yes"},
    {"value": "no", "label": "No"}
]}

# Multi-label
{"type": "multi_label", "options": [
    {"value": "accurate", "label": "Factually Accurate"},
    {"value": "helpful", "label": "Helpful"},
    {"value": "safe", "label": "Safe"}
], "min_select": 0, "max_select": null}

# Multi-criteria
{"type": "multi_criteria", "criteria": [
    {"key": "accuracy", "label": "Accuracy", "min": 1, "max": 5},
    {"key": "helpfulness", "label": "Helpfulness", "min": 1, "max": 5}
]}
```

#### Files to Create
- `app/routers/schemas.py` - Schema CRUD endpoints
- `templates/components/eval_*.html` - Evaluation type components

#### Files to Modify
- `app/models.py` - Add new models
- `app/routers/projects.py` - Include schema in project creation
- `app/routers/ratings.py` - Accept flexible response format
- `templates/requester/project_detail.html` - Schema selector
- `templates/rating.html` - Dynamic evaluation form
- `static/js/app.js` - Render different eval types

---

### Task 2.2: Pairwise Comparison ⭐ START HERE

**Goal**: A vs B preference evaluation for RLHF.

#### Model Changes
```python
class ComparisonPair(Base):
    __tablename__ = "comparison_pairs"
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    item_a_id = Column(String, ForeignKey("data_rows.id"))
    item_b_id = Column(String, ForeignKey("data_rows.id"))
    # Response stored in Evaluation table
```

#### Upload Format
```csv
prompt,response_a,response_b
"What is 2+2?","The answer is 4","2+2=4"
```

#### UI Requirements
- Side-by-side display
- Buttons: "A is better", "B is better", "Tie"
- Optional: "A is much better" / "B is much better"

#### Response Format
```json
{"winner": "a", "confidence": "much_better"}
```

---

### Task 2.3: Gold Questions

**Goal**: Validate rater quality with known-answer items.

#### Model Changes
```python
class DataRow(Base):
    # Add:
    is_gold = Column(Boolean, default=False)
    gold_answer = Column(Text, nullable=True)  # Expected response JSON

class RaterPerformance(Base):
    __tablename__ = "rater_performance"
    id = Column(String, primary_key=True)
    rater_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, ForeignKey("sessions.id"))
    gold_correct = Column(Integer, default=0)
    gold_total = Column(Integer, default=0)
    updated_at = Column(DateTime)
```

#### Implementation
1. Upload gold items separately or mark in CSV
2. Mix gold items into queue (configurable %)
3. Auto-score when rater submits
4. Track accuracy per rater per session

---

### Task 2.4: Inter-Rater Agreement Metrics

**Goal**: Calculate agreement scores.

#### New Service (`services/metrics.py`)
```python
def percent_agreement(evaluations: List[Evaluation]) -> float:
    """Simple % of matching responses."""

def cohens_kappa(rater_a: List, rater_b: List) -> float:
    """Cohen's Kappa for 2 raters."""

def fleiss_kappa(matrix: List[List]) -> float:
    """Fleiss' Kappa for N raters."""

def krippendorffs_alpha(matrix: List[List]) -> float:
    """Krippendorff's Alpha - works with missing data."""
```

#### API Endpoint
```
GET /api/sessions/{id}/metrics
Response: {
    "agreement_percent": 0.85,
    "cohens_kappa": 0.72,
    "fleiss_kappa": 0.68,
    "items_with_disagreement": 15
}
```

---

### Task 2.5: Real-Time Dashboard

**Goal**: Progress and quality monitoring.

#### New Endpoint
```
GET /api/projects/{id}/dashboard
Response: {
    "progress": {
        "total_items": 500,
        "completed": 350,
        "percent": 70
    },
    "quality": {
        "agreement_score": 0.82,
        "gold_accuracy": 0.91
    },
    "raters": [
        {"id": "...", "username": "alice", "completed": 120, "accuracy": 0.95},
        {"id": "...", "username": "bob", "completed": 80, "accuracy": 0.88}
    ],
    "distribution": {
        "1": 10, "2": 25, "3": 100, "4": 150, "5": 65
    }
}
```

#### New Template
`templates/requester/project_dashboard.html`

---

### Task 2.6: Instructions Editor

**Goal**: Rich guidelines for raters.

#### Model Changes
```python
class Project(Base):
    instructions = Column(Text)  # Markdown
    examples = Column(Text)  # JSON array
```

#### Example Format
```json
[
    {
        "input": "What is the capital of France?",
        "good_response": "Paris",
        "bad_response": "London",
        "explanation": "Paris is the correct capital..."
    }
]
```

#### UI
- Markdown editor in project settings
- Example builder (input + good/bad responses)
- Preview panel
- Shown in rating interface (collapsible)

---

### Task 2.7: Organizations

**Goal**: Team management.

#### New Models
```python
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime)

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id = Column(String, primary_key=True)
    org_id = Column(String, ForeignKey("organizations.id"))
    user_id = Column(String, ForeignKey("users.id"))
    role = Column(String)  # "admin", "member"
```

#### User Model Changes
```python
class User(Base):
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
```

#### Project Model Changes
```python
class Project(Base):
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    # owner_id still exists for personal projects
```

---

### Task 2.8: Invitation System

**Goal**: Invite raters via link.

#### New Model
```python
class Invitation(Base):
    __tablename__ = "invitations"
    id = Column(String, primary_key=True)
    token = Column(String, unique=True)
    email = Column(String, nullable=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    role = Column(String)  # "rater"
    expires_at = Column(DateTime)
    used_at = Column(DateTime, nullable=True)
```

#### Flow
1. `POST /api/invitations` - Create invite, get link
2. Rater visits `/invite/{token}`
3. If not logged in → register page
4. Auto-assign to org/project on completion

---

## Implementation Order

| # | Task | Complexity | Dependencies |
|---|------|------------|--------------|
| 1 | Evaluation Schema System | High | None |
| 2 | Multi-Criteria Evaluation | Medium | Task 1 |
| 3 | Binary Classification | Low | Task 1 |
| 4 | Multi-Label Classification | Low | Task 1 |
| 5 | Pairwise Comparison | High | Task 1 |
| 6 | Gold Questions | Medium | None |
| 7 | Agreement Metrics | Medium | Task 6 |
| 8 | Dashboard | Medium | Task 7 |
| 9 | Instructions Editor | Low | None |
| 10 | Organizations | Medium | None |
| 11 | Invitations | Medium | Task 10 |

---

## Quick Reference

### Running the App
```bash
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

### Current DB Location
`data/hitl.db`

### Delete DB to Reset
```bash
rm data/hitl.db
# Restart server - new DB auto-created
```
