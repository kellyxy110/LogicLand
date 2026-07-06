# apps/api — reserved BFF / edge layer

The heavy intelligence lives in `logicland-engine` (FastAPI). This directory is
reserved for a thin **Backends-for-Frontend** layer if/when we need Next.js
Route Handlers or edge middleware that shouldn't live inside `apps/web`
(e.g. webhooks from Clerk/Cloudinary, signed upload URLs, cron endpoints).

For Phase 1 it is intentionally empty — the web app talks to the engine directly
via `apps/web/src/lib/engine.ts`. Do not duplicate domain logic here.
