"""Service-to-service auth (ADR-024).

The engine is not a public API — only the LogicLand frontend's server should
reach it. Every ``/api`` request must carry a shared secret in
``X-Service-Token``. Public probes/docs are exempt. When no token is configured
(local dev) enforcement is skipped; in production a missing token is caught at
startup by ``Settings.production_problems()``, so this never silently opens up.
"""

from __future__ import annotations

import hmac
import logging

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from config.settings import Settings, get_settings
from middleware.paths import is_public_path

logger = logging.getLogger("logicland.auth")

SERVICE_TOKEN_HEADER = "X-Service-Token"


class ServiceAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, settings: Settings | None = None) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._settings = settings or get_settings()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        s = self._settings
        # Skipped for dev (no token), disabled config, CORS preflight, or probes.
        if (
            not s.service_auth_enabled
            or not s.service_token
            or request.method == "OPTIONS"
            or is_public_path(request.url.path)
        ):
            return await call_next(request)

        provided = request.headers.get(SERVICE_TOKEN_HEADER, "")
        if not provided or not hmac.compare_digest(provided, s.service_token):
            request_id = getattr(request.state, "request_id", None)
            logger.warning(
                "service_auth.denied",
                extra={"path": request.url.path, "request_id": request_id},
            )
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)
        return await call_next(request)
