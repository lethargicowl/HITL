# Human-in-the-Loop (HITL) Platform

## Product Requirements Document

---

## 1. Product Overview

A platform to support human-in-the-loop (HITL) components of machine learning and AI workflows. It serves as an end-to-end solution where clients can:
- Upload datasets (AI-generated outputs, complex data requiring human judgment)
- Onboard qualified raters to evaluate, annotate, or label content
- Export human ratings for analysis or integration

**Primary Use Case**: Enabling robust human evaluations for complex agent workflows—reviewing AI decisions, validating outputs, and providing qualitative feedback that automated systems cannot reliably achieve.

---

## 2. Goals & Objectives

### Short-Term Goals
- Deliver an intuitive platform for dataset upload, rater management, task assignment, and rating export
- Enable flexible workflows where any qualified user can act as a rater
- Support data ingestion from common tools (ChatGPT Agents, Hugging Face datasets)

### Long-Term Goals
- Build a large, credentialed global community of raters with tracked expertise and performance
- Enable dynamic creation of specialized rater pools (automatic or manual matching)
- Establish platform reputation for quality, trust, and reliable human judgment at scale

---

## 3. User Roles

### Requester (Client)
- Creates and manages projects
- Uploads datasets for evaluation
- Assigns raters to projects
- Views all ratings and progress
- Exports results for analysis

### Rater (Evaluator)
- Views assigned projects
- Rates data rows according to criteria
- Provides comments/feedback
- Sees other raters' evaluations (for calibration)

---

## 4. Core Features

### 4.1 Authentication & Authorization
- User registration with role selection
- Secure login with session management
- Role-based access control (RBAC)

### 4.2 Project Management
- Create projects with name and description
- Assign/remove raters from projects
- View project statistics and progress
- Delete projects

### 4.3 Dataset Management
- Upload Excel (.xlsx, .xls) or CSV files
- Automatic column detection
- Multiple datasets per project
- Delete datasets

### 4.4 Rating System
- 1-5 star rating scale
- Optional comments per rating
- Multiple raters per data row (each rater gives independent rating)
- View other raters' evaluations
- Filter: All / Rated / Unrated
- Keyboard shortcuts for efficiency

### 4.5 Export & Analytics
- Export to Excel or CSV
- Per-rater rating columns
- Average rating per row
- Rating count per row

---

## 5. Technical Architecture

### Stack
- **Backend**: FastAPI (Python)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Frontend**: Jinja2 templates, vanilla JavaScript
- **Auth**: Session-based with bcrypt

### Data Model
```
User (id, username, password_hash, role)
Project (id, name, description, owner_id)
ProjectAssignment (project_id, rater_id)
Session/Dataset (id, name, filename, columns, project_id)
DataRow (id, session_id, row_index, content)
Rating (id, data_row_id, rater_id, rating_value, comment)
```

---

## 6. Market Analysis

### Market Size
- Global data annotation market: $1.2B (2024) → $10.2B (2034)
- CAGR: 23.9%

### Key Competitors
| Competitor | Target | Pricing | Weakness |
|------------|--------|---------|----------|
| Scale AI | Enterprise | $93K-$400K/yr | Opaque, expensive |
| HumanSignal | Enterprise | Custom | Setup overhead |
| Uber AI | Enterprise | Custom | Vendor lock-in |
| Labelbox | Enterprise | Usage-based | Scales quickly |

### Our Differentiation
- **Transparent pricing** with low entry barriers
- **Self-service** immediate access (no sales cycles)
- **Multiple raters per item** for quality assurance
- **Focus on AI/LLM evaluation** vs general annotation

---

## 7. Development Roadmap

### Phase 1: MVP (Current) ✅
- [x] User authentication (register, login, logout)
- [x] Two roles: Requester and Rater
- [x] Project creation and management
- [x] Dataset upload (Excel, CSV)
- [x] Rating interface with 1-5 stars
- [x] Multiple ratings per row (one per rater)
- [x] Export to Excel/CSV
- [x] View other raters' ratings

### Phase 2: Quality & Scale
- [ ] Email verification
- [ ] Password reset
- [ ] Rater performance metrics
- [ ] Inter-rater agreement calculations
- [ ] Bulk operations
- [ ] Pagination improvements
- [ ] Admin dashboard

### Phase 3: Advanced Features
- [ ] Custom rating scales/rubrics
- [ ] Multi-modal data support (images, audio)
- [ ] API access for integrations
- [ ] Rater credentialing system
- [ ] Dynamic rater pool matching
- [ ] Quality control workflows

### Phase 4: Data Flywheel
- [ ] Anonymized evaluation data collection
- [ ] Reward model training
- [ ] AI-assisted evaluation (hybrid workflows)
- [ ] Evaluation dataset marketplace

---

## 8. Success Metrics

### Platform Metrics
- Number of active requesters
- Number of active raters
- Datasets uploaded per month
- Ratings completed per month
- Export frequency

### Quality Metrics
- Inter-rater agreement scores
- Rater completion rates
- Time to complete ratings
- Client satisfaction scores

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low rater quality | Performance tracking, credential verification |
| Data privacy concerns | SOC 2 compliance, encryption, access controls |
| Scale limitations | Cloud infrastructure, database optimization |
| Rater pool shortage | Community building, competitive compensation |

---

## 10. Appendix

### Running the Platform
```bash
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

### API Documentation
Available at `/docs` when server is running (FastAPI auto-generated).
