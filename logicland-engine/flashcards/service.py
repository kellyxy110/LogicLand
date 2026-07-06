"""Flashcard generation for reinforcing coding vocabulary."""

from __future__ import annotations

from config.settings import get_settings
from llm.provider import LLMProvider, Message, get_provider
from models.schemas import Flashcard, FlashcardResponse, GenerateRequest
from prompts.templates import FLASHCARD_SYSTEM
from utils.jsonx import extract_json
from utils.safety import sanitize_for_child


def _fallback(req: GenerateRequest) -> FlashcardResponse:
    cards = [
        Flashcard(
            front=f"What do we call {req.skill.lower()}?",
            back=f"{req.skill} — a coding superpower!",
        )
        for _ in range(req.count)
    ]
    return FlashcardResponse(title=f"{req.skill} Cards", cards=cards)


def _parse(req: GenerateRequest, raw: str) -> FlashcardResponse | None:
    data = extract_json(raw)
    if isinstance(data, dict) and isinstance(data.get("cards"), list):
        data = data["cards"]
    if not isinstance(data, list):
        return None
    cards: list[Flashcard] = []
    for entry in data[: req.count]:
        if isinstance(entry, dict) and entry.get("front") and entry.get("back"):
            cards.append(
                Flashcard(
                    front=sanitize_for_child(str(entry["front"])),
                    back=sanitize_for_child(str(entry["back"])),
                )
            )
    return FlashcardResponse(title=f"{req.skill} Cards", cards=cards) if cards else None


class FlashcardService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._settings = get_settings()
        self._provider = provider

    async def generate(self, req: GenerateRequest) -> FlashcardResponse:
        if not self._settings.llm_api_key:
            return _fallback(req)
        provider = self._provider or get_provider()
        prompt = (
            f"Create {req.count} flashcards for the coding skill '{req.skill}' "
            "for children aged 5-10. Return JSON: "
            '[{"front":"...","back":"..."}].'
        )
        try:
            raw = await provider.complete(
                [Message("system", FLASHCARD_SYSTEM), Message("user", prompt)]
            )
        except Exception:
            return _fallback(req)
        return _parse(req, raw) or _fallback(req)
