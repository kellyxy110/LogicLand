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


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
