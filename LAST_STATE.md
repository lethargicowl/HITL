# HITL Platform - Implementation State

## Current State: Phase 2 In Progress

### What's Built ✅
- User authentication (register, login, logout, sessions)
- Two roles: Requester and Rater
- Project CRUD with rater assignment
- Dataset upload (CSV, Excel)
- Flexible evaluation types: rating, binary, multi_label, multi_criteria, pairwise
- Multiple ratings per row (one per rater)
- Export to Excel/CSV with all ratings
- Pairwise A/B comparison with confidence levels

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

## Phase 2: Core Features for Production

### ✅ COMPLETED

#### Task 2.1: Evaluation Schema System
- Configurable evaluation types (rating, binary, multi_label, multi_criteria)
- Flexible JSON response storage
- Dynamic frontend forms

#### Task 2.2: Pairwise Comparison
- A vs B preference evaluation for RLHF
- Confidence levels (much/clearly/slightly better)
- Side-by-side display with keyboard shortcuts

---

### 🎯 PRIORITY FEATURES (New)

### Task 2.3: Multi-Modal Data Support ⭐ HIGH PRIORITY

**Goal**: Support images, videos, audio, PDFs, and rich content types.

#### Content Types to Support
| Type | Format | Display |
|------|--------|---------|
| Text | Plain text, Markdown | Rendered with formatting |
| Image | PNG, JPG, GIF, WebP, SVG | Inline display, zoom on click |
| Video | MP4, WebM, YouTube/Vimeo URLs | Embedded player |
| Audio | MP3, WAV, OGG | Embedded player |
| PDF | PDF files | Embedded viewer or download |
| Code | Any language | Syntax highlighted |
| HTML | Rich HTML | Sandboxed iframe render |
| URL | Web links | Clickable, optional preview |

#### Model Changes
```python
class MediaFile(Base):
    __tablename__ = "media_files"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)  # Local path or S3 key
    created_at = Column(DateTime, default=datetime.utcnow)

class DataRow(Base):
    # Existing fields...
    # content field now supports media references:
    # {"text": "...", "image": "media://abc123", "video": "https://..."}
```

#### Content Field Format
```json
{
  "prompt": "Describe this image",
  "image": "media://abc123-def456",
  "context": "This is a medical scan",
  "response_a": "The image shows...",
  "response_b": "I can see..."
}
```

#### Upload Methods
1. **CSV/Excel with URLs**: Reference external media via URLs
2. **CSV/Excel with embedded**: Base64 encoded (small files only)
3. **ZIP upload**: CSV + media folder, auto-linked by filename
4. **Drag-and-drop**: Upload media files separately, reference in data

#### Storage Options
- Local filesystem (default, `data/media/`)
- S3-compatible storage (configurable)

#### Files to Create
- `app/routers/media.py` - Media upload/serve endpoints
- `app/services/media_service.py` - Storage abstraction
- `static/js/media-viewer.js` - Client-side media rendering

#### Files to Modify
- `app/models.py` - Add MediaFile model
- `static/js/app.js` - Render media in rating interface
- `static/css/styles.css` - Media display styles

---

### Task 2.4: Multiple Questions Per Item ⭐ HIGH PRIORITY

**Goal**: Ask multiple evaluation questions for each data item.

#### Use Cases
- Rate both "accuracy" AND "helpfulness" as separate questions
- Binary "Is this safe?" + Rating "Quality 1-5" + Multi-label "Categories"
- Different question types for different aspects of the same content

#### Model Changes
```python
class EvaluationQuestion(Base):
    """Individual question within a project's evaluation schema."""
    __tablename__ = "evaluation_questions"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    order = Column(Integer, default=0)  # Display order
    key = Column(String, nullable=False)  # Unique key within project
    label = Column(String, nullable=False)  # Display label
    description = Column(Text, nullable=True)  # Help text
    question_type = Column(String, nullable=False)  # rating, binary, multi_label, etc.
    config = Column(Text, nullable=False)  # JSON config for this question
    required = Column(Boolean, default=True)
    conditional = Column(Text, nullable=True)  # JSON: show only if other question answered X

class Rating(Base):
    # Change response structure:
    # Old: {"value": 5}
    # New: {"accuracy": {"value": 4}, "helpfulness": {"value": 5}, "safe": {"value": true}}
    response = Column(Text, nullable=False)  # JSON with all question responses
```

