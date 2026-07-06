# LogicLand — Tech Stack & Justification

| Layer | Choice | Why |
|---|---|---|
| Monorepo | pnpm + Turborepo | fast installs, cached task graph, shared packages |
| Frontend | Next.js (App Router) + React + TS | premium UX, RSC, Server Actions, strict types |
| Styling | Tailwind CSS + Shadcn UI | design-token driven, accessible, fast to build |
| Motion | Framer Motion | delightful, controllable animation |
| Icons | Lucide | consistent, friendly, tree-shakeable |
| Forms | React Hook Form + Zod | typed, validated, ergonomic |
| Auth | Clerk | secure, role-aware, low custom code |
| DB | PostgreSQL + Prisma | integrity, migrations, typed client |
| Engine | FastAPI (Python 3.12) | best home for pedagogy, prompts, analytics |
| AI | OpenAI-compatible abstraction | provider-agnostic, no lock-in |
| Quality (py) | Black, Ruff, mypy(strict), Pytest | consistent, safe Python |
| Quality (ts) | ESLint, tsc strict, Prettier | consistent, safe TypeScript |
| DevOps | Docker Compose + GitHub Actions | reproducible dev + CI |

**Principles:** type everything; no secrets in code; storage & AI abstracted;
frontend never calls an LLM directly.
