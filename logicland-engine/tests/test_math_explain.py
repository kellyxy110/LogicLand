"""Tests for the Math Fix 'explain another way' endpoint.

We inject a fake provider so no network or API key is needed: the model path,
the deterministic fallback, and the child-safety boundary are all exercised
offline. Async services are driven with ``asyncio.run`` (the repo has no
pytest-asyncio plugin).
"""

from __future__ import annotations

import asyncio

from fastapi.testclient import TestClient

from main import app
from models.schemas import MathExplainRequest
from tutor.service import MathExplainService


class FakeProvider:
    """Structurally satisfies llm.provider.LLMProvider without any network."""

    def __init__(self, text: str = "", raises: bool = False) -> None:
        self._text = text
        self._raises = raises

    async def complete(self, messages: object, **overrides: object) -> str:
        _ = (messages, overrides)
        if self._raises:
            raise RuntimeError("no provider configured")
        return self._text

    async def stream(self, messages: object, **overrides: object):  # type: ignore[no-untyped-def]
        _ = (messages, overrides)
        yield self._text


def _req() -> MathExplainRequest:
    return MathExplainRequest(
        topic="percentages-of-amount",
        prompt="20% of 60",
        instruction="Work it out",
        correct_answer="12",
        student_answer="1200",
        misconception_name="Forgot to divide by 100",
        steps=["20% means 20 out of every 100.", "60 x 20 / 100 = 12."],
    )


def test_uses_model_when_available() -> None:
    svc = MathExplainService(
        provider=FakeProvider(text="Split 60 into 100 tiny parts, then take 20.")
    )
    resp = asyncio.run(svc.explain(_req()))
    assert resp.source == "ai"
    assert resp.safe is True
    assert len(resp.explanation) > 0


def test_falls_back_when_provider_errors() -> None:
    svc = MathExplainService(provider=FakeProvider(raises=True))
    resp = asyncio.run(svc.explain(_req()))
    assert resp.source == "fallback"
    # The correct answer is never lost, even on the fallback path.
    assert "12" in resp.explanation


def test_unsafe_model_output_is_sanitized() -> None:
    svc = MathExplainService(provider=FakeProvider(text="you are stupid"))
    resp = asyncio.run(svc.explain(_req()))
    assert resp.safe is True
    assert "stupid" not in resp.explanation.lower()


def test_explain_route_is_registered() -> None:
    client = TestClient(app)
    schema = client.get("/openapi.json").json()
    assert "/api/math-fix/explain" in schema["paths"]
