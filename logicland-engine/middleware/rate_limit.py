"""Per-client rate limiting (ADR-024).

A dependency-free, in-process fixed-window limiter keyed by client IP (honouring
``X-Forwarded-For`` behind a proxy). Enough to blunt accidental floods and abuse
of the AI endpoints; a multi-instance deployment should front this with a shared
limiter (e.g. Redis) — noted in the runbook. Public probes are never limited.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from config.settings import Settings, get_settings
from middleware.paths import is_public_path

logger = logging.getLogger("logicland.ratelimit")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, settings: Settings | None = None) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._settings = settings or get_settings()
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def _client_key(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        s = self._settings
        if (
            not s.rate_limit_enabled
            or request.method == "OPTIONS"
            or is_public_path(request.url.path)
        ):
            return await call_next(request)

        now = time.monotonic()
        window = float(s.rate_limit_window_s)
        key = self._client_key(request)
        bucket = self._hits[key]
        while bucket and now - bucket[0] >= window:
            bucket.popleft()

        if len(bucket) >= s.rate_limit_requests:
            retry_after = int(window - (now - bucket[0])) + 1
            logger.warning(
                "ratelimit.exceeded",
                extra={"client": key, "path": request.url.path},
            )
            return JSONResponse(
                {"detail": "Rate limit exceeded. Please slow down."},
                status_code=429,
                headers={"Retry-After": str(retry_after)},
            )

        bucket.append(now)
        return await call_next(request)
