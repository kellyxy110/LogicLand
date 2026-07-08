"""AI Helper service — scaffolded hints for young coders.

The tutor assists; it never replaces the teacher and never hands over answers.
All output is passed through the child-safety filter before returning.
"""

from __future__ import annotations

from config.settings import get_settings
from llm.provider import LLMProvider, Message, get_provider
from models.schemas import TutorAskRequest, TutorAskResponse
from prompts.templates import TUTOR_SYSTEM, tutor_user_prompt
from utils.safety import sanitize_for_child


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
