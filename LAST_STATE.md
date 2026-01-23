# HITL Platform - Implementation State

## Current State: Phase 2A Complete

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

---

## Next Priority Tasks

### Phase 2B: Quality & Metrics

| Task | Complexity | Impact | Description |
|------|------------|--------|-------------|
| 2.5 Example Annotations | Medium | High | Show raters example ratings to guide their work |
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

### Task 2.5: Example Annotations (Next Up)

**Goal**: Show raters example ratings to guide their work.

#### Types of Examples
1. **Project-Level Examples**: General examples shown in instructions
2. **Item-Level Examples**: Specific examples shown alongside certain items
3. **Inline Guidance**: Tooltips/hints for specific question types

#### Model
```python
class AnnotationExample(Base):
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
```

#### UI Components
1. Examples Panel (collapsible sidebar)
2. Quick Reference Card (floating)
3. Comparison View (side-by-side)
4. Keyboard Shortcut: Press 'E' to toggle examples

---

### Task 2.6: Gold Questions / Quality Control

**Goal**: Validate rater quality with known-answer items.

#### Features
- Upload gold items separately or mark in CSV
- Configurable % of gold items shown (e.g., 10%)
- Auto-score when rater submits
- Alert requester if rater accuracy drops below threshold
- Option to pause rater access if quality too low

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
