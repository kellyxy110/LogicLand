"""Quiz generation + grading.

LLM-backed multiple-choice questions with a deterministic fallback. Grading is a
pure function so it is testable and reusable by the web tier.
"""

from __future__ import annotations

from config.settings import get_settings
from llm.provider import LLMProvider, Message, get_provider
from models.schemas import GenerateRequest, QuizQuestion, QuizResponse
from prompts.templates import QUIZ_SYSTEM
from utils.jsonx import extract_json
from utils.safety import sanitize_for_child


def _fallback(req: GenerateRequest) -> QuizResponse:
    questions = [
        QuizQuestion(
            question=f"Which one is about {req.skill.lower()}?",
            options=[req.skill, "Bananas", "Rain", "Socks"],
            correct_index=0,
        )
        for _ in range(req.count)
    ]
    return QuizResponse(title=f"{req.skill} Quiz", questions=questions)


def _parse(req: GenerateRequest, raw: str) -> QuizResponse | None:
    data = extract_json(raw)
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        data = data["questions"]
    if not isinstance(data, list):
        return None
    questions: list[QuizQuestion] = []
    for entry in data[: req.count]:
        if not isinstance(entry, dict):
            continue
        opts = entry.get("options")
        idx = entry.get("correct_index")
        if entry.get("question") and isinstance(opts, list) and len(opts) >= 2 and isinstance(idx, int):
            if 0 <= idx < len(opts):
                questions.append(
                    QuizQuestion(
                        question=sanitize_for_child(str(entry["question"])),
                        options=[str(o) for o in opts],
                        correct_index=idx,
                    )
                )
    return QuizResponse(title=f"{req.skill} Quiz", questions=questions) if questions else None


def grade(quiz: QuizResponse, answers: list[int]) -> tuple[int, int]:
    """Return (correct, total) for a list of chosen option indexes."""
    total = len(quiz.questions)
    correct = sum(
        1
        for q, a in zip(quiz.questions, answers)
        if 0 <= a < len(q.options) and a == q.correct_index
    )
    return correct, total


class QuizService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._settings = get_settings()
        self._provider = provider

    async def generate(self, req: GenerateRequest) -> QuizResponse:
        if not self._settings.llm_api_key:
            return _fallback(req)
        provider = self._provider or get_provider()
        prompt = (
            f"Create {req.count} multiple-choice questions for the coding skill "
            f"'{req.skill}' at difficulty {req.difficulty} for children aged 5-10. "
            'Return JSON: [{"question":"...","options":["..."],"correct_index":0}].'
        )
        try:
            raw = await provider.complete(
                [Message("system", QUIZ_SYSTEM), Message("user", prompt)]
            )
        except Exception:
            return _fallback(req)
        return _parse(req, raw) or _fallback(req)
