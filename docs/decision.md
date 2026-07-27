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
