"""Production-readiness tests (ADR-024): env validation, health/readiness,
service auth, rate limiting and request-id propagation. No network, no LLM key.

Middleware is exercised on tiny isolated apps so each test can inject its own
Settings, independent of the process-wide cached settings."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from config.settings import Settings
from main import app as main_app
from middleware import (
    RateLimitMiddleware,
    RequestContextMiddleware,
    ServiceAuthMiddleware,
)


def _tiny_app(mw: type, settings: Settings | None = None) -> FastAPI:
    app = FastAPI()

    @app.get("/api/ping")
    async def ping() -> dict[str, bool]:  # noqa: ANN202
        return {"ok": True}

    @app.get("/health")
    async def health() -> dict[str, str]:  # noqa: ANN202
        return {"status": "ok"}

    if settings is not None:
        app.add_middleware(mw, settings=settings)
    else:
        app.add_middleware(mw)
    return app


# --- Env validation (fail-fast) ---


def test_production_problems_flags_misconfig() -> None:
    s = Settings(
        environment="production",
        debug=True,
        cors_origins="*",
        service_token="",
        service_auth_enabled=True,
    )
    problems = s.production_problems()
    assert any("DEBUG" in p for p in problems)
    assert any("CORS_ORIGINS" in p for p in problems)
    assert any("SERVICE_TOKEN" in p for p in problems)


def test_production_ok_config_has_no_problems() -> None:
    s = Settings(
        environment="production",
        debug=False,
        cors_origins="https://app.logicland.example",
        service_token="a-very-long-shared-secret",
        service_auth_enabled=True,
    )
    assert s.production_problems() == []


def test_development_never_has_problems() -> None:
    assert Settings(environment="development", debug=True, cors_origins="*").production_problems() == []


# --- Health / readiness on the real app ---


def test_health_and_ready() -> None:
    c = TestClient(main_app)
    assert c.get("/health").status_code == 200
    r = c.get("/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ready"


# --- Service auth ---


def test_service_auth_blocks_without_token() -> None:
    s = Settings(service_token="secret", service_auth_enabled=True)
    c = TestClient(_tiny_app(ServiceAuthMiddleware, s))
    assert c.get("/api/ping").status_code == 401
    assert c.get("/api/ping", headers={"X-Service-Token": "secret"}).status_code == 200
    assert c.get("/api/ping", headers={"X-Service-Token": "wrong"}).status_code == 401
    # Probes are always public.
    assert c.get("/health").status_code == 200


def test_service_auth_open_when_no_token_configured() -> None:
    s = Settings(service_token="", service_auth_enabled=True)
    c = TestClient(_tiny_app(ServiceAuthMiddleware, s))
    assert c.get("/api/ping").status_code == 200


# --- Rate limiting ---


def test_rate_limit_returns_429_after_budget() -> None:
    s = Settings(rate_limit_enabled=True, rate_limit_requests=3, rate_limit_window_s=60)
    c = TestClient(_tiny_app(RateLimitMiddleware, s))
    for _ in range(3):
        assert c.get("/api/ping").status_code == 200
    blocked = c.get("/api/ping")
    assert blocked.status_code == 429
    assert blocked.headers.get("Retry-After")
    # Probes bypass the limiter entirely.
    assert c.get("/health").status_code == 200


# --- Observability ---


def test_request_id_header_present_and_echoed() -> None:
    app = FastAPI()

    @app.get("/api/ping")
    async def ping() -> dict[str, bool]:  # noqa: ANN202
        return {"ok": True}

    app.add_middleware(RequestContextMiddleware)
    c = TestClient(app)
    assert c.get("/api/ping").headers.get("X-Request-ID")
    echoed = c.get("/api/ping", headers={"X-Request-ID": "corr-123"})
    assert echoed.headers.get("X-Request-ID") == "corr-123"
