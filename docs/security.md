# LogicLand — Security & Child Safety

Serving children 5–10 raises the bar. Security is a product feature.

## Child safety
- **Boundary filtering:** every child-facing AI string passes `utils/safety.py`
  before leaving the engine; unsafe content degrades to a friendly fallback.
- **AI never replaces the teacher.** High-stakes generated content is
  draft-then-approve by the teacher.
- **No child free-text to third parties** without filtering + minimisation.

## Auth & access
- **Clerk** for authentication; roles enforced on every route and API call.
- Students see only their data; parents only their children; teachers only their
  classroom. Deny-by-default authorization.

## Secrets & config
- **No secrets in code.** Env vars only; `.env` git-ignored; `.env.example` documents keys.
- Least-privilege API keys; rotate on exposure.

## Data protection
- COPPA-minded data minimisation; collect only what teaching requires.
- Encrypt in transit (TLS) and at rest (managed DB). Scoped CORS to web origins.
- PII stays in PostgreSQL; the engine handles derived data, not identity records.

## Operational
- Dependency scanning + CI checks; structured logging without logging secrets or
  child PII. Incident rollback via immutable deploys.
