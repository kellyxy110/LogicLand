"""Production middleware for the intelligence engine (ADR-024).

Ordering matters. In ``main`` they are added so that, per request, the outermost
wrapper is observability (times + tags EVERYTHING), then CORS, then the rate
limiter, then service auth, then the app:

    RequestContext -> CORS -> RateLimit -> ServiceAuth -> app
"""

from __future__ import annotations

from middleware.observability import RequestContextMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.service_auth import ServiceAuthMiddleware

__all__ = [
    "RequestContextMiddleware",
    "RateLimitMiddleware",
    "ServiceAuthMiddleware",
]
