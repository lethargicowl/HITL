# HITL Platform - Implementation State

## Market Research & Competitive Analysis

### Industry Landscape (2024-2025)

Based on research of leading annotation platforms (Label Studio, Labelbox, Scale AI, Prodigy, Amazon SageMaker Ground Truth):

#### Key Competitors

| Platform | Type | Strengths | Pricing |
|----------|------|-----------|---------|
| **Label Studio** | Open-source | Self-hosted, extensible, active community | Free (OSS) / Enterprise paid |
| **Labelbox** | Enterprise SaaS | Workflow automation, model-assisted labeling | Per-seat licensing |
| **Scale AI** | Managed Service | Workforce included, high quality | Per-task pricing |
| **Prodigy** | Desktop Tool | Active learning, fast iteration | One-time license |
| **Amazon Ground Truth** | Cloud Service | AWS integration, auto-labeling | Per-label pricing |

#### Industry-Standard Features

**Must-Have (Table Stakes)**:
- ✅ Multi-modal data (images, video, audio, text)
- ✅ Multiple annotation types (classification, ranking, pairwise)
- ✅ Multi-annotator support with consensus
- ✅ Export to common formats (CSV, JSON, Excel)
- ⚠️ API for programmatic access (partial)
- ❌ Webhooks for event notifications
- ❌ Version control / audit trail

**Differentiators**:
- ✅ RLHF-focused pairwise comparison
- ✅ Multiple questions per item
- ✅ Conditional question logic
- ❌ Active learning / model-in-the-loop
- ❌ Pre-labeling with ML models
- ❌ Real-time collaboration

**Quality Control (Critical Gap)**:
- ✅ Annotation examples
- ❌ Gold/honeypot questions
- ❌ Inter-rater agreement metrics (Kappa, ICC, Krippendorff)
- ❌ Rater performance dashboards
- ❌ Consensus/adjudication workflows

**Enterprise Features**:
- ❌ SSO / SAML authentication
- ❌ Role-based access control (beyond requester/rater)
- ❌ Audit logging
- ❌ Data retention policies
- ❌ Compliance (SOC 2, HIPAA, GDPR)

### RLHF-Specific Requirements

The RLHF training pipeline has specific needs:

1. **Preference Collection**: ✅ Pairwise comparison with confidence
2. **Reward Modeling Data**: ✅ Rating scales for reward signals
3. **Safety Annotation**: ⚠️ Multi-label (needs "severity" dimension)
4. **Constitutional AI**: ❌ Principle-based evaluation templates
5. **Red-teaming**: ❌ Adversarial prompt workflows

---

## Multi-Modal Support: Gap Analysis

### Current Implementation

| Media Type | Status | Features |
|------------|--------|----------|
| **Images** | ✅ Basic | Display, click-to-zoom lightbox |
| **Video** | ✅ Pro | Custom player, frame stepping, speed control, timeline scrubbing |
| **Audio** | ✅ Basic | HTML5 player with controls |
| **YouTube/Vimeo** | ✅ Done | Embedded iframe players |
| **PDF** | ✅ Basic | Viewer with download option |
| **Internal Storage** | ✅ Done | `media://` references, file upload |

### Industry Standards (from research)

