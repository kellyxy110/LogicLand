# LogicLand — Engine API Design (FastAPI)

Base URL: `http://localhost:8000`, prefix `/api`. Interactive docs at `/docs`.
Controllers are thin (`api/routers.py`); domain logic lives in feature packages.

## System
- `GET /health` → `{status, service, env}`

## Curriculum
- `GET /api/curriculum/journey` → `{ total_weeks, worlds[] }`

## AI Helper (tutor)
- `POST /api/tutor/ask`
  - body: `{ student_id, question, mission_slug?, hint_level? (1-3) }`
  - returns: `{ answer, is_hint, safe }` — one scaffolded hint, safety-filtered.

## Reports
- `POST /api/reports/weekly` → `{ student_name, week, summary, highlights[], next_steps[] }`

## Certificates
- `POST /api/certificates/generate` → `{ student_name, achievement, kind, citation }`

## Planned (Phase 2)
- `POST /api/worksheets/generate`, `/quizzes/generate`, `/flashcards/generate`
- `POST /api/parents/summary`, `/analytics/*`, `/badges/evaluate`

## Conventions
- Pydantic schemas for all I/O (`models/schemas.py`).
- Provider-agnostic AI via `llm/provider.py`.
- Every child-facing string filtered via `utils/safety.py`.
- CORS limited to configured web origins.
