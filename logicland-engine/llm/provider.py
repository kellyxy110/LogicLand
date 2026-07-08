"""AI provider abstraction.

The engine talks to LLMs through a single ``LLMProvider`` protocol so that any
OpenAI-compatible backend (OpenAI, Azure OpenAI, local vLLM, OpenRouter, etc.)
can be swapped in via configuration alone. **Providers are never hardcoded.**

Design goals:
    * One narrow interface (``complete`` / ``stream``) the whole engine depends on.
    * Providers resolved from settings at runtime.
    * Child-safety filtering applied at the boundary, not scattered per-feature.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import TYPE_CHECKING, Protocol, cast, runtime_checkable

from config.settings import Settings, get_settings

if TYPE_CHECKING:
    from openai import AsyncOpenAI
    from openai.types.chat import ChatCompletionMessageParam


@dataclass(slots=True)
class Message:
    """A single chat message."""

    role: str  # "system" | "user" | "assistant"
    content: str


@runtime_checkable
class LLMProvider(Protocol):
    """Narrow contract every provider implementation must satisfy."""

    async def complete(self, messages: list[Message], **overrides: object) -> str:
        """Return a single completion for the given conversation."""
        ...

    def stream(
        self, messages: list[Message], **overrides: object
    ) -> AsyncIterator[str]:
        """Yield completion tokens/chunks as they arrive."""


class OpenAICompatibleProvider:
    """Provider for any OpenAI-compatible ``/chat/completions`` endpoint.

    The actual HTTP client is created lazily so the engine can import this module
    without requiring credentials at import time (important for tests and CI).
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        # lazily constructed AsyncOpenAI client
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:  # pragma: no cover - thin adapter
        if self._client is None:
            from openai import AsyncOpenAI

            self._client = AsyncOpenAI(
                api_key=self._settings.llm_api_key or "not-set",
                base_url=self._settings.llm_base_url,
            )
        return self._client

    async def complete(self, messages: list[Message], **overrides: object) -> str:
        client = self._get_client()
        resp = await client.chat.completions.create(
            model=str(overrides.get("model", self._settings.llm_model)),
            temperature=float(
                cast(
                    float, overrides.get("temperature", self._settings.llm_temperature)
                )
            ),
            max_tokens=int(
                cast(int, overrides.get("max_tokens", self._settings.llm_max_tokens))
            ),
            messages=cast(
                "list[ChatCompletionMessageParam]",
                [{"role": m.role, "content": m.content} for m in messages],
            ),
        )
        return resp.choices[0].message.content or ""

    async def stream(
        self, messages: list[Message], **overrides: object
    ) -> AsyncIterator[str]:
        client = self._get_client()
        stream = await client.chat.completions.create(
            model=str(overrides.get("model", self._settings.llm_model)),
            temperature=float(
                cast(
                    float, overrides.get("temperature", self._settings.llm_temperature)
                )
            ),
            max_tokens=int(
                cast(int, overrides.get("max_tokens", self._settings.llm_max_tokens))
            ),
            messages=cast(
                "list[ChatCompletionMessageParam]",
                [{"role": m.role, "content": m.content} for m in messages],
            ),
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta


# Registry maps a provider key -> factory. Extend this to add providers without
# touching call sites. Every entry must be OpenAI-compatible or wrap itself as one.
_PROVIDERS = {
    "openai": OpenAICompatibleProvider,
    "openai-compatible": OpenAICompatibleProvider,
}


def get_provider(settings: Settings | None = None) -> LLMProvider:
    """Resolve the configured provider. Never hardcode call sites to a vendor."""
    settings = settings or get_settings()
    factory = _PROVIDERS.get(settings.llm_provider, OpenAICompatibleProvider)
    return factory(settings)
