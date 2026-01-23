# HITL Platform - Implementation State

## Current State: UI/UX Polish In Progress

### ✅ Completed: UI/UX Improvements

**Phase**: UI/UX Polish completed

**CSS Improvements** (in `static/css/styles.css`):
- ✅ Toast notification styles
- ✅ Loading spinner styles (`.spinner`, `.btn-loading`)
- ✅ Button loading states
- ✅ Accessibility improvements (focus visible, sr-only, skip link)
- ✅ Mobile responsiveness for pairwise, stars, modals, examples panel
- ✅ Unsaved changes indicator
- ✅ Completion state styles

**JavaScript Improvements** (in `static/js/app.js`):
- ✅ Toast notification system (`showToast()`, `toast.success/error/warning/info`)
- ✅ Loading state helpers (`setButtonLoading()`, `showLoadingOverlay()`)
- ✅ Unsaved changes warning (beforeunload event)
- ✅ Star rating keyboard accessibility (arrow keys, Enter, Home/End)
- ✅ Star rating ARIA attributes (role, aria-checked, aria-label)
- ✅ Comment field tracks unsaved changes
- ✅ Progress completion state with celebration message

**Template Updates**:
- ✅ `templates/base.html` - Added toast container, skip link, main landmark
- ✅ `templates/rating.html` - Added unsaved indicator

---

### What's Built

#### Core Features
- User authentication (register, login, logout, sessions)
- Two roles: Requester and Rater
- Project CRUD with rater assignment
- Dataset upload (CSV, Excel)
- Multiple ratings per row (one per rater)
- Export to Excel/CSV with all ratings

#### Evaluation System
- **Single Question Mode**: rating, binary, multi_label, multi_criteria, pairwise
- **Multi-Question Mode**: Configure multiple questions per project with different types
- **Question Templates**: Quick-add presets (Quality, Safety, Content, Feedback)
- Conditional questions (show based on other answers)
- Question progress tracking

#### Multi-Modal Data Support
- Image display (PNG, JPG, GIF, WebP, SVG) with zoom lightbox
- Video player (MP4, WebM, native HTML5)
- YouTube/Vimeo embedded players
- Audio player (MP3, WAV, OGG)
- PDF viewer with download option
- Automatic content type detection from URLs
- Internal media file storage (`media://` references)

#### Pairwise Comparison
- A vs B preference evaluation for RLHF
- Confidence levels (much/clearly/slightly better)
- Side-by-side display with keyboard shortcuts

#### Annotation Examples
- Create good/bad example annotations for raters
- Examples management UI in project settings
- Slide-out examples panel in rating interface
- Keyboard shortcut 'E' to toggle examples panel
- Support for both single-question and multi-question response formats

### Tech Stack
- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: Jinja2 templates + vanilla JS
- Auth: Session cookies + bcrypt

### File Structure
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
│   │   ├── examples.py      ← NEW
│   │   ├── exports.py
│   │   ├── media.py
│   │   ├── projects.py
│   │   ├── questions.py
│   │   ├── ratings.py
│   │   ├── uploads.py
│   │   └── users.py
│   └── services/
│       ├── auth_service.py
│       ├── excel_parser.py
│       └── media_service.py
├── static/
│   ├── css/styles.css
│   └── js/app.js
├── templates/
│   ├── base.html
│   ├── rating.html
│   ├── auth/
│   ├── rater/
│   └── requester/
└── data/
    ├── hitl.db
    └── media/
```

---

## Completed Tasks

### Phase 2A: Core Data Features

| Task | Status | Description |
|------|--------|-------------|
| 2.1 Evaluation Schema System | ✅ Complete | Configurable evaluation types (rating, binary, multi_label, multi_criteria, pairwise) |
| 2.2 Pairwise Comparison | ✅ Complete | A vs B with confidence levels, keyboard shortcuts |
| 2.3 Multi-Modal Data Support | ✅ Complete | Images, video, audio, PDFs, YouTube/Vimeo embeds |
| 2.4 Multiple Questions Per Item | ✅ Complete | Multi-question mode with UI for adding/editing questions |

### Phase 2B: Quality & Metrics

| Task | Status | Description |
|------|--------|-------------|
| 2.5 Example Annotations | ✅ Complete | Good/bad examples with expected responses, slide-out panel |

---

## Next Priority Tasks

### Phase 2B: Quality & Metrics (Continued)

| Task | Complexity | Impact | Description |
|------|------------|--------|-------------|
| 2.6 Gold Questions | Medium | High | Quality control with known-answer items |
| 2.7 Agreement Metrics | Medium | High | Calculate inter-rater agreement (Kappa, ICC) |
| 2.8 Real-Time Dashboard | Medium | Medium | Progress and quality monitoring |

### Phase 2C: Team & Scale

| Task | Complexity | Impact | Description |
|------|------------|--------|-------------|
| 2.9 Rich Instructions | Low | Medium | Markdown editor with images/videos |
| 2.10 Rater Groups | Medium | High | Expert pools with qualification tests |
| 2.11 Organizations | Medium | Medium | Multi-user team management |
| 2.12 Invitations | Medium | Medium | Invite raters via email/link |

---

## Feature Details

### Task 2.6: Gold Questions / Quality Control (Next Up)

**Goal**: Validate rater quality with known-answer items.

#### Features
- Upload gold items separately or mark in CSV (`is_gold` column)
- Configurable % of gold items shown (e.g., 10%)
- Auto-score when rater submits
- Track rater accuracy over time
- Alert requester if rater accuracy drops below threshold
- Option to pause rater access if quality too low

#### Model
```python
class GoldItem(Base):
    __tablename__ = "gold_items"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    data_row_id = Column(String, ForeignKey("data_rows.id"), nullable=True)
    content = Column(Text, nullable=False)  # JSON: the item content
    expected_response = Column(Text, nullable=False)  # JSON: correct answer
    tolerance = Column(Float, default=0)  # Acceptable deviation for ratings
    created_at = Column(DateTime)

class RaterAccuracy(Base):
    __tablename__ = "rater_accuracy"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    rater_id = Column(String, ForeignKey("users.id"))
    gold_attempts = Column(Integer, default=0)
    gold_correct = Column(Integer, default=0)
    accuracy = Column(Float, default=0)
    last_checked = Column(DateTime)
```

---

### Task 2.10: Rater Groups / Expert Pools

**Goal**: Organize raters into skill-based groups for easy project assignment.

#### Use Cases
- "Medical Experts" group for healthcare annotation
- "Spanish Native Speakers" for translation quality
- "Senior Reviewers" for complex items

#### Features
- Create/manage rater groups
- Qualification tests (mini project with gold questions)
- Minimum accuracy threshold to join/remain
- Assign entire groups to projects with one click

---

## Quick Reference

### Running the App
```bash
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

### Database Location
`data/hitl.db`

### Reset Database
```bash
rm data/hitl.db
# Restart server - new DB auto-created
```

### API Documentation
http://localhost:8000/docs

### Test Data Files
- `test_media_data.csv` - Pairwise comparison with images
- `test_media_mixed.csv` - Mixed media types (images, YouTube, Vimeo)

### New API Endpoints (Task 2.5)
- `GET /api/projects/{id}/examples` - List all examples
- `POST /api/projects/{id}/examples` - Create example
- `GET /api/projects/{id}/examples/{eid}` - Get single example
- `PATCH /api/projects/{id}/examples/{eid}` - Update example
- `DELETE /api/projects/{id}/examples/{eid}` - Delete example
- `POST /api/projects/{id}/examples/bulk` - Create multiple examples
- `POST /api/projects/{id}/examples/reorder` - Reorder examples
