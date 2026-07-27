"""AI Gateway tests (ADR-023). No network: a fake provider is injected, and the
provider-configured flag is controlled via a Settings override."""

from __future__ import annotations

import asyncio

from config.settings import Settings
from llm.gateway import AIGateway, UsageLimiter, gateway_health
from llm.provider import Message
from llm.registry import estimate_cost, select_model


def _settings(configured: bool = True) -> Settings:
    return Settings(llm_api_key="test-key" if configured else "", llm_child_safety_enabled=True)


class FakeProvider:
    def __init__(self, text: str = "", raises: bool = False) -> None:
        self._text = text
        self._raises = raises
        self.calls = 0

    async def complete(self, messages, **overrides):  # noqa: ANN001, ANN003
        self.calls += 1
        if self._raises:
            raise RuntimeError("provider down")
        return self._text

    async def stream(self, messages, **overrides):  # noqa: ANN001, ANN003
        yield self._text


MSGS = [Message(role="user", content="Explain 20% of 60 another way.")]


def test_routing_respects_task_and_age():
    assert select_model("math_explain").id == "llama-3.3-70b-versatile"
    assert select_model("code_review", "pro").id == "openai/gpt-oss-120b"
    # A young learner can't use the pro-only model; routing falls back down the
    # fallback chain to the first age-appropriate model.
    assert select_model("code_review", "sprout").id == "llama-3.3-70b-versatile"


def test_cost_estimate_positive():
    m = select_model("math_explain")
    assert estimate_cost(m, 1000, 1000) > 0


def test_uses_model_when_provider_configured():
    gw = AIGateway(provider=FakeProvider(text="Here is another way."), settings=_settings(), base_delay=0)
    res = asyncio.run(gw.complete("math_explain", MSGS, deterministic_fallback="fallback text"))
    assert res.source == "model"
    assert "another way" in res.text.lower()
    assert res.estimated_cost > 0


def test_retries_then_deterministic_fallback():
    fake = FakeProvider(raises=True)
    gw = AIGateway(provider=fake, settings=_settings(), base_delay=0, max_retries=2)
    res = asyncio.run(gw.complete("math_explain", MSGS, deterministic_fallback="the answer is 12"))
    assert res.source == "fallback"
    assert res.attempts == 3  # 1 try + 2 retries
    assert "12" in res.text


def test_no_provider_takes_fallback_immediately():
    gw = AIGateway(provider=FakeProvider(text="x"), settings=_settings(configured=False), base_delay=0)
    res = asyncio.run(gw.complete("math_explain", MSGS, deterministic_fallback="det"))
    assert res.source == "fallback"
    assert res.reason == "no_provider"


def test_child_safety_sanitizes_model_output():
    gw = AIGateway(provider=FakeProvider(text="you are stupid"), settings=_settings(), base_delay=0)
    res = asyncio.run(gw.complete("math_explain", MSGS, deterministic_fallback="det", child_facing=True))
    assert res.safe is True
    assert "stupid" not in res.text.lower()


def test_usage_limiter_blocks_then_falls_back():
    gw = AIGateway(
        provider=FakeProvider(text="ok"),
        settings=_settings(),
        base_delay=0,
        limiter=UsageLimiter(max_requests=1, window_s=60),
    )
    first = asyncio.run(gw.complete("math_explain", MSGS, deterministic_fallback="det", usage_key="u1"))
    second = asyncio.run(gw.complete("math_explain", MSGS, deterministic_fallback="det", usage_key="u1"))
    assert first.source == "model"
    assert second.source == "fallback"
    assert second.reason == "rate_limited"


def test_health_snapshot():
    h = gateway_health(_settings(configured=False))
    assert h["provider_configured"] is False
    assert "llama-3.1-8b-instant" in h["models"]  # type: ignore[operator]