#### Question Configuration Example
```json
{
  "questions": [
    {
      "key": "overall_quality",
      "label": "Overall Quality",
      "type": "rating",
      "config": {"min": 1, "max": 5},
      "required": true
    },
    {
      "key": "is_safe",
      "label": "Is this response safe?",
      "type": "binary",
      "config": {"options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]},
      "required": true
    },
    {
      "key": "issues",
      "label": "Select any issues (if unsafe)",
      "type": "multi_label",
      "config": {"options": [{"value": "harmful", "label": "Harmful"}, {"value": "biased", "label": "Biased"}]},
      "required": false,
      "conditional": {"question": "is_safe", "equals": "no"}
    }
  ]
}
```

#### UI Changes
- Vertical stack of question forms
- Progress indicator showing which questions answered
- Conditional questions show/hide dynamically
- "Complete" button only enabled when all required answered

#### Files to Create
- `app/routers/questions.py` - Question CRUD endpoints
- `templates/components/question_form.html` - Reusable question component

#### Files to Modify
- `app/models.py` - Add EvaluationQuestion model
- `app/routers/projects.py` - Include questions in project
- `static/js/app.js` - Multi-question form rendering
- `templates/requester/project_detail.html` - Question builder UI

---

### Task 2.5: Example Annotations / Reference Ratings ⭐ HIGH PRIORITY

**Goal**: Show raters example ratings to guide their work.

#### Types of Examples
1. **Project-Level Examples**: General examples shown in instructions
2. **Item-Level Examples**: Specific examples shown alongside certain items
3. **Inline Guidance**: Tooltips/hints for specific question types

#### Model Changes
```python
class AnnotationExample(Base):
    """Example annotation to guide raters."""
    __tablename__ = "annotation_examples"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    question_id = Column(String, ForeignKey("evaluation_questions.id"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # JSON: the example data item
    example_response = Column(Text, nullable=False)  # JSON: the correct/expected response
    explanation = Column(Text, nullable=True)  # Why this is correct
    is_positive = Column(Boolean, default=True)  # Good example vs bad example
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Example Format
```json
{
  "title": "High Quality Response",
  "content": {
    "prompt": "Explain photosynthesis",
    "response": "Photosynthesis is the process by which plants convert sunlight..."
  },
  "example_response": {
    "overall_quality": {"value": 5},
    "is_accurate": {"value": "yes"},
    "categories": {"selected": ["educational", "complete"]}
  },
  "explanation": "This response is rated 5 because it accurately explains the concept with clear language...",
  "is_positive": true
}
```

#### UI Components
1. **Examples Panel**: Collapsible sidebar showing all examples
2. **Quick Reference Card**: Floating card with key examples
3. **Comparison View**: Side-by-side current item vs example
4. **Keyboard Shortcut**: Press 'E' to toggle examples panel

#### Files to Create
- `app/routers/examples.py` - Example CRUD endpoints
- `templates/components/examples_panel.html` - Examples sidebar
- `static/js/examples.js` - Examples interaction

#### Files to Modify
- `app/models.py` - Add AnnotationExample model
- `templates/rating.html` - Add examples panel
- `templates/requester/project_detail.html` - Example builder

---

### Task 2.6: Gold Questions / Quality Control

**Goal**: Validate rater quality with known-answer items.

#### Model Changes
```python
class DataRow(Base):
    # Add:
    is_gold = Column(Boolean, default=False)
    gold_response = Column(Text, nullable=True)  # Expected response JSON
    gold_tolerance = Column(Text, nullable=True)  # JSON: acceptable variance

class RaterPerformance(Base):
    __tablename__ = "rater_performance"
    id = Column(String, primary_key=True)
    rater_id = Column(String, ForeignKey("users.id"))
    project_id = Column(String, ForeignKey("projects.id"))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=True)
    gold_correct = Column(Integer, default=0)
    gold_total = Column(Integer, default=0)
    agreement_score = Column(Float, nullable=True)
    last_evaluated_at = Column(DateTime)
```

#### Gold Question Matching
```json
{
  "gold_response": {"overall_quality": {"value": 4}},
  "gold_tolerance": {
    "overall_quality": {"min": 3, "max": 5}  // Accept 3-5 as correct
  }
}
```

#### Features
- Upload gold items separately or mark in CSV
- Configurable % of gold items shown (e.g., 10%)
- Auto-score when rater submits
- Alert requester if rater accuracy drops below threshold
- Option to pause rater access if quality too low

---

### Task 2.7: Inter-Rater Agreement Metrics

**Goal**: Calculate and display agreement scores.

#### Metrics to Calculate
```python
# services/metrics.py
def percent_agreement(responses: List) -> float:
    """Simple % of matching responses."""

