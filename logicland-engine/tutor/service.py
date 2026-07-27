"""AI Helper service — scaffolded hints for young coders.

The tutor assists; it never replaces the teacher and never hands over answers.
All output is passed through the child-safety filter before returning.
"""

from __future__ import annotations

import logging

from config.settings import get_settings
from llm.provider import LLMProvider, Message, get_provider
from models.schemas import (
    MathExplainRequest,
    MathExplainResponse,
    TutorAskRequest,
    TutorAskResponse,
)
from prompts.templates import (
    MATH_EXPLAIN_SYSTEM,
    TUTOR_SYSTEM,
    math_explain_user_prompt,
    tutor_user_prompt,
)
from utils.safety import sanitize_for_child

logger = logging.getLogger(__name__)


class TutorService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider or get_provider()
        self._settings = get_settings()

    async def ask(self, req: TutorAskRequest) -> TutorAskResponse:
        messages = [
            Message(role="system", content=TUTOR_SYSTEM),
            Message(
                role="user",
                content=tutor_user_prompt(
                    req.question, req.mission_slug, req.hint_level
                ),
            ),
        ]
        raw = await self._provider.complete(messages)
        answer = (
            sanitize_for_child(raw)
            if self._settings.llm_child_safety_enabled
            else raw.strip()
        )
        return TutorAskResponse(answer=answer, is_hint=True, safe=True)


class MathExplainService:
    """Re-explain a Math Fix problem another way.

    The deterministic Math Fix engine remains the source of truth (ADR-015): the
    correct answer and the misconception are decided before we ever get here, and
    are passed in. This only re-words the *same* method. If no provider is
    configured — or anything goes wrong — we degrade to a deterministic
    restatement of the steps rather than failing, so the feature always works.
    The provider is resolved lazily so a missing key never breaks the fallback.
    """

    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider
        self._settings = get_settings()

    async def explain(self, req: MathExplainRequest) -> MathExplainResponse:
        try:
            provider = self._provider or get_provider()
            messages = [
                Message(role="system", content=MATH_EXPLAIN_SYSTEM),
                Message(
                    role="user",
                    content=math_explain_user_prompt(
                        req.prompt,
                        req.instruction,
                        req.correct_answer,
                        req.misconception_name,
                        req.steps,
                    ),
                ),
            ]
            raw = await provider.complete(messages)
            text = (
                sanitize_for_child(raw)
                if self._settings.llm_child_safety_enabled
                else raw.strip()
            )
            if not text:
                return self._fallback(req)
            return MathExplainResponse(explanation=text, source="ai", safe=True)
        except Exception as exc:  # pragma: no cover - defensive, provider-dependent
            logger.info("math explain fell back to deterministic: %s", exc)
            return self._fallback(req)

    def _fallback(self, req: MathExplainRequest) -> MathExplainResponse:
        if req.steps:
            body = " ".join(req.steps)
            text = (
                f"Here's another way to see it: {body} "
                f"So the answer is {req.correct_answer}. 🌟"
            )
        else:
            text = (
                f"Let's take it one step at a time — the answer is "
                f"{req.correct_answer}. Try each step slowly and check as you go. 🌟"
            )
        return MathExplainResponse(
            explanation=sanitize_for_child(text), source="fallback", safe=True
        )
