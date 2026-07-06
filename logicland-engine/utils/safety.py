"""Child-safety utilities.

LogicLand serves children aged 5-10. Every piece of AI-generated text destined
for a child passes through :func:`sanitize_for_child` before it leaves the
engine. This module is intentionally conservative and dependency-free so it can
run in tests and in every request path without added cost.
"""

from __future__ import annotations

import re

# Minimal denylist. In production this is backed by a moderation API call plus a
# curated word list; kept here as a fast, deterministic first line of defense.
_BLOCKED_PATTERNS = [
    re.compile(r"\b(kill|hate|stupid|dumb|idiot)\b", re.IGNORECASE),
]

# Reading level guard: keep sentences short and encouraging for early readers.
_MAX_SENTENCE_WORDS = 18


def is_safe(text: str) -> bool:
    """Return True if no blocked pattern is present."""
    return not any(p.search(text) for p in _BLOCKED_PATTERNS)


def sanitize_for_child(text: str) -> str:
    """Return child-safe text, or a gentle fallback if the text is unsafe.

    Never raises: safety failures degrade to a friendly, neutral message rather
    than leaking unsafe content to a young learner.
    """
    if not text or not is_safe(text):
        return "Let's try that again together! 🌟"
    return text.strip()
