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

---

# Transformation ADRs (v2 → v3)

> Context for this block: v2.0 briefly reframed LogicLand as a broad "ecosystem
> of Academies" (Coding, Math, Science, Robotics, …). That sprawl risked
> LogicLand becoming *another colourful coding-lessons site*. These ADRs
> re-anchor the product: **LogicLand is a programming platform first**, and
> everything else strengthens that core. They supersede the "collect many
> academies" reading of v2.0 without discarding the work already shipped —
> the academy catalog, Math Fix, and Typing Town all remain and slot into the
> structure below. Companion execution plan: [`docs/tasks.md`](tasks.md).

## ADR-010 Programming is the permanent core — three foundations, not a catalog
**Context:** a learner who finishes LogicLand should not merely *know what a loop
is*. They should open an unfamiliar project, use a terminal, debug an error,
manage Git, call an API, read docs, write a test, and ship something that works.
A flat list of twelve co-equal academies dilutes that outcome.
**Decision:** LogicLand has **three permanent foundations — Programming &
Software Engineering, Mathematics & Computational Reasoning, Artificial
Intelligence & Intelligent Systems.** Every other subject (robotics, science,
design, entrepreneurship, …) *branches from* these foundations rather than
sitting beside them as an equal. The north-star outcome is explicit: **"From
first instruction to real engineer."**
**Consequences:** priorities and roadmap order flow from the three foundations;
the existing academy catalog stays as a discovery surface but is re-grouped
under them; we say "no" to breadth that doesn't feed the core.

