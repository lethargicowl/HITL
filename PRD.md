# Human-in-the-Loop (HITL) Platform

## Product Requirements Document v2.0

---

## 1. Product Vision

A comprehensive human evaluation platform for AI teams. Enable any organization to collect high-quality human feedback on AI outputs through flexible evaluation types, robust quality control, and seamless ML workflow integration.

**Target Users**: AI startups, ML teams, research labs building LLMs, agents, and AI systems requiring human feedback.

---

## 2. Core Value Propositions

1. **Immediate Access**: Self-service, no sales cycles, start in minutes
2. **RLHF-Ready**: Built-in pairwise comparison for preference learning
3. **Quality Assurance**: Gold questions, agreement metrics, rater performance tracking
4. **Flexible Schemas**: Custom evaluation forms, rubrics, multi-criteria ratings
5. **API-First**: Integrate into ML pipelines programmatically
6. **Transparent Pricing**: Pay for what you use, no enterprise minimums

---

## 3. User Roles

### Requester (Client)
- Creates organizations and projects
- Designs evaluation schemas
- Uploads datasets
- Manages rater assignments
- Monitors quality and progress
- Exports results

### Rater (Evaluator)
- Completes qualification tests
- Performs evaluations
- Views performance metrics
- Earns based on completed work

### Admin (Organization)
- Manages team members
- Sets permissions
- Views organization-wide analytics

---

## 4. Evaluation Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Rating** | 1-N scale scoring | Quality assessment |
| **Binary** | Yes/No, Good/Bad | Safety classification |
| **Multi-label** | Select multiple tags | Content categorization |
| **Pairwise** | A vs B preference | RLHF training |
| **Ranking** | Order N items | Preference ranking |
| **Free-text** | Written feedback | Corrections, rewrites |
| **Multi-criteria** | Rate on multiple dimensions | Detailed quality rubrics |

---

## 5. Quality Control System

### 5.1 Validation Mechanisms
- **Gold Questions**: Known-answer items to measure accuracy
- **Honeypots**: Hidden test items in regular workflow
- **Consensus**: Require N agreeing ratings

### 5.2 Metrics
- **Inter-Rater Agreement**: Krippendorff's alpha, Cohen's kappa
- **Rater Accuracy**: % correct on gold questions
- **Consistency Score**: Variance in rater's responses
- **Speed Metrics**: Time per task, throughput

### 5.3 Qualification
- **Tests**: Raters pass evaluation before accessing projects
- **Tiers**: Bronze/Silver/Gold based on performance
- **Skills**: Track languages, domains, certifications

---

## 6. Feature Specifications

### 6.1 Project Setup
- Create project with name, description
- Select evaluation type(s)
- Define custom schema (fields, scales, labels)
- Write instructions with examples
- Set quality thresholds
- Configure rater requirements

### 6.2 Data Management
- Upload: CSV, Excel, JSON
- Import: HuggingFace datasets, S3/GCS
- Preview data before committing
- Batch splitting for large datasets
- Version tracking

### 6.3 Task Distribution
- Auto-assign to qualified raters
- Priority levels (urgent, normal, low)
- Deadlines with notifications
- Load balancing across raters
- Overlap control (N raters per item)

### 6.4 Evaluation Interface
- Clean, focused UI
- Keyboard shortcuts
- Progress indicators
- Inline instructions
- Side-by-side comparison (for pairwise)
- Mobile responsive

### 6.5 Analytics Dashboard
- Real-time progress tracking
- Quality metrics visualization
- Rater performance leaderboard
- Distribution charts
- Time analytics
- Exportable reports

### 6.6 Export & Integration
- Formats: CSV, Excel, JSON, Parquet, HuggingFace
- REST API for all operations
- Webhooks for events
- Python SDK

---

## 7. Technical Architecture

### 7.1 Stack
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (production), SQLite (dev)
- **Cache**: Redis
- **Queue**: Celery/RQ for async jobs
- **Frontend**: Jinja2 + vanilla JS (current), React (future)
- **Auth**: Session-based, OAuth, SSO (future)

### 7.2 Data Model (Extended)

```
Organization
├── id, name, plan, created_at
├── members: [User]
└── projects: [Project]

User
├── id, username, email, password_hash
├── role: admin | requester | rater
├── org_id, skills, performance_score
└── sessions: [UserSession]

Project
├── id, name, description, org_id
├── evaluation_type, schema (JSON)
├── instructions, quality_config
├── assignments: [ProjectAssignment]
└── datasets: [Dataset]

Dataset
├── id, name, source, project_id
├── columns, row_count
└── items: [DataItem]

DataItem
├── id, dataset_id, index
├── content (JSON), is_gold, gold_answer
└── evaluations: [Evaluation]

Evaluation
├── id, item_id, rater_id
├── response (JSON - flexible per schema)
├── time_spent, created_at
└── quality_flags

EvaluationSchema
├── id, name, type
├── fields: [SchemaField]
└── rubric, examples

QualificationTest
├── id, project_id, questions
├── passing_score
└── attempts: [TestAttempt]
```

---

## 8. Development Roadmap

### Phase 1: MVP ✅ (Complete)
- [x] User authentication
- [x] Requester/Rater roles
- [x] Project management
- [x] Dataset upload (CSV, Excel)
- [x] 1-5 star rating
- [x] Multiple raters per item
- [x] Basic export

### Phase 2: Quality & Flexibility (Next)
- [ ] Custom rating scales (1-10, 1-100, etc.)
- [ ] Multi-criteria evaluation (rate on N dimensions)
- [ ] Binary classification tasks
- [ ] Multi-label classification
- [ ] Pairwise comparison (A vs B)
- [ ] Gold questions / honeypots
- [ ] Inter-rater agreement metrics
- [ ] Real-time progress dashboard
- [ ] Rich instructions editor
- [ ] Organization & team management
- [ ] Invitation system

### Phase 3: Scale & Integration
- [ ] REST API with API keys
- [ ] Bulk upload operations
- [ ] Task auto-assignment queue
- [ ] Rater qualification tests
- [ ] Performance tracking & tiers
- [ ] Webhooks
- [ ] HuggingFace dataset import
- [ ] PostgreSQL migration

### Phase 4: Advanced
- [ ] Image/audio data support
- [ ] Span/highlight annotation
- [ ] Python SDK
- [ ] Advanced analytics & reports
- [ ] SSO/SAML authentication
- [ ] Mobile optimization
- [ ] Billing & usage tracking

---

## 9. Success Metrics

### Adoption
- Monthly active organizations
- Projects created per month
- Items evaluated per month

### Quality
- Average inter-rater agreement
- Gold question accuracy rates
- Rater retention rate

### Engagement
- Time to first evaluation
- Project completion rate
- API usage growth

---

## 10. Competitive Positioning

| Dimension | Scale AI | Labelbox | Us |
|-----------|----------|----------|-----|
| Self-serve | No | Limited | Yes |
| Min commitment | $50K+ | $40K+ | $0 |
| Pairwise eval | Yes | Limited | Yes |
| Quality metrics | Internal | Basic | Transparent |
| Custom schemas | Yes | Yes | Yes |
| API access | Enterprise | Paid | Included |
| Setup time | Weeks | Days | Minutes |

---

## 11. Appendix

### Quick Start
```bash
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
# Visit http://localhost:8000
```

### API Docs
Auto-generated at `/docs` (Swagger) and `/redoc` (ReDoc).