def cohens_kappa(rater_a: List, rater_b: List) -> float:
    """Cohen's Kappa for 2 raters (categorical)."""

def fleiss_kappa(matrix: List[List]) -> float:
    """Fleiss' Kappa for N raters (categorical)."""

def krippendorffs_alpha(matrix: List[List], level: str) -> float:
    """Krippendorff's Alpha - works with missing data.
    level: 'nominal', 'ordinal', 'interval', 'ratio'"""

def intraclass_correlation(ratings: List[List]) -> float:
    """ICC for continuous ratings."""
```

#### API Endpoint
```
GET /api/projects/{id}/metrics
GET /api/sessions/{id}/metrics
Response: {
    "overall": {
        "percent_agreement": 0.85,
        "fleiss_kappa": 0.72,
        "krippendorffs_alpha": 0.75
    },
    "by_question": {
        "overall_quality": {"percent_agreement": 0.82, "icc": 0.78},
        "is_safe": {"percent_agreement": 0.95, "cohens_kappa": 0.88}
    },
    "disagreement_items": [
        {"row_id": "...", "variance": 2.5, "responses": [...]}
    ]
}
```

---

### Task 2.8: Real-Time Dashboard

**Goal**: Progress and quality monitoring for requesters.

#### Dashboard Components
1. **Progress Overview**: Total items, completed, by rater
2. **Quality Metrics**: Agreement scores, gold accuracy
3. **Rater Leaderboard**: Performance comparison
4. **Distribution Charts**: Response distribution per question
5. **Flagged Items**: Items with high disagreement

#### New Endpoint
```
GET /api/projects/{id}/dashboard
Response: {
    "progress": {
        "total_items": 500,
        "completed": 350,
        "percent": 70,
        "by_session": [...]
    },
    "quality": {
        "overall_agreement": 0.82,
        "gold_accuracy": 0.91,
        "flagged_count": 12
    },
    "raters": [
        {
            "id": "...",
            "username": "alice",
            "completed": 120,
            "gold_accuracy": 0.95,
            "agreement_score": 0.88,
            "avg_time_per_item": 45
        }
    ],
    "distributions": {
        "overall_quality": {"1": 10, "2": 25, "3": 100, "4": 150, "5": 65}
    }
}
```

---

### Task 2.9: Rich Instructions Editor

**Goal**: Comprehensive guidelines with examples.

#### Features
- Markdown editor with preview
- Embed images/videos in instructions
- Code blocks with syntax highlighting
- Structured example builder
- Version history for instructions

---

### Task 2.10: Rater Groups / Expert Pools ⭐ HIGH PRIORITY

**Goal**: Organize raters into skill-based groups for easy project assignment.

#### Use Cases
- "Medical Experts" group for healthcare annotation projects
- "Spanish Native Speakers" for translation quality tasks
- "Senior Reviewers" for complex or high-stakes items
- "Onboarding Pool" for new raters still being evaluated

#### Models
```python
class RaterGroup(Base):
    """A group of raters with specific expertise."""
    __tablename__ = "rater_groups"
    id = Column(String, primary_key=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)  # URL-friendly identifier
    description = Column(Text, nullable=True)
    expertise_tags = Column(Text, nullable=True)  # JSON array: ["medical", "radiology"]
    qualification_required = Column(Boolean, default=False)
    qualification_test_id = Column(String, nullable=True)  # Link to a test project
    min_gold_accuracy = Column(Float, nullable=True)  # e.g., 0.85 = 85% required
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id"))

class RaterGroupMember(Base):
    """Membership of a rater in a group."""
    __tablename__ = "rater_group_members"
    id = Column(String, primary_key=True)
    group_id = Column(String, ForeignKey("rater_groups.id"))
    rater_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="active")  # active, suspended, pending_qualification
    joined_at = Column(DateTime, default=datetime.utcnow)
    added_by = Column(String, ForeignKey("users.id"))
    notes = Column(Text, nullable=True)  # Admin notes about this rater

class ProjectGroupAssignment(Base):
    """Assign a rater group to a project."""
    __tablename__ = "project_group_assignments"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    group_id = Column(String, ForeignKey("rater_groups.id"))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(String, ForeignKey("users.id"))
    max_raters = Column(Integer, nullable=True)  # Limit how many from group can access
    priority = Column(Integer, default=0)  # Higher = shown first to group members
