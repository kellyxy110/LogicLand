"""Worksheet generation.

Tries the LLM for playful, skill-aligned worksheet items; falls back to
deterministic items when there is no provider/key or the model output can't be
parsed. All prompts and text are child-safe.
"""

from __future__ import annotations

from config.settings import get_settings
from llm.provider import LLMProvider, Message, get_provider
from models.schemas import GenerateRequest, WorksheetItem, WorksheetResponse
from prompts.templates import WORKSHEET_SYSTEM
from utils.jsonx import extract_json
from utils.safety import sanitize_for_child


def _fallback(req: GenerateRequest) -> WorksheetResponse:
    """Deterministic, always-safe worksheet used when the LLM is unavailable."""
    items = [
        WorksheetItem(
            prompt=f"Practice {req.skill.lower()}: draw or trace step {i + 1} of the plan.",
            answer=None,
        )
        for i in range(req.count)
    ]
    return WorksheetResponse(title=f"{req.skill} Practice", items=items)


def _parse(req: GenerateRequest, raw: str) -> WorksheetResponse | None:
    data = extract_json(raw)
    if not isinstance(data, list):
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            data = data["items"]
        else:
            return None
    items: list[WorksheetItem] = []
    for entry in data[: req.count]:
        if isinstance(entry, dict) and entry.get("prompt"):
            items.append(
                WorksheetItem(
                    prompt=sanitize_for_child(str(entry["prompt"])),
                    answer=(str(entry["answer"]) if entry.get("answer") else None),
                )
            )
    return WorksheetResponse(title=f"{req.skill} Practice", items=items) if items else None


class WorksheetService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._settings = get_settings()
        self._provider = provider

    async def generate(self, req: GenerateRequest) -> WorksheetResponse:
        if not self._settings.llm_api_key:
            return _fallback(req)
        provider = self._provider or get_provider()
        prompt = (
            f"Create {req.count} worksheet items for the coding skill "
            f"'{req.skill}' at difficulty {req.difficulty} for children aged 5-10. "
            'Return JSON: [{"prompt": "...", "answer": "..."}].'
        )
        try:
            raw = await provider.complete(
                [Message("system", WORKSHEET_SYSTEM), Message("user", prompt)]
            )
        except Exception:
            return _fallback(req)
        return _parse(req, raw) or _fallback(req)
