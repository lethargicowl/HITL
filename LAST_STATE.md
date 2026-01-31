# HITL Platform - Implementation State

## Recent Changes: UI/UX Redesign

### ✅ Completed: Comprehensive UI/UX Overhaul

**Date**: January 2025

The platform now features a modern, polished design system with improved visual hierarchy and user experience.

#### Design System Highlights
- **Color Palette**: Indigo-violet primary colors with teal accent
- **Typography**: Inter font family for clean, modern readability
- **Shadows**: Soft, diffused shadows for depth without harshness
- **Animations**: Smooth transitions, fade-ins, slide-ups, scale animations
- **Gradients**: Subtle gradients for headers and buttons

#### Key UI Improvements
- **Login/Register Pages**: Split layout with branded left panel featuring gradient background
- **Dashboard Pages**: Gradient header banners with stats overview
- **Project Cards**: Visual icons, progress indicators, hover effects
- **Session List**: Icon-based status, improved progress display
- **Rating Page**: Card-based header with gradient progress percentage
- **Examples Panel**: Slide-out panel with polished card design
- **Modals**: Backdrop blur, scale-in animation
- **Toasts**: Clean design with icon backgrounds
- **Buttons**: New gradient variant, improved focus states
- **Inputs**: Rounded corners, subtle focus rings
- **Tabs**: New "pills" variant option

#### Animation & Interaction
- Hover lift effects on cards
- Smooth transitions on all interactive elements
- Loading spinners with gradient colors
- Completion celebrations with glow effects

---

## Previous: React Frontend Migration

### ✅ Completed: Full React Migration

The platform has been fully migrated from Jinja2 templates + vanilla JS to a modern React + TypeScript frontend.

#### What Changed
- **Deleted**: `templates/` folder (Jinja2 templates)
- **Deleted**: `static/` folder (vanilla JS/CSS)
- **Added**: `frontend/` folder (React + TypeScript + Vite)
- **Updated**: `app/main.py` now only serves the React SPA

#### New Tech Stack
- **Vite** - Build tool with hot module replacement
- **React 18** - UI framework with hooks
- **TypeScript** - Type safety throughout
- **React Router v6** - Client-side routing
- **TanStack Query** - Server state management with caching
- **React Context** - Auth and toast state
- **Tailwind CSS** - Utility-first styling with custom design tokens
- **Axios** - HTTP client with credentials

#### UX Improvements
- **Simplified project creation**: Just name + description, no confusing mode selection
- **Unified questions approach**: All projects use questions (add 1 or many as needed)
- **Preview feature**: Requesters can preview dataset items before raters see them
- **Instructions panel**: Collapsible panel during rating
- **Skip button**: Skip items without saving
- **Completion modal**: Celebration when all items rated
- **Other raters' comments**: Now displayed alongside ratings

---

## File Structure

```
HITL/
├── app/
│   ├── __init__.py
│   ├── database.py
│   ├── dependencies.py
│   ├── main.py              → Serves React SPA
│   ├── models.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── examples.py
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
├── frontend/
│   ├── src/
│   │   ├── api/             → Axios API client
│   │   ├── components/
│   │   │   ├── common/      → Button, Modal, Input, Card, Tabs, etc.
│   │   │   ├── layout/      → Header, MainLayout
│   │   │   ├── auth/        → LoginForm, RegisterForm
│   │   │   ├── project/     → ProjectCard, SessionList, QuestionList, etc.
│   │   │   ├── evaluation/  → StarRating, BinaryChoice, MultiLabelSelect, etc.
│   │   │   ├── media/       → ImageViewer, VideoPlayer, AudioPlayer, etc.
│   │   │   └── examples/    → ExamplesPanel
│   │   ├── contexts/        → AuthContext, ToastContext
│   │   ├── hooks/           → React Query hooks
│   │   ├── pages/           → Route components
│   │   ├── types/           → TypeScript interfaces
│   │   └── utils/           → Helper functions
│   ├── dist/                → Production build (served by FastAPI)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── data/
│   ├── hitl.db
│   └── media/
├── CLAUDE.md
├── LAST_STATE.md
└── requirements.txt
```

---

## What's Built

### Core Features
- User authentication (register, login, logout, sessions)
- Two roles: Requester and Rater
- Project CRUD with rater assignment
- Dataset upload (CSV, Excel)
- Multiple ratings per row (one per rater)
- Export to Excel/CSV with all ratings
- Dataset preview for requesters

### Evaluation System
- **Question Types**: rating, binary, multi_label, multi_criteria, pairwise, text
- **Question Templates**: Quick-add presets (Quality Assessment, Safety Review, Feedback Collection)
- **Conditional questions**: Show based on other answers
- **Question progress tracking**
- **Drag-to-reorder questions**

### Multi-Modal Data Support
- Image display (PNG, JPG, GIF, WebP, SVG) with zoom lightbox
- Custom video player with frame stepping, speed control, keyboard shortcuts
- YouTube/Vimeo embedded players
- Audio player (MP3, WAV, OGG)
- PDF viewer with download option
- Automatic content type detection from URLs
- Internal media file storage (`media://` references)

### Pairwise Comparison
- A vs B preference evaluation for RLHF
- Confidence levels (much/clearly/slightly better)
- Side-by-side display with keyboard shortcuts

### Annotation Examples
- Create good/bad example annotations for raters
- Examples management UI in project settings
- Slide-out examples panel in rating interface
- Support for multi-question response formats

