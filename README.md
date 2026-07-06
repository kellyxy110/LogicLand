<div align="center">

# 🌟 LogicLand

### Think Clearly. Build Boldly. Create Fearlessly.

A premium coding and computational-thinking world for children aged **5–10**.
Version One is **Mr. Kelly's Digital Coding Classroom**.

</div>

---

## What is this?

LogicLand turns learning to code into a story-based adventure. Children explore
**Worlds**, complete **Missions**, master **Skills**, and earn badges — guided by
Robo and an AI Helper that gives hints, never answers. Parents stay informed;
teachers are empowered with generators that cut manual work.

> Every screen answers one question: **"Does this make learning exciting?"**

## Architecture

A **pnpm + Turborepo monorepo** with two planes:

- **Experience** — `apps/web` (Next.js App Router, React, TS, Tailwind, Framer Motion, Clerk).
- **Intelligence** — `logicland-engine` (FastAPI): curriculum, tutoring, generation, reports, analytics, gamification.

```
logicland/
  apps/web           Next.js frontend (the experience)
  apps/api           reserved thin BFF/edge layer (empty in Phase 1)
  packages/ui        shared Shadcn-based components
  packages/database  Prisma schema + client
  packages/auth      Clerk role helpers
  packages/shared    shared types, constants, Zod schemas
  logicland-engine   FastAPI intelligence engine (Python)
  docs/              PRD, UX spec, architecture, curriculum, and more
  scripts/           setup scripts (win/mac/linux)
  .github/           CI
```

Full rules and conventions live in [`CLAUDE.md`](CLAUDE.md). Product scope in
[`docs/PRD.md`](docs/PRD.md); screens in [`docs/ui-ux-spec.md`](docs/ui-ux-spec.md).

## Quick start

```bash
# 0. Prereqs: Node 20+, pnpm 9+, Python 3.11+, Docker

# 1. Database
docker compose up -d db

# 2. Engine (Python)
scripts/setup-engine.ps1        # Windows
# or: scripts/setup-engine.sh   # macOS / Linux
cd logicland-engine && uvicorn main:app --reload --port 8000   # http://localhost:8000/docs

# 3. Web (Node)
pnpm install
pnpm --filter @logicland/database db:generate
pnpm --filter @logicland/web dev                                # http://localhost:3000
```

## Documentation

| Topic | File |
|---|---|
| Product requirements | [`docs/PRD.md`](docs/PRD.md) |
| Screens & flows | [`docs/ui-ux-spec.md`](docs/ui-ux-spec.md) |
| Architecture & decisions | [`docs/architecture.md`](docs/architecture.md), [`docs/decision.md`](docs/decision.md) |
| Tech stack | [`docs/tech-stack.md`](docs/tech-stack.md) |
| Database | [`docs/database.md`](docs/database.md) |
| Curriculum | [`docs/curriculum.md`](docs/curriculum.md) |
| API | [`docs/api.md`](docs/api.md) |
| Brand · UI · Motion | [`docs/branding.md`](docs/branding.md), [`docs/ui-guidelines.md`](docs/ui-guidelines.md), [`docs/animations.md`](docs/animations.md) |
| Deployment · Testing · Security | [`docs/deployment.md`](docs/deployment.md), [`docs/testing.md`](docs/testing.md), [`docs/security.md`](docs/security.md) |
| Roadmap | [`docs/roadmap.md`](docs/roadmap.md) |

## Status

**Phase 1 — Foundation.** Structure, documentation, architecture, and standards.
Do not implement application features until this foundation is reviewed.
