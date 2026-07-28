# Engine Deployment & Operations Runbook

Operational guide for the **LogicLand Intelligence Engine** (`logicland-engine`,
FastAPI). Architecture rationale lives in ADR-024 (`docs/decision.md`). The
engine is a **private service** — only the LogicLand web app's server should
reach it.

## What the engine is (and is not)

- It owns curriculum, tutoring, generation, reports, analytics, gamification and
  the AI Gateway (ADR-023).
- It is **not** a public API and **not** deployed on Vercel. The web app
  (`apps/web`) deploys on Vercel; the engine deploys as a container to a
  Python-friendly host (Render / Fly / Railway / any Docker runtime).
- The frontend never calls an LLM directly — always via this engine.

## Endpoints for operators

| Path | Auth | Purpose |
|---|---|---|
| `GET /health` | public | Liveness — process is up. Cheap, touches no deps. Use for container/LB health checks. |
| `GET /ready` | public | Readiness — `200` when config is sound, `503` (`"degraded"`) otherwise. Reports provider/db/safety flags. |
| `GET /api/gateway/health` | service token | AI Gateway snapshot (provider configured?, model catalogue, safety). No model calls. |
| `GET /docs` | disabled in production | Swagger UI (dev/staging only). |

## Environment variables

Copy `logicland-engine/.env.example` → `.env` for local dev. In production set
these in the host's secret store (never commit `.env`):

| Var | Required in prod | Notes |
|---|---|---|
| `ENVIRONMENT` | yes | `production` turns on fail-fast validation + hides `/docs`. |
| `DEBUG` | — | Must be `false` in production. |
| `LOG_LEVEL` | — | `INFO` default. |
| `JSON_LOGS` | recommended | `true` → one JSON log line per request. |
| `CORS_ORIGINS` | yes | Comma-separated **https** allow-list. Never `*`. |
| `SERVICE_AUTH_ENABLED` | — | `true` default. |
| `SERVICE_TOKEN` | yes | Shared secret; the web server sends it in `X-Service-Token`. |
| `RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW_S` | — | Per-client budget (default 120 / 60s). |
| `DATABASE_URL` | if analytics used | Async SQLAlchemy DSN. |
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | optional | Gateway degrades to deterministic fallback when unset (ADR-023). |
| `LLM_CHILD_SAFETY_ENABLED` | yes | Must stay `true`. |

**Fail-fast:** on boot in `production`, `Settings.production_problems()` is
checked; any misconfiguration (debug on, `CORS_ORIGINS=*`, missing
`SERVICE_TOKEN`, safety off) **aborts startup** with a logged reason. The engine
never serves half-configured.

## AI Gateway env contract (ADR-023)

The gateway is **fail-safe by design**: with none of these set, every model call
cleanly returns the caller's deterministic explanation (verified — see
`test_no_provider_takes_fallback_immediately`, and the web `explainMathAction`
falls back to a worked example on any engine error). Set them only to activate
live LLM traffic.

| Var | Required for live AI | Notes |
|---|---|---|
| `LLM_PROVIDER` | yes | `openai` or `openai-compatible`. |
| `LLM_BASE_URL` | yes | Provider endpoint (e.g. Groq `https://api.groq.com/openai/v1`). |
| `LLM_API_KEY` | yes | Secret. Empty ⇒ gateway stays on deterministic fallback. |
| `LLM_MODEL` | optional | Registry routes per task; this is only the provider-default. |
| `LLM_TEMPERATURE` / `LLM_MAX_TOKENS` | optional | Defaults 0.7 / 1200. |
| `LLM_CHILD_SAFETY_ENABLED` | yes | Must stay `true`. |

**Child-facing production caveat (ADR-009):** the currently-wired provider (Groq)
is `privacy_class="standard"`, fine for dev/staging + content generation. A
production **child-facing tutor** should route to a zero-retention provider — a
config + one registry entry, not code.

## Web ⇆ engine handshake (coordinated rollout)

Service auth only activates once `SERVICE_TOKEN` is set. To adopt without an
outage:

1. Deploy the engine with `SERVICE_TOKEN` set.
2. Set the **same** value in the web app's server env and attach it as
   `X-Service-Token` on every engine request (server-side only — never expose it
   to the browser).
3. Verify traffic succeeds, then confirm `401`s disappear from engine logs.

Requests without the header get `401`; probes/docs are always exempt.

## Deploy

Two manifests are provided (pick one host; both are examples, not the only
options):

### Render (`render.yaml`)
1. New → Blueprint → point at the repo; Render reads `logicland-engine/render.yaml`.
2. Fill the `sync: false` secrets in the dashboard (`SERVICE_TOKEN`,
   `CORS_ORIGINS`, `DATABASE_URL`, `LLM_API_KEY`, `LLM_BASE_URL`).
3. Health check path is `/health`. `autoDeploy: false` — promote intentionally.

### Fly.io (`fly.toml`)
```bash
cd logicland-engine
fly launch --no-deploy          # first time only; reuse fly.toml
fly secrets set SERVICE_TOKEN=... CORS_ORIGINS=https://app.example \
  DATABASE_URL=... LLM_API_KEY=... LLM_BASE_URL=...
fly deploy
```

### Any Docker host
```bash
docker build -t logicland-engine logicland-engine
docker run -p 8000:8000 --env-file logicland-engine/.env logicland-engine
```

## Post-deploy smoke test

```bash
curl -fsS  https://<engine-host>/health              # {"status":"ok",...}
curl -fsS  https://<engine-host>/ready               # {"status":"ready",...} or 503
curl -fsS -H "X-Service-Token: $SERVICE_TOKEN" \
     https://<engine-host>/api/gateway/health        # gateway snapshot
curl -s -o /dev/null -w "%{http_code}\n" \
     https://<engine-host>/api/curriculum/journey     # 401 without token, 200 with
```

## Operations

- **Logs:** JSON lines keyed by `request_id`; each request logs method, path,
  status, `duration_ms`. Auth denials log `service_auth.denied`; throttling logs
  `ratelimit.exceeded`.
- **Rollback:** redeploy the previous image/commit (Render: redeploy prior
  deploy; Fly: `fly releases` → `fly deploy --image <prior>`).
- **Scaling note:** the rate limiter is in-process (per instance). For multiple
  instances, front it with a shared store (e.g. Redis) or a gateway-level limit.
- **Incident quick checks:** `/ready` `503` → read the `checks.config` list;
  flood of `401` → web app not sending `X-Service-Token`; `429` spikes → tune
  `RATE_LIMIT_*` or investigate the client.