### UI/UX Features
- Toast notifications
- Loading states with spinners
- Unsaved changes warning
- Keyboard navigation (arrows, Enter, Ctrl+Enter to save)
- Progress bars with completion celebration
- Mobile responsive design

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Current user |
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/{id}` | GET/PATCH/DELETE | Project CRUD |
| `/api/projects/{id}/assign` | POST | Assign raters |
| `/api/projects/{id}/remove-rater/{rid}` | DELETE | Remove rater |
| `/api/projects/{id}/questions` | GET/POST | List/create questions |
| `/api/projects/{id}/questions/{qid}` | PATCH/DELETE | Update/delete question |
| `/api/projects/{id}/questions/reorder` | POST | Reorder questions |
| `/api/projects/{id}/upload` | POST | Upload dataset |
| `/api/projects/{id}/media` | POST | Upload media file |
| `/api/projects/{id}/examples` | GET/POST | List/create examples |
| `/api/projects/{id}/examples/{eid}` | PATCH/DELETE | Update/delete example |
| `/api/sessions` | GET | List sessions |
| `/api/sessions/{id}` | GET/DELETE | Get/delete session |
| `/api/sessions/{id}/rows` | GET | Get paginated rows |
| `/api/sessions/{id}/export` | GET | Export to Excel/CSV |
| `/api/ratings` | POST | Create/update rating |
| `/api/media/{id}` | GET/DELETE | Serve/delete media |
| `/api/users/raters` | GET | List all raters |

---

## Market Position & Roadmap

### HITL fills a gap for:
- **Lightweight RLHF data collection** - no complex setup, self-hosted
- **Privacy-first annotation** - data stays on your infrastructure
- **Custom evaluation interfaces** - flexible question configuration
- **Small-to-medium scale** - < 10 raters, < 100K items

### Current Status: ~80% MVP Complete (Production Ready)

| Category | Status |
|----------|--------|
| Core annotation | ✅ Complete |
| Multi-modal basic | ✅ Complete |
| Video player pro | ✅ Complete |
| Audio waveform | ❌ Missing |
| RLHF pairwise (text) | ✅ Complete |
| RLHF pairwise (video/audio sync) | ❌ Missing |
| Multi-question | ✅ Complete |
| React frontend | ✅ Complete |
| UI/UX Design System | ✅ Complete |
| Production Config | ✅ Complete |
| Docker Deployment | ✅ Complete |
| Quality control (gold questions) | ❌ Missing |
| Agreement metrics | ❌ Missing |

---

## Next Priority Tasks

### Phase 1: Production Readiness (COMPLETE)
- [x] Environment configuration (.env support via python-dotenv)
- [x] Secure cookie settings (secure flag for HTTPS configurable)
- [x] Environment-based CORS configuration
- [x] Health check endpoint (/health and /api/health)
- [x] Dockerfile for deployment (multi-stage build)
- [x] docker-compose.yml for easy deployment
- [x] Clean up requirements.txt (removed jinja2, added versions)
- [x] .env.example with all configuration options
- [x] .dockerignore for smaller images
- [x] Updated .gitignore

### Phase 2: Audio Enhancement (MM.2)
- Waveform display using wavesurfer.js
- Keyboard shortcuts (space, arrows)
- Playback speed control
- Click-to-seek on waveform

### Phase 3: A/B Media Comparison (MM.5)
- Synchronized playback for pairwise video/audio
- Shared timeline controls
- Critical for RLHF video/audio evaluation

### Phase 4: Quality Control
- **Gold Questions**: Known-answer honeypots for quality validation
- **Inter-Rater Agreement**: Kappa, ICC, Krippendorff's alpha metrics
- **Rater Performance Dashboard**: Track accuracy, speed, consistency

### Phase 5: Security Hardening
- Rate limiting
- Audit logging
- Input validation hardening

---

## Quick Reference

### Running the App (Development)
```bash
# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# Build frontend (required for production)
cd frontend && npm run build

# Run backend (serves React SPA)
python3 -m uvicorn app.main:app --reload --port 8000

# Or run frontend dev server (with hot reload)
cd frontend && npm run dev
```

### Running with Docker (Production)
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env - set SECRET_KEY, COOKIE_SECURE=true for HTTPS, etc.

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Configuration (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | change-me | Session signing key |
| `DEBUG` | false | Enable debug mode |
| `COOKIE_SECURE` | false | Set true for HTTPS |
| `CORS_ORIGINS` | localhost | Comma-separated origins |
| `DATABASE_URL` | sqlite | Database connection string |
| `SESSION_EXPIRE_DAYS` | 7 | Session lifetime |

### Database
- Location: `data/hitl.db`
- Reset: `rm data/hitl.db` then restart server

### Access Points
- Application: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/docs (debug mode only)
- Frontend Dev: http://localhost:3000 (when using npm run dev)

### Test Data Files
- `test_media_data.csv` - Pairwise comparison with images
- `test_media_mixed.csv` - Mixed media types
- `test_video_pro.csv` - MP4 video samples

---

## Video Player Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| , | Previous frame |
| . | Next frame |
| ← | Seek back 5 seconds |
| → | Seek forward 5 seconds |
| J | Seek back 10 seconds |
| L | Seek forward 10 seconds |
| F | Fullscreen toggle |

---

## Question Types Reference

| Type | Description | Config |
|------|-------------|--------|
| `rating` | Star rating scale | `{min, max, labels}` |
| `binary` | Yes/No choice | `{options: [{value, label}]}` |
| `multi_label` | Select multiple | `{options, min_select, max_select}` |
| `multi_criteria` | Rate multiple dimensions | `{criteria: [{key, label, min, max}]}` |
| `pairwise` | A vs B comparison | `{show_confidence, allow_tie}` |
| `text` | Free text input | `{placeholder, max_length}` |
