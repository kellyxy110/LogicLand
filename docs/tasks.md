# LogicLand — Transformation Task Plan

> Execution backlog for the "first instruction → real engineer" transformation.
> Decisions behind it: [`docs/decision.md`](decision.md) ADR-010…019.
> Rule that governs every task: **maintain the existing architecture; do not
> break shipped systems.** New surfaces layer on; they don't replace.

**Status legend:** ✅ done · 🟡 in progress · ⬜ not started · 🔬 spike/decide first

The three permanent foundations (ADR-010) — **Programming**, **Mathematics**,
**AI** — order everything below. The four environments (ADR-011) — **Academy /
Studio / Lab / Arena** — are the surfaces we build them into.

---

## Phase 0 — Already shipped (the base we build on)

- ✅ Monorepo, Next.js `apps/web`, FastAPI `logicland-engine`, Prisma/Neon, Clerk.
- ✅ **Academy environment** live: World → Mission → Level engine, config-driven
  games (`MissionRunner` on `gameData.kind`), dual-write progress.
- ✅ **Coding Academy** live (`/worlds`); **Typing Town** complete (4 games).
- ✅ Academy catalog + `/academies` hub (honest live/soon), `AppHeader` nav.
- ✅ **Math Fix™** flagship: deterministic misconception engine, topic registry,
  3 live topics, DB-persisted mastery, parent/teacher dashboards. *This is the
  ADR-015 pattern proven at small scale — generalise it.*

**Re-grouping task**
- ⬜ Reframe the `/academies` catalog under the three foundations (Programming /
  Mathematics / AI as primary rails; other academies as branches). Data-only
  change to `data/academies.ts` + hub layout; no engine change.

---

## Phase 1 — The foundation: Studio, Skill Graph, Age modes, MathLab

Goal: a real IDE, a mastery spine, age-adaptive presentation, and MathLab roots.

### 1A. LogicLand Studio v1 (browser IDE) — ADR-013
- ✅ Spike: Monaco integrated in Next.js App Router — lazy-loaded + code-split
  (dynamic import, ssr:false), confined to `/studio`; First Load 95.6 kB, so the
  editor chunk never enters young-learner bundles. (`@monaco-editor/react`)
- 🟡 Multi-file project model: in-memory files + tabs, localStorage-persisted
  (`useStudioProject`). ⬜ Still to do: Prisma `Project`/`ProjectFile` so a
  project survives across devices; folders in the explorer (flat for now).
- 🟡 Editor essentials: Monaco gives highlight/completion/bracket-match/find &
  replace/command palette/theme out of the box. ⬜ Still: font controls,
  explicit distraction-free + screen-reader passes.
- 🟡 Panels: output console ✅ (bridged from the sandbox). ⬜ problems panel,
  README/instructions pane.
- ⬜ Project templates (`web-app`, `python-project`) with real folder structure
  (today: one `web-app` starter — index.html + style.css + script.js).

### 1B. Execution runtime v1 (browser-first) — ADR-014
- ✅ Browser web lane: HTML/CSS/JS assembled into one document
  (`buildRunnableDoc`) and run in a sandboxed `allow-scripts` iframe; console.*
  and errors bridged back via postMessage. Deterministic + unit-tested.
- ⬜ Pyodide (Python) in-browser; WebContainers (Node) — next runtimes.
- ⬜ Runtime-selection layer (`chooseRuntime(project)`) once >1 runtime exists.
- ⬜ Defer cloud sandbox to Phase 2 (Vercel Sandbox); leave the seam.

### 1C. Deterministic evaluation engine — ADR-015
- ⬜ Generalise Math Fix's pattern into a shared `evaluation/` contract:
  a Task exposes checks (unit tests / output match / static rubric) →
  `{ passed, dimensions, feedback }`.
- ⬜ Test runner panel in Studio (browser test execution first).
- ⬜ Multi-dimension scoring scaffold (correctness first; readability/efficiency/
  coverage unlock later) — dims stored, mostly hidden for beginners.

### 1D. Skill graph — ADR-011/017 spine
- 🔬 Design the concept dependency graph (start: Programming foundation —
  variables → loops → functions → state → objects; plus Math Fix topics).
- ⬜ Prisma `Skill`, `SkillEdge`, `SkillEvidence` (evidence from submissions,
  debugging, tests, projects, quizzes, competitions — not lesson views).
- ⬜ `masteryFor(student, skill)` aggregator; reuse `MathMastery` as first
  evidence source.
- ⬜ Surface: skill-tree view (Academy) + student-facing progress on `/student`.

### 1E. Age-adaptive presentation — ADR-012
- ⬜ `ageBracket` on the learner profile (Sprouts 4–6 … Professional).
- ⬜ `ageMode` provider driving vocabulary, theme, cognitive load, tool access.
- ⬜ Progressive-vocabulary map ("Save Point"↔commit) as data, real term visible.
- ⬜ Apply to existing surfaces without regressions (default = current behaviour).

### 1F. MathLab foundations — Mathematics foundation
- ⬜ Reframe Math Fix as **Mathematics Academy** within MathLab; keep engine.
- ⬜ More integer-answer Math Fix topics (percentages, negatives, simultaneous)
  — reuse existing UI + registry (fast wins, deploy each).