Based on analysis of [Encord](https://encord.com/blog/top-multimodal-annotation-tools/), [CVAT](https://www.cvat.ai/), [Label Studio](https://labelstud.io/), and [Supervisely](https://supervisely.com/blog/video-annotation-update-2024/):

#### Video Annotation (Critical Gaps)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Timeline scrubbing | ✅ Done | **P1** | Visual timeline with frame-accurate navigation |
| Frame counter | ✅ Done | **P1** | Show current frame number / total frames |
| Timestamp marking | ❌ Missing | **P1** | Mark specific moments for annotation |
| Playback speed | ✅ Done | **P2** | 0.25x, 0.5x, 1x, 1.5x, 2x controls |
| Frame stepping | ✅ Done | **P2** | Arrow keys for frame-by-frame navigation |
| Video thumbnails | ❌ Missing | **P3** | Preview thumbnails on timeline hover |
| Loop segment | ❌ Missing | **P3** | Loop a specific time range |

#### Audio Annotation (Critical Gaps)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Waveform display | ❌ Missing | **P1** | Visual waveform with click-to-seek |
| Timestamp display | ❌ Missing | **P1** | Current time / total duration |
| Playback speed | ❌ Missing | **P2** | Slow down for detailed listening |
| Region selection | ❌ Missing | **P2** | Select time range for annotation |
| Keyboard shortcuts | ❌ Missing | **P2** | Space=play/pause, arrows=skip |
| Speaker labels | ❌ Missing | **P3** | Visual differentiation of speakers |

#### Image Annotation (Minor Gaps)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Zoom controls | ⚠️ Partial | **P2** | Lightbox exists, add zoom slider |
| Pan/drag | ⚠️ Partial | **P2** | Drag to pan in zoomed view |
| Image comparison | ❌ Missing | **P2** | Side-by-side or slider comparison |
| Metadata display | ❌ Missing | **P3** | Show dimensions, file size |
| Brightness/contrast | ❌ Missing | **P3** | Adjust for visibility |

#### General Media (Gaps)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Fullscreen mode | ✅ Done | **P1** | F key or button for fullscreen |
| Lazy loading | ❌ Missing | **P2** | Load media only when visible |
| Media metadata | ❌ Missing | **P2** | Duration, dimensions, file size |
| Keyboard shortcuts | ✅ Done | **P2** | Consistent across media types |
| Download button | ⚠️ Partial | **P3** | Available for all media types |

### Recommended Implementation Order

**Phase MM-1: Video & Audio Player Enhancements** (High Impact)
1. ✅ Custom video player with timeline, frame counter, speed controls
2. Waveform display for audio (using wavesurfer.js)
3. Consistent keyboard shortcuts (space, arrows, F)
4. Timestamp/region marking capability

**Phase MM-2: Media Comparison** (RLHF Critical)
1. Side-by-side media comparison for pairwise
2. Synchronized playback for A/B video comparison
3. Image slider/overlay comparison

**Phase MM-3: Polish**
1. Fullscreen mode
2. Media metadata display
3. Enhanced zoom/pan for images
4. Lazy loading optimization

### Viability Assessment

**Strengths of HITL Platform**:
- Lightweight, self-hosted (no vendor lock-in)
- RLHF-optimized (pairwise + confidence levels)
- Multi-question flexibility
- Easy setup (SQLite, no complex infrastructure)

**Target Use Cases** (where HITL fits well):
1. Small ML teams doing RLHF preference collection
2. Research labs needing custom annotation interfaces
3. Startups with < 10 raters, < 100K items
4. Privacy-sensitive projects requiring on-premise hosting

**Not Suitable For**:
- Enterprise scale (> 100 raters, millions of items)
- Compliance-heavy industries (healthcare, finance)
- Projects needing managed workforce

### Recommendation: Focus on RLHF Niche

Rather than competing with general-purpose tools like Label Studio, HITL should specialize in **RLHF data collection** where fewer good options exist:

1. **Constitutional AI workflows** - principle-based evaluation
2. **Reward model training data** - structured preference pairs
3. **Safety annotation** - multi-dimensional harm taxonomies
4. **Model comparison** - A/B/n testing of model outputs

---

## Revised Roadmap (Priority Order)

### Phase MM: Multi-Modal Enhancement (User Priority)
*Critical for video/audio annotation workflows*

| Order | Task | Effort | Description | Includes |
|-------|------|--------|-------------|----------|
| 1 | MM.1 Video Player Pro | Medium | ✅ Complete | Keyboard shortcuts, fullscreen, speed control |
| 2 | MM.2 Audio Waveform | Medium | Waveform visualization with wavesurfer.js | Keyboard shortcuts, speed control |
| 3 | MM.5 A/B Media Comparison | Medium | Synchronized playback for pairwise | Shared timeline, sync lock |
| 4 | MM.6 Image Comparison | Low | Slider/overlay comparison mode | For pairwise images |
| — | MM.4 Timestamp Marking | Medium | Mark moments in video/audio | *Deferred* |
| — | MM.7 Media Metadata | Low | Show duration, dimensions | *Deferred* |

**Note**: MM.3 (Keyboard Shortcuts) and MM.8 (Fullscreen) are now integrated into MM.1/MM.2 rather than separate tasks.

### Phase 3: Quality Control (Critical)
*Without quality metrics, collected data may be unreliable*

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| 3.1 Gold Questions | **P0** | Medium | Quality control with known-answer honeypots |
| 3.2 Inter-Rater Agreement | **P0** | Medium | Kappa, ICC, Krippendorff's alpha metrics |
| 3.3 Rater Performance Dashboard | **P1** | Medium | Track accuracy, speed, consistency |
| 3.4 Consensus Workflow | **P2** | High | Resolve disagreements via adjudication |

### Phase 4: RLHF Specialization
*Double down on the niche*

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| 4.1 Safety Taxonomy Templates | **P1** | Low | Pre-built harm categories (OpenAI-style) |
| 4.2 Constitutional AI Mode | **P1** | Medium | Principle-based evaluation interface |
| 4.3 Model A/B/n Testing | **P2** | Medium | Compare 3+ model outputs |
| 4.4 Reward Signal Export | **P2** | Low | Export in RLHF training formats |

### Phase 5: Scale & Reliability
*Production hardening*

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| 5.1 Rate Limiting & CSRF | **P0** | Low | Basic security hardening |
| 5.2 Database Migrations | **P1** | Medium | Alembic for schema changes |
| 5.3 Audit Logging | **P1** | Medium | Track all data changes |
| 5.4 Webhook Events | **P2** | Medium | Notify on completion/quality issues |

### Phase 6: Team Features (Deferred)
*Nice-to-have, not critical for MVP*

| Task | Priority | Effort | Description |
|------|----------|--------|-------------|
| 6.1 Rater Groups | P3 | Medium | Organize raters by skill |
| 6.2 Invitations | P3 | Medium | Email/link-based onboarding |
| 6.3 Organizations | P3 | High | Multi-tenant support |

---

## Current State: UI/UX Polish Complete

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

## Next Priority Tasks (Revised Order)

### Step 1: Video Player Pro (MM.1)
**Status**: ✅ Complete
**Includes**: Timeline, frame counter, speed controls, keyboard shortcuts, fullscreen

This is the foundation - build first before anything else.

### Step 2: Audio Waveform (MM.2)
**Status**: 🔜 Next
**Includes**: wavesurfer.js integration, keyboard shortcuts, speed controls

After video player is done, apply same patterns to audio.

### Step 3: A/B Media Comparison (MM.5)
**Status**: Planned
**Depends on**: MM.1, MM.2

Synchronized playback for pairwise video/audio evaluation. Critical for RLHF.

### Step 4: Quality Control (3.1, 3.2)
**Status**: Planned

Gold questions + inter-rater agreement metrics. Critical for data quality.

### Step 5: Image Comparison (MM.6)
**Status**: Planned

Slider/overlay comparison for pairwise images. Lower priority.

### Deferred Tasks

| Task | Description | Reason |
|------|-------------|--------|
| MM.4 Timestamp Marking | Mark moments for annotation | Nice-to-have, not critical |
| MM.7 Media Metadata | Show duration, dimensions | Polish, low impact |
| 5.1 Security | CSRF, rate limiting | Important but after core features |

---

## Feature Details

### Task MM.1: Video Player Pro (Completed)

**Goal**: Professional video player with precise navigation for annotation tasks.

#### UI Components
```
┌─────────────────────────────────────────────────────┐
│                    VIDEO PLAYER                      │
│                                                      │
│              [Video Content Area]                    │
│                                                      │
├─────────────────────────────────────────────────────┤
│ ◀◀ │ ▶/❚❚ │ ▶▶ │ 0:23.14 / 2:45.00 │ Frame: 557/4125 │
├─────────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────────────────────────┤
│ Speed: [0.5x] [1x] [1.5x] [2x]    │ 🔊 ─────  │ ⛶ │
└─────────────────────────────────────────────────────┘
```

#### Features
- **Timeline bar**: Click anywhere to seek, shows progress
- **Frame counter**: Current frame / total frames
- **Time display**: Current time / total duration (mm:ss.ms)
- **Speed controls**: 0.25x, 0.5x, 1x, 1.5x, 2x buttons
- **Frame stepping**: ← → arrow keys for single frame navigation
- **Fullscreen**: F key or button
- **Volume control**: Slider with mute toggle

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← | Back 1 frame (or 5 sec if Shift) |
| → | Forward 1 frame (or 5 sec if Shift) |
| , | Back 1 frame |
| . | Forward 1 frame |
| [ | Decrease speed |
| ] | Increase speed |
| F | Fullscreen toggle |
| M | Mute toggle |

---

### Task MM.2: Audio Waveform Player

**Goal**: Visual waveform for audio with precise navigation.

#### Implementation
Use **wavesurfer.js** library for waveform rendering.

```html
<script src="https://unpkg.com/wavesurfer.js@7"></script>
```

#### UI Components
```
┌─────────────────────────────────────────────────────┐
│ ▶/❚❚ │ 0:15.23 / 1:30.00 │ Speed: 1x ▼ │ 🔊 ─── │
├─────────────────────────────────────────────────────┤
│                                                      │
│   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄│
│ ▄▄████████████████████▄▄▄██████▄▄▄██████████████▄▄▄│  ← Waveform
│   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│
│                                                      │
│          ▲ cursor position (click to seek)          │
└─────────────────────────────────────────────────────┘
```

#### Features
- **Waveform display**: Visual representation of audio
- **Click-to-seek**: Click anywhere on waveform
- **Hover preview**: Show time at cursor position
- **Playback speed**: 0.5x, 0.75x, 1x, 1.25x, 1.5x
- **Region selection**: Click-drag to select time range (optional)

#### wavesurfer.js Integration
```javascript
const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4a90d9',
    progressColor: '#1a5490',
    cursorColor: '#ff5722',
    height: 80,
    responsive: true,
    backend: 'WebAudio'
});
wavesurfer.load(audioUrl);
```

---

### Task MM.5: A/B Media Comparison

**Goal**: Synchronized playback for pairwise video/audio evaluation.

#### Features
- **Synchronized playback**: Both videos/audios play together
- **Shared timeline**: Single timeline controls both
- **Independent volume**: Adjust A and B separately
- **Lock/unlock sync**: Option to desync for focused review
- **Side labels**: Clear "A" and "B" labels

#### UI Layout (Pairwise Video)
```
┌────────────────────┬────────────────────┐
│      Option A      │      Option B      │
│   [Video Player]   │   [Video Player]   │
└────────────────────┴────────────────────┘
│ ◀◀ │ ▶/❚❚ │ ▶▶ │  🔗 Sync ON  │ 0:23/1:45 │
├─────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────┘
```

---

### Task 3.1: Gold Questions / Quality Control

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

### Task 3.2: Inter-Rater Agreement Metrics

**Goal**: Measure annotation quality through statistical agreement.

#### Metrics to Implement
- **Cohen's Kappa**: For 2 raters, categorical data
- **Fleiss' Kappa**: For 3+ raters, categorical data
- **Krippendorff's Alpha**: For any number of raters, any data type
- **ICC (Intraclass Correlation)**: For numeric ratings

#### Display
- Per-project agreement dashboard
- Per-question agreement breakdown
- Flag low-agreement items for review
- Historical trends over time

---

### Task 4.1: Safety Taxonomy Templates

**Goal**: Pre-built harm categories for AI safety annotation.

#### Template Categories (OpenAI-style)
```json
{
  "categories": [
    {"key": "hate", "label": "Hate Speech", "severity_scale": true},
    {"key": "violence", "label": "Violence/Gore", "severity_scale": true},
    {"key": "sexual", "label": "Sexual Content", "severity_scale": true},
    {"key": "self_harm", "label": "Self-Harm", "severity_scale": true},
    {"key": "harassment", "label": "Harassment", "severity_scale": true},
    {"key": "illegal", "label": "Illegal Activity", "severity_scale": true},
    {"key": "pii", "label": "Personal Information", "severity_scale": false},
    {"key": "misinformation", "label": "Misinformation", "severity_scale": true}
  ],
  "severity_levels": ["none", "mild", "moderate", "severe"]
}
```

#### Features
- One-click template import
- Custom category addition
- Severity scale option per category
- Export in standard safety format

---

### Task 4.2: Constitutional AI Mode

**Goal**: Evaluate responses against stated principles.

#### Interface
- Display the principle being evaluated
- Show model response
- Rate adherence to principle (1-5 or pass/fail)
- Explain reasoning (required)

#### Example Principles
- "The response should be helpful and informative"
- "The response should not encourage harmful activities"
- "The response should acknowledge uncertainty when appropriate"

---

### Task 6.1: Rater Groups / Expert Pools (Deferred)

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
- `test_video_pro.csv` - MP4 video samples for Video Player Pro testing

### New API Endpoints (Task 2.5)
- `GET /api/projects/{id}/examples` - List all examples
- `POST /api/projects/{id}/examples` - Create example
- `GET /api/projects/{id}/examples/{eid}` - Get single example
- `PATCH /api/projects/{id}/examples/{eid}` - Update example
- `DELETE /api/projects/{id}/examples/{eid}` - Delete example
- `POST /api/projects/{id}/examples/bulk` - Create multiple examples
- `POST /api/projects/{id}/examples/reorder` - Reorder examples

---

## Summary: Is HITL Viable?

### Answer: Yes, for the right use case

**HITL fills a gap** in the market for:
- **Lightweight RLHF data collection** - no complex setup, self-hosted
- **Privacy-first annotation** - data stays on your infrastructure
- **Custom evaluation interfaces** - multi-question, conditional logic
- **Small-to-medium scale** - < 10 raters, < 100K items

**HITL is NOT competing with**:
- Label Studio (general-purpose, more features)
- Scale AI (managed workforce, enterprise scale)
- Labelbox (enterprise workflows, ML automation)

### Critical Path to Production

1. **Multi-Modal Enhancement** (MM.1, MM.2) - Video/audio players need professional features
2. **Media Comparison** (MM.5) - Critical for pairwise video/audio RLHF
3. **Quality Control** (3.1, 3.2) - Without this, data quality is unknown
4. **Security** (5.1) - Basic protection before any real use

### Estimated State: ~60% MVP Complete

| Category | Status |
|----------|--------|
| Core annotation | ✅ Complete |
| Multi-modal basic | ✅ Complete |
| Multi-modal pro | ⚠️ Partial (Video done, Audio missing) |
| RLHF pairwise (text) | ✅ Complete |
| RLHF pairwise (video/audio) | ❌ Missing (sync playback) |
| Multi-question | ✅ Complete |
| UI/UX | ✅ Polished |
| Quality control | ❌ Missing (critical) |
| Agreement metrics | ❌ Missing (critical) |
| Security hardening | ❌ Missing |

**Implementation Order**:
1. **MM.1 Video Player Pro** - ✅ Complete
2. **MM.2 Audio Waveform** - wavesurfer.js integration with same keyboard conventions
3. **MM.5 A/B Media Comparison** - Synchronized playback (depends on MM.1, MM.2)
4. **3.1 + 3.2 Quality Control** - Gold questions + agreement metrics
5. **MM.6 Image Comparison** - Slider/overlay for pairwise images