```

#### Features
1. **Group Management**
   - Create/edit/delete rater groups
   - Add/remove raters from groups
   - Set expertise tags for searchability
   - View group statistics (size, avg accuracy, activity)

2. **Qualification System**
   - Optional qualification test (a mini project with gold questions)
   - Minimum accuracy threshold to join/remain in group
   - Auto-suspend raters who fall below threshold
   - Re-qualification workflow

3. **Project Assignment**
   - Assign entire groups to projects (one click)
   - Set max raters from a group (e.g., "need 5 from Medical Experts")
   - Priority ordering when multiple groups assigned
   - Raters see projects their groups are assigned to

4. **Rater View**
   - See which groups they belong to
   - See available projects from their groups
   - Track their qualification status

#### API Endpoints
```
# Group CRUD
POST   /api/rater-groups
GET    /api/rater-groups
GET    /api/rater-groups/{id}
PATCH  /api/rater-groups/{id}
DELETE /api/rater-groups/{id}

# Group Membership
POST   /api/rater-groups/{id}/members
DELETE /api/rater-groups/{id}/members/{rater_id}
GET    /api/rater-groups/{id}/members

# Project Assignment
POST   /api/projects/{id}/assign-group
DELETE /api/projects/{id}/groups/{group_id}
GET    /api/projects/{id}/groups

# Rater's groups
GET    /api/me/groups
GET    /api/me/available-projects  # Projects from all my groups
```

#### UI Components
1. **Groups Management Page** (for requesters/admins)
   - List all groups with member counts
   - Create new group modal
   - Group detail page with member list

2. **Project Assignment** (enhanced)
   - Tab: "Individual Raters" vs "Rater Groups"
   - Search/filter groups by expertise tags
   - Show group stats before assigning

3. **Rater Dashboard** (enhanced)
   - "My Groups" section
   - Projects organized by group
   - Qualification status badges

#### Files to Create
- `app/routers/rater_groups.py` - Group CRUD and membership
- `templates/requester/groups.html` - Groups management page
- `templates/requester/group_detail.html` - Single group view
- `templates/components/group_selector.html` - Reusable group picker

#### Files to Modify
- `app/models.py` - Add group models
- `app/routers/projects.py` - Add group assignment endpoints
- `templates/requester/project_detail.html` - Add group assignment UI
- `templates/rater/dashboard.html` - Show groups and grouped projects

---

### Task 2.11: Organizations & Teams

**Goal**: Multi-user team management.

#### Models
```python
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True)
    plan = Column(String, default="free")  # free, pro, enterprise
    created_at = Column(DateTime)

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id = Column(String, primary_key=True)
    org_id = Column(String, ForeignKey("organizations.id"))
    user_id = Column(String, ForeignKey("users.id"))
    role = Column(String)  # owner, admin, member, rater
    invited_by = Column(String, ForeignKey("users.id"))
    joined_at = Column(DateTime)
```

---

### Task 2.12: Invitation & Access Control

**Goal**: Invite raters via email/link.

#### Flow
1. Requester creates invite (email or link)
2. Invite specifies: org, project(s), role, expiry
3. Recipient clicks link → register/login → auto-assigned
4. Optional: Single-use vs multi-use links

---

## Implementation Priority

### Phase 2A: Core Data Features (Do First)
| # | Task | Complexity | Impact |
|---|------|------------|--------|
| 1 | Multi-Modal Data Support | High | Critical - enables images/video |
| 2 | Multiple Questions Per Item | High | Critical - flexible evaluation |
| 3 | Example Annotations | Medium | High - improves rater quality |

### Phase 2B: Quality & Metrics
| # | Task | Complexity | Impact |
|---|------|------------|--------|
| 4 | Gold Questions | Medium | High - quality control |
| 5 | Agreement Metrics | Medium | High - data quality insights |
| 6 | Real-Time Dashboard | Medium | Medium - monitoring |

### Phase 2C: Team & Scale
| # | Task | Complexity | Impact |
|---|------|------------|--------|
| 7 | **Rater Groups / Expert Pools** | Medium | **High - scalable rater management** |
| 8 | Rich Instructions | Low | Medium - better guidance |
| 9 | Organizations | Medium | Medium - team support |
| 10 | Invitations | Medium | Medium - onboarding |

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

### API Documentation
http://localhost:8000/docs