- ⬜ Math-to-code bridge stub: each topic answers *mean / visualise / solve /
  implement* (implement = a tiny Studio/Lab snippet).
- 🔬 Proof Workshop concept spike (structural/symbolic checker; AI explains only).

---

## Phase 2 — Make it a development platform

Goal: real workflows — Git, debugging, tests, cloud runtimes, deploy, portfolios.

- ⬜ **`logic` CLI** in Studio (ADR-016): `help/start/run/check/hint/new/open/
  test/build/preview`, safe command allow-list per age/runtime.
- ⬜ **Git teaching layer**: `logic git save/status/history/branch/switch/merge`
  each printing the real git command; then graduate to raw git.
- ⬜ **GitHub integration**: connect account, repo, branch, PR, review, publish
  portfolio (young-learner vocabulary over real nouns).
- ⬜ **Cloud execution** (ADR-014): Vercel Sandbox for heavy Python/Java/C/C++/
  Go/Rust/Docker/DB; short-lived, quota-gated, monitored.
- ⬜ **Debugging tools**: Code Lens (runtime variable/loop/stack tracing via
  instrumentation, *not* LLM), time-travel stepper, three-layer error anatomy.
- ⬜ **Package manager + preview** (browser preview, dependency viewer).
- ⬜ **Deployment panel** (learner ships a project to a real URL).
- ⬜ **Long-lived projects** (ADR: ownership): a project evolves over time; the
  "project operating system" (brief, acceptance criteria, issues, git history,
  tests, reflection, portfolio page).
- ⬜ **Portfolios**: public learner portfolio pages from real projects.

---

## Phase 3 — AI learning infrastructure

Goal: AI as infrastructure, subject, and building material — safely.

- ⬜ **NexisHub AI Gateway** (ADR-018): route every model call; cost/age/safety/
  rate/cache/logging/fallback/schema/evals. Extends `llm/provider.py`.
- ⬜ **Model registry**: capabilities, cost, latency, allowed ages/tasks, privacy
  class, eval score, weaknesses, fallback — product code never calls raw models.
- ⬜ **Age-scoped AI safety**: constrained intents for young learners, teacher-
  visible history, parent controls (extends `utils/safety.py`).
- ⬜ **Graduated AI permissions** (ADR-017): 7 stages keyed to skill-graph
  mastery, enforced at the gateway.
- ⬜ **AI trace panel**: input, model, tools, sources, output, confidence, eval,
  cost, latency, safety checks — demystify AI.
- ⬜ **Prompt Laboratory**: task → prompt versions → test set → compare → select.
- ⬜ **AI as a subject**: curriculum (models, data, training, embeddings,
  transformers, agents, eval, bias, safety, limits).
- ⬜ **AI Workshop**: block-based AI apps (input→prep→model→prompt→tool→memory→
  eval→output) → classifiers, retrieval, tool-using assistants.
- ⬜ **Agent Laboratory**: agents *after* deterministic-workflow understanding;
  visually distinguish fixed workflow / model decision / tool / human approval.

---

## Phase 4 — The competitive network (Arena)

Goal: challenge, recognition, community, certification.

- ⬜ **Coding Arena**: contests, debugging battles, algorithm races, timed.
- ⬜ **Olympiad Arena** (Mathematics): age divisions, leagues, rankings, proofs,
  adaptive practice, coach dashboards.
- ⬜ **School leagues** + team missions + pair-programming tournaments.
- ⬜ **Hackathons / AI challenges / project showcases / CTF (security) basics.**
- ⬜ **DevGuild**: fictional/real project teams, roles, tickets, PRs, reviews,
  release notes — controlled software-company simulation.
- ⬜ **Certification** (deterministic + human-moderated; AI never judges).
- ⬜ **Mentor feedback + open-source contribution events.**

---

## Cross-cutting (every phase)

- ⬜ Accessibility first (keyboard, screen reader, distraction-free) on all
  new surfaces — Studio especially.
- ⬜ Performance budget: Monaco/WebContainers lazy-loaded, code-split, never in
  young-learner bundles.
- ⬜ Telemetry as the intelligence layer (ADR-015 moat): capture *how* learners
  debug/decompose/recover and recurring misconceptions — not chat logs.
- ⬜ Safety boundary (`utils/safety.py`) covers every new child-facing AI string.
- ⬜ Docs kept honest: `data/academies.ts` live/soon flags always match reality.

---

## Immediate next steps (proposed order)

1. **Re-group the catalog** under the three foundations (Phase 0 task) — small,
   honest, ships today.
2. **Studio Monaco spike + `/studio` shell** (1A) — the single highest-leverage
   unlock; everything downstream needs it.
3. **Skill-graph schema** (1D) seeded from Math Fix + first Programming skills —
   the mastery spine that gates AI (ADR-017) and drives recommendations.
4. In parallel (low-risk, deploy-each): **more Math Fix topics** (1F) and the
   **student-facing mastery view** on `/student`.

> Sequencing principle: prove each layer thin and vertical (one topic, one
> language, one runtime) before widening — exactly how Math Fix was built.
