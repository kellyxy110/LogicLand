"""Application settings loaded from the environment.

All configuration is environment-driven. No secrets are ever committed.
See ``.env.example`` for the full list of supported variables.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Core ---
    app_name: str = "LogicLand Engine"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # --- API ---
    api_prefix: str = "/api"
    # Comma-separated list of allowed origins for the Next.js frontend.
    cors_origins: str = "http://localhost:3000"

    # --- Service auth (Next.js server <-> engine shared secret, ADR-024) ---
    # The frontend's server calls the engine with this token in X-Service-Token.
    # Enforcement is skipped when the token is empty (local dev); in production a
    # missing token is a startup error (see production_problems()).
    service_auth_enabled: bool = True
    service_token: str = Field(
        default="", description="Shared secret required in the X-Service-Token header for /api routes."
    )

    # --- Rate limiting (per-client fixed window, ADR-024) ---
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 120
    rate_limit_window_s: int = 60

    # --- Observability ---
    # Emit one structured JSON log line per request (recommended in production).
    json_logs: bool = False

    # --- Database (engine-owned analytics / derived data) ---
    database_url: str = Field(
        default="postgresql+asyncpg://logicland:logicland@localhost:5432/logicland",
        description="Async SQLAlchemy connection string.",
    )

    # --- AI provider abstraction (OpenAI-compatible) ---
    # Providers are NEVER hardcoded. Point these at any OpenAI-compatible endpoint.
    llm_provider: str = "openai"
    llm_api_key: str = Field(default="", description="API key for the active provider.")
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 1200
    # Hard safety switch: when true, all generated child-facing text is passed
    # through the content safety filter before it leaves the engine.
    llm_child_safety_enabled: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def production_problems(self) -> list[str]:
        """Return a list of misconfigurations that must block a production boot.

        Empty in non-production. The engine calls this at startup and refuses to
        serve if anything is returned — fail fast, never half-configured.
        """
        problems: list[str] = []
        if self.environment != "production":
            return problems
        if self.debug:
            problems.append("DEBUG must be false in production.")
        origins = self.cors_origin_list
        if not origins or "*" in origins:
            problems.append("CORS_ORIGINS must be an explicit allow-list (never '*') in production.")
        if any(o.startswith("http://") and "localhost" not in o and "127.0.0.1" not in o for o in origins):
            problems.append("CORS_ORIGINS must use https for non-local origins in production.")
        if self.service_auth_enabled and not self.service_token:
            problems.append("SERVICE_TOKEN must be set when service auth is enabled in production.")
        if not self.llm_child_safety_enabled:
            problems.append("LLM_CHILD_SAFETY_ENABLED must stay true in production.")
        return problems


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
