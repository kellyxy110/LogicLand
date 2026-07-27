"""Model registry (ADR-023).

A central catalogue of models the gateway may route to. Product code never names
a model directly — it asks the registry for the best model for a (task, age),
and the registry carries the metadata (cost, limits, allowed ages/tasks, privacy
class, eval score, fallback) the gateway needs to route, budget and log.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class ModelInfo:
    id: str
    provider: str  # provider key resolved by llm/provider.py
    # Cost metadata: USD per 1K tokens.
    cost_in_per_1k: float
    cost_out_per_1k: float
    max_tokens: int
    allowed_ages: tuple[str, ...]  # age-mode ids; "*" means all
    allowed_tasks: tuple[str, ...]  # task ids; "*" means all
    privacy_class: str  # "zero-retention" | "standard"
    eval_score: float  # 0..1, our internal quality estimate
    fallback: str | None = None  # id of a cheaper/safer model to try next
    weaknesses: tuple[str, ...] = field(default_factory=tuple)


# The registry. IDs mirror common OpenAI-compatible names; nothing here calls a
# provider — these are routing/metadata records only.
MODEL_REGISTRY: dict[str, ModelInfo] = {
    "gpt-4o-mini": ModelInfo(
        id="gpt-4o-mini",
        provider="openai",
        cost_in_per_1k=0.00015,
        cost_out_per_1k=0.0006,
        max_tokens=800,
        allowed_ages=("*",),
        allowed_tasks=("*",),
        privacy_class="zero-retention",
        eval_score=0.82,
        fallback="deterministic",
        weaknesses=("occasional verbosity",),
    ),
    "gpt-4o": ModelInfo(
        id="gpt-4o",
        provider="openai",
        cost_in_per_1k=0.0025,
        cost_out_per_1k=0.01,
        max_tokens=1200,
        allowed_ages=("developer", "pro"),
        allowed_tasks=("code_review", "agent"),
        privacy_class="zero-retention",
        eval_score=0.9,
        fallback="gpt-4o-mini",
    ),
}

# Which model each task prefers (routing table). Unknown tasks fall to default.
TASK_ROUTES: dict[str, str] = {
    "math_explain": "gpt-4o-mini",
    "tutor_hint": "gpt-4o-mini",
    "code_review": "gpt-4o",
}
DEFAULT_MODEL = "gpt-4o-mini"


def get_model(model_id: str) -> ModelInfo | None:
    return MODEL_REGISTRY.get(model_id)


def _age_ok(model: ModelInfo, age: str | None) -> bool:
    if age is None or "*" in model.allowed_ages:
        return True
    return age in model.allowed_ages


def select_model(task: str, age: str | None = None) -> ModelInfo:
    """Pick the best registered model for a task + age, honouring age limits and
    falling back to the default. Never raises."""
    preferred = TASK_ROUTES.get(task, DEFAULT_MODEL)
    model = MODEL_REGISTRY.get(preferred)
    if model and _age_ok(model, age):
        return model
    # Walk the preferred model's fallback chain until one fits the age.
    seen: set[str] = set()
    cursor = model.fallback if model else DEFAULT_MODEL
    while cursor and cursor in MODEL_REGISTRY and cursor not in seen:
        seen.add(cursor)
        candidate = MODEL_REGISTRY[cursor]
        if _age_ok(candidate, age):
            return candidate
        cursor = candidate.fallback
    return MODEL_REGISTRY[DEFAULT_MODEL]


def estimate_cost(model: ModelInfo, prompt_tokens: int, completion_tokens: int) -> float:
    """Rough USD cost estimate from token counts."""
    return round(
        (prompt_tokens / 1000) * model.cost_in_per_1k
        + (completion_tokens / 1000) * model.cost_out_per_1k,
        6,
    )
