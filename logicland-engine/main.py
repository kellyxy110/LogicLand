"""LogicLand Intelligence Engine — FastAPI application entrypoint.

This is the educational intelligence engine, not merely an API. Next.js owns the
user experience; this service owns curriculum, tutoring, generation, reporting,
analytics, and gamification logic.

Run locally:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import ALL_ROUTERS
from config.logging import setup_logging
from config.settings import get_settings
from middleware import (
    RateLimitMiddleware,
    RequestContextMiddleware,
    ServiceAuthMiddleware,
)

settings = get_settings()

setup_logging(settings.log_level, settings.json_logs)
logger = logging.getLogger("logicland")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Fail fast: never serve half-configured in production (ADR-024).
    problems = settings.production_problems()
    if problems:
        for problem in problems:
            logger.error("config.invalid", extra={"problem": problem})
        raise RuntimeError(
            "Engine misconfigured for production: " + "; ".join(problems)
        )
    logger.info(
        "startup",
        extra={
            "app": settings.app_name,
            "environment": settings.environment,
            "service_auth": bool(settings.service_auth_enabled and settings.service_token),
            "rate_limit": settings.rate_limit_enabled,
            "provider_configured": bool(settings.llm_api_key),
        },
    )
    yield
    logger.info("shutdown", extra={"app": settings.app_name})


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="The educational intelligence engine behind LogicLand.",
    lifespan=lifespan,
    # Hide interactive docs in production (the engine is not a public API).
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None if settings.environment == "production" else "/redoc",
)

# Middleware is added inner-most first; the LAST added runs OUTERMOST. Desired
# per-request order: RequestContext -> CORS -> RateLimit -> ServiceAuth -> app.
app.add_middleware(ServiceAuthMiddleware, settings=settings)
app.add_middleware(RateLimitMiddleware, settings=settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Liveness: the process is up and serving. Cheap, never touches deps."""
    return {"status": "ok", "service": settings.app_name, "env": settings.environment}


@app.get("/ready", tags=["system"])
async def ready() -> JSONResponse:
    """Readiness: safe to receive traffic. 503 if config is unsound.

    Reports component readiness without making any external calls, so it is safe
    to poll from an orchestrator or load balancer.
    """
    problems = settings.production_problems()
    ok = not problems
    body: dict[str, object] = {
        "status": "ready" if ok else "degraded",
        "environment": settings.environment,
        "checks": {
            "config": "ok" if ok else problems,
            "database_url_configured": bool(settings.database_url),
            "provider_configured": bool(settings.llm_api_key),
            "child_safety_enabled": settings.llm_child_safety_enabled,
        },
    }
    return JSONResponse(body, status_code=200 if ok else 503)


for router in ALL_ROUTERS:
    app.include_router(router, prefix=settings.api_prefix)
