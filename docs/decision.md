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
