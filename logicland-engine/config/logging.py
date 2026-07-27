"""Structured logging setup (ADR-024).

Two modes, one switch (`JSON_LOGS`):
* development -> a readable single-line human formatter;
* production  -> one JSON object per line, so a log platform can index request
  id, path, status, latency and cost without regex-scraping.

Both routes carry the same extra fields, so nothing is lost switching modes.
"""

from __future__ import annotations

import json
import logging
import sys

# Attributes present on every LogRecord — everything else is a caller `extra`.
_RESERVED = set(
    logging.LogRecord("", 0, "", 0, "", (), None).__dict__.keys()
) | {"message", "asctime", "taskName"}


class JsonFormatter(logging.Formatter):
    """Serialise a log record (plus any structured `extra` fields) as JSON."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in _RESERVED and not key.startswith("_"):
                payload[key] = value
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def setup_logging(level: str, json_logs: bool) -> None:
    """Configure the root logger once, at process startup."""
    handler = logging.StreamHandler(sys.stdout)
    if json_logs:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s :: %(message)s")
        )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.upper())