## ADR-011 Four environments: Academy / Studio / Lab / Arena
**Context:** one lesson-shaped interface cannot both *teach* and *let a learner
build a real project*. The blueprint separates the jobs.
**Decision:** LogicLand exposes four connected working environments, each with a
single job:
- **Academy** — structured courses, missions, pathways, assessment. *What should
  I learn next?* (Today's World → Mission → Level model lives **here**.)
- **Studio** — a genuine browser IDE (files, editor, terminal, run/test/git).
  *What can I build?*
- **Lab** — experimental/notebook environment (Python, data, ML, simulations,
  math). *What can I discover?*
- **Arena** — contests, leagues, hackathons, showcases, DevGuild. *How good am I
  becoming?*
The existing tiering (**Academy → Course → World → Mission → Level**) is the
Academy environment's internal structure; it is unchanged.
**Consequences:** clear ownership per environment, independent build-out, and a
shared spine (auth, skill graph, projects) underneath all four. Cost: four
surfaces to design and maintain — sequenced, not built at once (see tasks.md).

## ADR-012 One continuous ecosystem, age-adaptive presentation
**Context:** a 6-year-old and a university student must not share an interface,
but they must share a *platform* — the child should later recognise their block
instructions became Python, a terminal, and Git commits.
**Decision:** age determines interaction design, cognitive load, freedom, and
tooling — **not** a separate product. Brackets: **Code Sprouts (4–6), Code
Explorers (7–9), Code Builders (10–12), Developer Pathways (13–15), Engineering
Tracks (16–18), Professional.** One shared content/skill engine; presentation
and narrative differ per bracket. Professional vocabulary is revealed
progressively — "Save Point → commit", "experiment path → branch", "change
proposal → pull request" — and the real term always stays visible underneath.
**Consequences:** no forked codebase per age; a single `ageMode`/bracket concept
drives theming, vocabulary, tool availability, and project complexity. We never
trap a learner inside a fictional toolset.

## ADR-013 Studio is a real IDE built on Monaco — never a decorated answer box
**Context:** "read instruction → fill blank → confetti" produces lesson
completion, not developers. Monaco is the editor that powers VS Code and runs in
the browser.
**Decision:** LogicLand Studio is a genuine multi-file IDE — explorer, tabbed
Monaco editor, terminal, output console, problems panel, test runner, git panel,
preview, AI assistant panel — supporting real project structures (`src/`,
`tests/`, `package.json`, `README.md`, `.gitignore`), not single-file exercises.
**Consequences:** significant frontend investment and a new execution layer
(ADR-014). Monaco is heavy — it is lazy-loaded and confined to Studio/Lab, never
pulled into the young-learner play surfaces.

## ADR-014 Hybrid execution: browser-first, cloud for heavy workloads
**Context:** running every exercise in a remote container is slow and expensive;
running *everything* in the browser can't cover Java, C/C++, Docker, databases,
GPU/ML.
**Decision:** choose the runtime automatically.
- **Browser execution** (default) for HTML/CSS/JS/TS, intro Node, Python
  foundations, SQL sims, algorithms, math — via **Pyodide/JupyterLite**
  (Python) and **WebContainers** (Node + OS commands). Instant, cheap, safe,
  offline-friendly.
- **Sandboxed cloud execution** for heavier Python, Java, C/C++, Go, Rust,
  Docker, databases, network services, security labs, GPU/ML — via **Vercel
  Sandbox** (ephemeral Firecracker microVMs; GA). Short-lived, resource-limited,
  isolated, monitored.
**Consequences:** a runtime-selection layer and a cost/safety boundary. Cloud
runs are gated (age, quota, mastery). Keep the browser lane the default so most
activity never touches paid compute.

## ADR-015 Deterministic evaluation is the source of truth; AI never grades
**Context:** correctness, tests, mastery, competition results, and certification
must be trustworthy and reproducible. LLMs are non-deterministic.
**Decision:** a **deterministic evaluation engine** (unit tests, output checks,
static rubrics, formal/symbolic validators — e.g. the Proof Workshop checker,
and Math Fix's misconception models) decides *correct / incorrect / mastered*.
AI may explain, question, hint, and improve wording **after** a deterministic
verdict, but never sets it. This extends Math Fix's existing "each model
predicts the exact wrong answer" design to the whole platform.
**Consequences:** trustworthy progress signals and a real moat (the evaluation
corpus + skill-graph evidence, not chat history). Building rich evaluators is
work — but it is the differentiator.

## ADR-016 The `logic` CLI — a teaching bridge into real tools
**Context:** learners must reach *real* terminals and *real* Git, not a fictional
toolset.
**Decision:** ship a `logic` CLI inside Studio/Lab that scaffolds LogicLand
projects and *teaches* the terminal. Educational Git wrappers (`logic git save
"…"`) always print the real command underneath (`git add . && git commit -m …`);
the scaffolding fades as learners graduate to raw `git`. Real **GitHub
integration** (connect, repo, branch, PR, review, publish portfolio) follows,
with younger-learner vocabulary layered on top of the real nouns.
**Consequences:** a CLI surface + a safe command allow-list per age/runtime. We
commit to *bridging out* to professional tooling rather than locking learners in.

## ADR-017 Graduated AI permissions, gated on demonstrated mastery
**Context:** unrestricted AI can erode the very ability we teach; a 6-year-old
must not get an open chatbot.
**Decision:** seven AI stages — (1) AI-free, (2) question-only, (3) hint,
(4) explain-existing-code, (5) pair-programmer snippets, (6) engineering copilot
(learner must review/test/approve), (7) AI-systems builder. **Access depends on
demonstrated mastery (skill-graph evidence), not age or subscription alone.**
Younger interfaces use constrained intents, approved knowledge, short responses,
no browsing, teacher-visible history, parent controls.
**Consequences:** an AI-permission policy keyed to the skill graph, enforced at
the gateway (ADR-018). This preserves "AI assists, never replaces the teacher"
(CLAUDE.md rule 1) at platform scale.

## ADR-018 Provider-neutral AI Gateway + model registry (NexisHub)
**Context:** the platform must never be built around one LLM vendor, and must
enforce safety/cost/age centrally. Extends ADR-003 and ADR-009.
**Decision:** every model request flows through a **NexisHub-controlled AI
Gateway** (routing, model selection, cost limits, age restrictions, safety, rate
limits, caching, logging, prompt versioning, fallback, response schemas, evals).
An internal **model registry** records each model's capabilities, cost, latency,
allowed ages, privacy class, allowed tasks, eval score, weaknesses, and fallback.
Product code never calls an arbitrary model directly. Vercel AI Gateway is the
default transport; the engine's `llm/provider.py` remains the code-side seam.
**Consequences:** one auditable choke point for all AI; providers swap by config;
per-age/per-task policy is enforceable and observable (AI trace panel).

## ADR-019 NexisHub is the platform; LogicLand is the product
**Context:** identity, infra, billing, AI gateway, and analytics are shared
concerns across a family of products (TeachNexis, EventNexis, SiteNexis, …).
**Decision:** present as **"LogicLand, a NexisHub learning platform."** NexisHub
owns identity/auth, infrastructure, the AI gateway, security, billing, analytics,
and research; LogicLand owns the specialized programming/maths/AI learning
experience. Sibling products integrate later without entangling LogicLand's core.
**Consequences:** clean seams for shared services; LogicLand stays focused. No
immediate re-platforming — this names the boundary we build toward, not a
rewrite.

## ADR-020 Consent-gated public sharing (DRAFT — awaiting policy sign-off)
**Status:** *Draft. Data model + flow designed; NOT implemented. Public
visibility stays OFF until the owner signs off on the consent policy.*
**Context:** learners (aged 5–10 and up) will want to share projects and
portfolios. Exposing a minor's work publicly is a safeguarding/PII decision, not
an engineering default. Everything must be **private by default**, and any step
toward wider visibility must be **explicitly approved by a responsible adult**.
**Decision (target design):**
- **Visibility ladder**, most-private first — a project/portfolio has exactly one
  level: `private` (owner only) → `portfolio` (owner + linked parent/teacher) →
  `school` (within the learner's classroom/school) → `anonymous_showcase` (public
  but no name/PII, no profile link) → `public_showcase` (named, public) →
  `competition` (visible to a specific event's judges/audience).
- **Approvals required to *raise* visibility**, by role and level:
  - to `school`: teacher **or** parent approval;
  - to `anonymous_showcase` / `competition`: parent approval;
  - to `public_showcase`: parent **and** (for school-managed accounts) school-admin
    approval. Lowering visibility never needs approval and takes effect at once.
- **PII scrubbing** at `anonymous_showcase`: strip display name, avatar, age,
  free-text that may contain names; show work + skills only. A deterministic
  scrubber runs before anything leaves the private boundary.
- **Revocable + audited:** any approver (or the platform) can revoke; every
  visibility change and approval is logged with who/when.
- **Share links** are unguessable tokens, scoped to the granted level, and
  expire; they never elevate visibility on their own.
**Data model (draft — to migrate only after sign-off):**
```
enum Visibility { PRIVATE PORTFOLIO SCHOOL ANONYMOUS_SHOWCASE PUBLIC_SHOWCASE COMPETITION }
enum ShareState { PENDING APPROVED REJECTED REVOKED }
model ShareGrant {
  id           String   @id @default(cuid())
  studentId    String                       // owner (Student)
  subjectType  String                       // "studio_project" | "portfolio"
  subjectId    String                       // the thing being shared
  visibility   Visibility @default(PRIVATE)
  state        ShareState @default(PENDING)
  token        String   @unique             // unguessable; for link scope
  requestedBy  String                       // userId who asked
  approvedBy   String?                       // userId who approved (parent/teacher/admin)
  approverRole String?                       // "PARENT" | "TEACHER" | "SCHOOL_ADMIN"
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([studentId]) @@index([subjectType, subjectId])
}
model ShareAudit {
  id         String   @id @default(cuid())
  grantId    String
  actorId    String
  action     String   // "requested" | "approved" | "rejected" | "revoked" | "visibility_changed"
  detail     String?
  createdAt  DateTime @default(now())
  @@index([grantId])
}
```
**Consequences:** a real consent/audit spine LogicLand can build behind, with
public visibility disabled until the owner sets the policy (who may approve what,
default expiry, whether `public_showcase` is allowed for minors at all). No
public route, migration, or PII exposure ships from this ADR — it is the plan the
implementation will follow once approved. **Blocker to enable: the owner's
policy decision.**

## ADR-021 LogicLand Canvas — a semantic-block layer over Excalidraw
**Context:** the Sketchpad embeds raw Excalidraw (freehand only). A
LogicLand-native canvas needs *semantic* objects (code, equations, flowchart
steps, notes) that other systems — Proof Workshop, AI tools, the Project Graph —
can read and reason about, plus autosave, versions and safe export. Rewriting
Excalidraw's element system is out of scope and unnecessary.
**Decision:** keep Excalidraw as the **freehand drawing layer**, and add a
**document model on top**: a `CanvasDoc` = `{ title, blocks: CanvasBlock[],
scene (Excalidraw elements), linkedTo }`. `CanvasBlock` is a typed union
(`note | label | flowchart | code | equation`) with text + position. The engine
(`lib/engines/canvas-doc.ts`) is pure and testable — block CRUD, version
snapshots (bounded history + restore), and a **safe export** (self-contained
JSON / plain text; no external calls). The UI composes the draw surface + a
semantic-blocks panel + an **age-adaptive toolbar** (which block kinds are
offered follows ADR-012 capabilities: notes/labels for everyone, flowchart from
Explorer, code/equation from Builder). Autosave + crash recovery via
localStorage; server persistence reuses the Studio pattern later.
**Integration seams (typed, not yet wired):** `linkedTo: {type,id}` links a
canvas to a lesson/project; `blocks` are the units the **Project Graph** will
ingest; `equation`/`flowchart` blocks are what the **Proof Workshop** and
**AI explain** tools will consume. These are contracts now, implementations
later.
**Consequences:** a real, extensible canvas without forking Excalidraw; the
semantic layer is the moat (structured, machine-readable work), and it stays
deterministic and offline-capable. Cost: two layers to keep in sync (blocks +
scene) — handled in one `CanvasDoc` with a single autosave.

## ADR-022 GitHub integration — OAuth, encrypted tokens, dormant until configured
**Context:** learners should reach *real* Git/GitHub (ADR-016). We need repo
connect, selection, branch/commit and revocation — without ever storing a token
in plaintext, and without breaking the app when no GitHub app is configured.
**Decision:**
- **OAuth (web application flow):** `/api/github/connect` redirects to GitHub
  with a signed, single-use `state`; `/api/github/callback` verifies `state`,
  exchanges the code for a token, encrypts it, stores it, and returns the user
  to Studio. Both routes **no-op with a clear "not configured" response** when
  `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` are absent.
- **Encrypted token at rest:** `GitHubConnection` stores the access token as
  **AES-256-GCM** ciphertext (iv‖tag‖ct, base64). The key is derived (scrypt)
  from `GITHUB_TOKEN_ENC_KEY`; tokens are never logged or returned to the client.
- **Abstraction:** a `GitHubClient` wraps the REST API (user, repos, branches,
  create-repo, put-file = commit) behind typed results, so call sites never
  touch fetch details. `putFile` implements the commit workflow via the Contents
  API (reads existing sha, then creates/updates on a branch).
- **Sync states:** `disconnected → connecting → connected → syncing → synced →
  error`, surfaced in the UI; every network path returns a typed ok/err result
  (no throws to the UI). **Revocation** deletes the stored connection and best-
  effort revokes the token at GitHub.
- **Least privilege:** request the narrowest scopes (`repo`, `read:user`); the
  token stays server-side only.
**Consequences:** a complete, testable integration that is **inert until the
owner provides three env values** — `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
and `GITHUB_TOKEN_ENC_KEY`. See `docs/github-integration.md` for setup. No
other internal work remains. **Blocker to enable: those three secrets + a
registered GitHub OAuth app.**

## ADR-023 NexisHub AI Gateway — the single choke point for model calls
**Context:** ADR-018 named a provider-neutral gateway; this is its engine
implementation. Every model call must be routed, retried, safety-filtered,
observed, cost-tracked and — crucially — **degrade to a deterministic fallback**
(ADR-015) so the product never depends on an LLM being up or configured.
**Decision (in `logicland-engine/llm`):**
- **Model registry** (`registry.py`): each model carries provider key, cost
  metadata ($/1k in+out), max tokens, allowed ages, allowed tasks, privacy
  class, eval score and a `fallback` model id. Routing selects the best model
  for a `(task, age)`.
- **Gateway** (`gateway.py`): one `AIGateway.complete(task, messages, age,
  deterministic_fallback)` entry point that (1) routes via the registry,
  (2) enforces a **timeout** and **bounded retries with backoff**, (3) applies
  **usage controls** (a per-key request limiter), (4) runs output through the
  child-safety filter for child-facing tasks, (5) emits **structured
  observability** (model, attempts, latency, estimated cost, outcome), and
  (6) on any failure returns the caller's **deterministic fallback** — so the
  result is always usable. Returns a typed `GatewayResult` (text, model,
  source=model|fallback, latency, attempts, estimated_cost, safe).
- **Health/readiness:** `/gateway/health` reports config + registry state with
  no external calls. Provider stays resolved via ADR-003 `provider.py`.
- **Credentials are NOT required for the architecture:** with no provider
  configured, every call cleanly takes the deterministic fallback path.
**Consequences:** one auditable, testable seam for all AI; providers/models swap
by config; cost and safety are enforced centrally. **Blocker to go live: LLM
provider credentials + choosing production models** (the registry + routing are
ready; only real keys/deploy remain).

## ADR-024 Engine production-readiness — private, hardened, observable
**Context:** the engine owns curriculum, tutoring, generation and the AI Gateway,
but is a **private** service (only the web app's server should reach it) and is
**not** on Vercel. Before it can be exposed it needs auth, abuse controls,
structured observability, readiness signals, fail-fast config and a documented
deploy path — without hardcoding a host.
**Decision (in `logicland-engine`):**
- **Service auth** (`middleware/service_auth.py`): every `/api` request must
  carry a shared secret in `X-Service-Token` (constant-time compared). Probes and
  docs are exempt. Skipped when no token is set (local dev); a missing token in
  production is a **startup error**.
- **Rate limiting** (`middleware/rate_limit.py`): per-client fixed-window limiter
  (honours `X-Forwarded-For`), `429 + Retry-After` on exceed. In-process — a
  multi-instance deploy fronts it with a shared store (documented).
- **Observability** (`middleware/observability.py` + `config/logging.py`):
  per-request correlation id (echoed as `X-Request-ID`), one structured access
  log line (method/path/status/latency); `JSON_LOGS=true` emits JSON for log
  platforms. The gateway's cost/attempt logs ride the same pipeline.
- **Health vs readiness:** `/health` = liveness (cheap); `/ready` = readiness,
  `503` when config is unsound, reporting provider/db/safety checks with no
  external calls.
- **Fail-fast config** (`Settings.production_problems()`): in `production` the
  engine refuses to boot if `DEBUG` is on, `CORS_ORIGINS` is `*`/empty, a non-
  local origin is http, `SERVICE_TOKEN` is missing, or child-safety is off.
  `/docs` is hidden in production.
- **Container + manifests:** non-root Dockerfile with a `HEALTHCHECK`;
  `.dockerignore`; provider-neutral `render.yaml` and `fly.toml` with all secrets
  `sync:false`/`fly secrets`. Runbook: `docs/engine-deployment.md`.
**Consequences:** the engine is safe to expose behind a single shared secret,
resists floods, is debuggable via correlated JSON logs, and self-rejects unsound
production config. **Blocker to go live: choose a deploy host + set the secrets
(`SERVICE_TOKEN`, `CORS_ORIGINS`, `DATABASE_URL`, optional `LLM_*`) and set the
same `SERVICE_TOKEN` in the web app so it sends the header.**
