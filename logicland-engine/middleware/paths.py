"""Which paths bypass service-auth and rate-limiting.

Probes and API docs must always be reachable — a health check that needs a
secret token isn't a health check.
"""

from __future__ import annotations

PUBLIC_PATH_PREFIXES: tuple[str, ...] = (
    "/health",
    "/ready",
    "/docs",
    "/redoc",
    "/openapi.json",
)


def is_public_path(path: str) -> bool:
    """True for liveness/readiness probes, API docs and the root."""
    if path == "/":
        return True
    return any(path == p or path.startswith(p + "/") or path == p for p in PUBLIC_PATH_PREFIXES)
