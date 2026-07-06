# CLAUDE.md — LogicLand Project Instructions

> Read this first. It is the operating manual for anyone (human or AI) building
> LogicLand. Companion sources of truth: [`docs/PRD.md`](docs/PRD.md) and
> [`docs/ui-ux-spec.md`](docs/ui-ux-spec.md).

## What LogicLand is

A premium coding and computational-thinking platform for children aged **5–10**.
Version One is **Mr. Kelly's Digital Coding Classroom**: one teacher, one or more
students, their parents. Built from day one to scale into a full children's
technology academy without a rewrite.

**Tagline:** Think Clearly. Build Boldly. Create Fearlessly.

## The one question every screen must answer

> "Does this make learning exciting?"

Children should feel they are entering a magical world, not attending school.
Parents should feel informed. Teachers should feel empowered.

## Architecture in one paragraph

A **pnpm + Turborepo monorepo**. `apps/web` (Next.js App Router) owns the user
experience. `logicland-engine` (FastAPI) is the **educational intelligence
engine** — curriculum, AI tutoring, generation, reports, analytics, gamification.
Shared code lives in `packages/*` (`ui`, `database`, `auth`, `shared`).
PostgreSQL via Prisma. Clerk for auth. AI via a provider-agnostic,
OpenAI-compatible abstraction.

```
logicland/
  apps/web           Next.js frontend (experience)
  apps/api           reserved thin BFF/edge layer (empty in Phase 1)
  packages/ui        shared Shadcn-based components
  packages/database  Prisma schema + client
  packages/auth      Clerk role helpers
  packages/shared    shared types, constants, Zod schemas
  logicland-engine   FastAPI intelligence engine (Python)
  docs/              all planning + source-of-truth docs
  scripts/           setup scripts (win/mac/linux)
  .github/           CI
```

## Non-negotiable rules

1. **AI assists, never replaces the teacher.** The tutor gives scaffolded hints,
   one at a time, and never the final answer.
2. **Child safety at the boundary.** Every child-facing AI string passes through
   `logicland-engine/utils/safety.py` before leaving the engine.
3. **Never hardcode an AI provider.** All LLM access flows through
   `logicland-engine/llm/provider.py` (OpenAI-compatible).
4. **Never say "Lesson 1."** Use Worlds, Missions, Skills, adventures.
5. **No secrets in code.** Environment variables only. `.env` is git-ignored.
6. **Type everything.** Strict TypeScript; Python type hints + mypy strict.
7. **Storage is abstracted** so Cloudinary/UploadThing can be swapped.
8. **The frontend never calls an LLM directly** — always via the engine.

## Vocabulary

| Term | Meaning |
|---|---|
| World | A themed universe (e.g. "The Lost Robot") |
| Mission | One adventure teaching one core Skill |
| Skill | The computational-thinking concept (Loops, Conditions, …) |
| AI Helper / Robo's Helper | The scaffolded-hint tutor |

## Development standards

- **Python:** Black, Ruff, mypy (strict), Pytest, Pydantic, FastAPI best
  practices, structured logging, type hints everywhere.
- **Next.js:** strict TS, Server Components by default, Server Actions where
  appropriate, feature-based folders, accessibility first, responsive, dark
  mode, loading skeletons, error boundaries.

## How to run (Phase 1)

```bash
# 1. Database
docker compose up -d db

# 2. Engine (Python)
scripts/setup-engine.ps1        # Windows
scripts/setup-engine.sh         # macOS / Linux
# then: cd logicland-engine && uvicorn main:app --reload --port 8000

# 3. Web (Node)
pnpm install
pnpm --filter @logicland/database db:generate
pnpm --filter @logicland/web dev
```

## Where to look

| Need | File |
|---|---|
| Product scope & requirements | `docs/PRD.md` |
| Screens & flows | `docs/ui-ux-spec.md` |
| System design & rationale | `docs/architecture.md`, `docs/decision.md` |
| Data model | `packages/database/prisma/schema.prisma`, `docs/database.md` |
| Curriculum | `logicland-engine/curriculum/beginner_journey.py`, `docs/curriculum.md` |
| API surface | `docs/api.md`, `logicland-engine/api/routers.py` |
| Brand & motion | `docs/branding.md`, `docs/animations.md`, `docs/ui-guidelines.md` |
| Roadmap | `docs/roadmap.md` |

## Definition of done for Phase 1

Structure, documentation, architecture, and standards complete (this commit).
**Do not implement application features until the foundation above is reviewed.**
