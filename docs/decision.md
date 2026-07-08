# LogicLand — Architectural Decision Records

Concise ADRs. Each records context → decision → consequences.

## ADR-001 Monorepo (pnpm + Turborepo)
**Context:** web + Python engine + shared packages must evolve together.
**Decision:** single monorepo, pnpm workspaces, Turborepo task graph.
**Consequences:** atomic cross-cutting changes, shared types, one CI. Slightly
more tooling up front.

## ADR-002 Two runtimes (Next.js + FastAPI)
**Decision:** Next.js owns experience; FastAPI is the intelligence engine.
**Consequences:** best tool per job, independent scaling, clear AI boundary.
Cost: a network hop and two deploy targets.

## ADR-003 Provider-agnostic AI
**Decision:** all LLM calls go through an OpenAI-compatible abstraction
(`llm/provider.py`); provider chosen by config.
**Consequences:** no vendor lock-in; swap providers without touching call sites.

## ADR-004 Child-safety at the boundary
**Decision:** a single filter (`utils/safety.py`) guards every child-facing
string before it leaves the engine.
**Consequences:** one auditable choke point instead of scattered checks.

## ADR-005 Prisma/PostgreSQL as system of record
**Decision:** relational model via Prisma; engine holds no core records.
**Consequences:** strong integrity, easy migrations, clear ownership.

## ADR-006 Clerk for auth
**Decision:** Clerk with roles in publicMetadata, mirrored to `User.role`.
**Consequences:** fast, secure auth; role-based routing; less custom code.

## ADR-007 Storage abstraction
**Decision:** storage accessed via an interface; Cloudinary/UploadThing pluggable.
**Consequences:** provider swap without rewrites.

## ADR-008 Vocabulary as product law
**Decision:** Worlds/Missions/Skills, never "Lesson 1".
**Consequences:** language reinforces the magical-world experience everywhere.

## ADR-009 Two-lane LLM provider strategy
**Context:** the engine serves two very different LLM workloads — (a) **live,
child-facing** tutoring (Robo's Helper), where a 5–10-year-old's typed input
reaches the model, and (b) **offline content generation** (quizzes, worksheets)
authored by staff with no child PII. Free/community model tiers (e.g. OpenRouter
`:free`) are cheap and OpenAI-compatible, but typically permit data retention /
training on prompts, are rate-limited, and offer no uptime guarantee.
**Decision:** split by lane, config-only via the ADR-003 abstraction.
- **Child-facing lane** stays on a reputable **zero-data-retention** provider
  (default `gpt-4o-mini`, or the Vercel AI Gateway). Privacy + reliability win
  over cost here; there is no fallback net between the tutor and the child.
- **Content-generation lane** may use a free OpenAI-compatible model
  (selected: `qwen/qwen3-next-80b-a3b-instruct` via OpenRouter — *instruct*
  not *thinking* so no chain-of-thought leaks and JSON stays clean; a real,
  current model). Trial it on **dev/staging** first; `quizzes/service.py`
  already falls back deterministically on error.
- **Disqualified:** minimal-guardrail / "uncensored / steerable" models
  (e.g. Hermes-3-405B) are barred from any child-facing path.
**Consequences:** privacy honored where it matters, cost reduced where it's
safe, no code changes (provider chosen by `LLM_*` env vars per deploy). Ops must
keep two provider configs and rotate keys out of chat/code into env only.
