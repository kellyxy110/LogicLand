# LogicLand Intelligence Engine (FastAPI)

The educational intelligence engine behind LogicLand. This is **not** just an
API — it owns curriculum, tutoring, generation (worksheets/quizzes/flashcards),
weekly reports, certificates, analytics, badges, progress, and gamification.
Next.js owns the user experience and calls into this engine.

## Architecture principles

- **Thin controllers, rich domain.** `api/` only validates + delegates.
- **Provider-agnostic AI.** All LLM access goes through `llm/provider.py`
  (OpenAI-compatible). Providers are configured, never hardcoded.
- **Child-safety at the boundary.** Every child-facing string passes through
  `utils/safety.py` before it leaves the engine.
- **Environment-driven config.** `config/settings.py` (Pydantic Settings).

## Package map

| Package | Responsibility |
|---|---|
| `api/` | FastAPI routers (thin controllers) |
| `curriculum/` | Worlds, missions, the 12-week beginner journey |
| `tutor/` | AI Helper — scaffolded hints, never answers |
| `worksheets/` `quizzes/` `flashcards/` | AI generation of learning material |
| `reports/` `certificates/` | Parent-facing reports and awards |
| `analytics/` `progress/` `badges/` `gamification/` | Learning + game state logic |
| `parents/` `students/` | Audience-specific intelligence |
| `llm/` `prompts/` | Provider abstraction + versioned prompt templates |
| `models/` | Pydantic transport + persistence models |
| `utils/` `config/` `tests/` | Cross-cutting concerns, settings, test suite |

## Quick start (see `scripts/` for one-command setup)

```bash
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env        # then fill in LLM_API_KEY
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

## Development commands

```bash
pytest            # run tests (no LLM key required for smoke tests)
black .           # format
ruff check .      # lint
mypy .            # type-check
```
