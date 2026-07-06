"""Tolerant JSON extraction for LLM output.

Models sometimes wrap JSON in prose or ```json fences. ``extract_json`` finds and
parses the first JSON object/array in a string, returning ``None`` on failure so
callers can fall back to deterministic content rather than raising.
"""

from __future__ import annotations

import json
from typing import Any


def extract_json(text: str) -> Any | None:
    if not text:
        return None
    # Strip common markdown fences.
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        # drop a leading language tag like "json\n"
        if "\n" in cleaned:
            cleaned = cleaned.split("\n", 1)[1]

    # Fast path.
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Scan for the first balanced {...} or [...] region.
    for opener, closer in (("{", "}"), ("[", "]")):
        start = cleaned.find(opener)
        if start == -1:
            continue
        depth = 0
        for i in range(start, len(cleaned)):
            c = cleaned[i]
            if c == opener:
                depth += 1
            elif c == closer:
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(cleaned[start : i + 1])
                    except json.JSONDecodeError:
                        break
    return None
