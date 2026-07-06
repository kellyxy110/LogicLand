# LogicLand — System Architecture

## Overview

LogicLand is a **pnpm + Turborepo monorepo** split along a clean seam:

- **Experience plane — `apps/web` (Next.js App Router).** All UI, routing, auth
  session, and data presentation. Server Components by default; Server Actions
  for mutations that belong to the web tier (e.g. writing a Submission via Prisma).
- **Intelligence plane — `logicland-engine` (FastAPI).** All educational
  intelligence: curriculum, tutoring, generation, reports, analytics,
  gamification rules. Stateless, horizontally scalable.

```
Browser ──> Next.js (apps/web) ──> Prisma ──> PostgreSQL
                     │
                     └── HTTP (typed engine client) ──> FastAPI (logicland-engine) ──> LLM provider (OpenAI-compatible)
```

## Why two runtimes

Python is the best home for pedagogy, prompt orchestration, and analytics; the
Node/React ecosystem is the best home for a premium child UX. Keeping them
separate lets each scale independently and keeps AI logic out of the browser.

## Data ownership

- **Prisma/PostgreSQL** is the system of record for identities, curriculum
  content, submissions, gamification state, attendance, reports.
- **The engine** reads those records (passed in requests or via its own async
  SQLAlchemy connection for analytics) and returns *derived, AI-enriched*
  artifacts. It never becomes a second source of truth for core records.

## Key boundaries (enforced by rules in CLAUDE.md)

1. **Frontend never calls an LLM directly.** Always through the engine.
2. **All LLM access flows through `llm/provider.py`** — provider is configured.
3. **Child-facing text is filtered** in `utils/safety.py` before leaving the engine.
4. **Thin controllers, rich domain** in the engine; **Server Components + Actions**
   with feature folders in web.

## Request lifecycles

- **Ask AI Helper:** Student UI → `engine.askTutor()` → `/api/tutor/ask` →
  `TutorService` → provider → safety filter → response.
- **Weekly report:** Teacher UI → engine `/api/reports/weekly` → draft → teacher
  edits/approves → persisted via Prisma (`WeeklyReport`).
- **Mission completion:** web Server Action writes `Submission` + gamification
  deltas via Prisma; engine consulted for badge-eligibility rules.

## Scaling path (1 → thousands)

- Engine is stateless → run N replicas behind a load balancer.
- PostgreSQL with read replicas for analytics.
- Add `apps/api` BFF only when edge/webhook concerns demand it.
- Multi-classroom = add `Classroom`/`org` scoping; schema already role-clean.

See [`decision.md`](decision.md) for the rationale behind each major choice.
