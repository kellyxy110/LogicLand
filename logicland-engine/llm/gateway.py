"""NexisHub AI Gateway (ADR-023).

The single choke point for model calls. Routes via the registry, enforces a
timeout + bounded retries, applies usage controls and child-safety, emits
structured observability, and ALWAYS degrades to a caller-supplied deterministic
fallback (ADR-015) — so a missing/broken provider never breaks a feature.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable
from dataclasses import dataclass

from config.settings import Settings, get_settings
from llm.provider import LLMProvider, Message, get_provider
from llm.registry import ModelInfo, estimate_cost, select_model
from utils.safety import sanitize_for_child

logger = logging.getLogger("logicland.gateway")


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


@dataclass(slots=True)
class GatewayResult:
    text: str
    model: str
    source: str  # "model" | "fallback"
    latency_ms: int
    attempts: int
    estimated_cost: float
    safe: bool
    reason: str | None = None  # why we fell back, when source == "fallback"


class UsageLimiter:
    """A tiny in-memory request limiter (fixed window per key)."""

    def __init__(self, max_requests: int = 60, window_s: float = 60.0) -> None:
        self.max_requests = max_requests
        self.window_s = window_s
        self._hits: dict[str, list[float]] = {}

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        bucket = [t for t in self._hits.get(key, []) if now - t < self.window_s]
        if len(bucket) >= self.max_requests:
            self._hits[key] = bucket
            return False
        bucket.append(now)
        self._hits[key] = bucket
        return True


Fallback = str | Callable[[], str] | None


def _resolve_fallback(fallback: Fallback) -> str:
    if callable(fallback):
        try:
            return fallback()
        except Exception:  # pragma: no cover - defensive
            return ""
    return fallback or ""


class AIGateway:
    def __init__(
        self,
        provider: LLMProvider | None = None,
        settings: Settings | None = None,
        *,
        timeout_s: float = 20.0,
        max_retries: int = 2,
        base_delay: float = 0.25,
        limiter: UsageLimiter | None = None,
    ) -> None:
        # Provider is resolved lazily so a missing key never breaks construction.
        self._provider = provider
        self._settings = settings or get_settings()
        self.timeout_s = timeout_s
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.limiter = limiter or UsageLimiter()

    def _provider_configured(self) -> bool:
        return bool(self._settings.llm_api_key)

    def _finish_fallback(
        self, model: ModelInfo, fallback: Fallback, child_facing: bool, started: float,
        attempts: int, reason: str,
    ) -> GatewayResult:
        raw = _resolve_fallback(fallback)
        text = sanitize_for_child(raw) if (child_facing and self._settings.llm_child_safety_enabled) else raw.strip()
        result = GatewayResult(
            text=text,
            model=model.id,
            source="fallback",
            latency_ms=int((time.monotonic() - started) * 1000),
            attempts=attempts,
            estimated_cost=0.0,
            safe=True,
            reason=reason,
        )
        logger.info(
            "gateway.fallback",
            extra={"model": model.id, "reason": reason, "attempts": attempts, "latency_ms": result.latency_ms},
        )
        return result

    async def complete(
        self,
        task: str,
        messages: list[Message],
        *,
        age: str | None = None,
        deterministic_fallback: Fallback = None,
        child_facing: bool = True,
        usage_key: str = "global",
    ) -> GatewayResult:
        started = time.monotonic()
        model = select_model(task, age)

        # Usage controls.
        if not self.limiter.allow(usage_key):
            return self._finish_fallback(model, deterministic_fallback, child_facing, started, 0, "rate_limited")

        # No provider/credentials, or the route resolves to deterministic-only.
        if not self._provider_configured():
            return self._finish_fallback(model, deterministic_fallback, child_facing, started, 0, "no_provider")

        provider = self._provider or get_provider(self._settings)
        prompt_tokens = sum(_estimate_tokens(m.content) for m in messages)
        attempts = 0
        last_error = "unknown"
        for attempt in range(1, self.max_retries + 2):  # 1 try + max_retries
            attempts = attempt
            try:
                raw = await asyncio.wait_for(
                    provider.complete(messages, model=model.id, max_tokens=model.max_tokens),
                    timeout=self.timeout_s,
                )
                text = (
                    sanitize_for_child(raw)
                    if (child_facing and self._settings.llm_child_safety_enabled)
                    else raw.strip()
                )
                if not text:
                    last_error = "empty_response"
                    raise ValueError(last_error)
                cost = estimate_cost(model, prompt_tokens, _estimate_tokens(raw))
                result = GatewayResult(
                    text=text,
                    model=model.id,
                    source="model",
                    latency_ms=int((time.monotonic() - started) * 1000),
                    attempts=attempts,
                    estimated_cost=cost,
                    safe=True,
                )
                logger.info(
                    "gateway.ok",
                    extra={"model": model.id, "task": task, "attempts": attempts,
                           "latency_ms": result.latency_ms, "estimated_cost": cost},
                )
                return result
            except (asyncio.TimeoutError, Exception) as exc:  # noqa: BLE001 - route everything to fallback
                last_error = "timeout" if isinstance(exc, asyncio.TimeoutError) else str(exc)
                if attempt <= self.max_retries:
                    await asyncio.sleep(self.base_delay * attempt)
                    continue
                break

        return self._finish_fallback(model, deterministic_fallback, child_facing, started, attempts, last_error)


def gateway_health(settings: Settings | None = None) -> dict[str, object]:
    """No-network health/readiness snapshot for /gateway/health."""
    from llm.registry import DEFAULT_MODEL, MODEL_REGISTRY

    s = settings or get_settings()
    return {
        "status": "ok",
        "provider_configured": bool(s.llm_api_key),
        "provider": s.llm_provider,
        "default_model": DEFAULT_MODEL,
        "models": sorted(MODEL_REGISTRY.keys()),
        "child_safety_enabled": s.llm_child_safety_enabled,
    }
