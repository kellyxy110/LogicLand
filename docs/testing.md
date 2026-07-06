# LogicLand — Testing Strategy

## Engine (Python)
- **Pytest** unit tests per domain package; API contract tests via
  `fastapi.testclient`.
- Smoke tests run **without an LLM key** (see `tests/test_smoke.py`): health,
  curriculum shape, safety filter.
- LLM-dependent tests mock the provider (`llm/provider.py`) — never hit a real API in CI.
- `mypy --strict`, `ruff`, `black --check` gate merges.

## Web (TypeScript)
- `tsc --noEmit` + ESLint gate merges.
- Component tests (Phase 2) with Testing Library; Server Action tests around Prisma
  using a disposable Postgres.
- E2E (Phase 2+) with Playwright for the three role journeys.

## Safety tests (always)
Every child-facing generator has a test asserting output passes the safety filter.

## Principle
Fast, deterministic, no external calls in CI. Real integrations tested in staging.
