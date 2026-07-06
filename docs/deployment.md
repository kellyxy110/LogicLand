# LogicLand — Deployment Strategy

## Environments
`development` (local) → `staging` → `production`. Config is env-driven; secrets
never in code.

## Local
`docker compose up -d db` for PostgreSQL; engine + web run natively (fast reload)
or fully containerised via `docker compose up`.

## Web (apps/web)
Deploy to **Vercel** (Next.js App Router, Fluid Compute). Set `DATABASE_URL`,
Clerk keys, and `NEXT_PUBLIC_ENGINE_URL` as env vars. Preview deploys per PR.

## Engine (logicland-engine)
Container (`logicland-engine/Dockerfile`) to any container host (Vercel Python
Functions, Fly.io, Cloud Run, Render). Stateless → scale replicas horizontally.
Set `LLM_*`, `DATABASE_URL`, `CORS_ORIGINS`.

## Database
Managed PostgreSQL (Neon/Supabase/RDS). Run `prisma migrate deploy` on release.

## CI/CD
GitHub Actions (`.github/workflows/ci.yml`) lints + type-checks + tests both
planes on every push/PR. Promote to production on green main.

## Rollback
Immutable deploys; roll back by re-promoting the previous build. DB changes are
forward-only migrations reviewed before deploy.
