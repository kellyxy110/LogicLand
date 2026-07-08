"""Gamification rules — XP, levels, coins, stars, and streaks.

Pure, deterministic functions with no I/O so they are trivially testable and can
run anywhere (engine request path, batch jobs, tests). Persistence lives in the
web tier via Prisma; this module only computes *what should change*.
"""

from __future__ import annotations

from dataclasses import dataclass

# --- Tuning constants (single place to balance the game economy) ---
XP_PER_MISSION = 100
XP_PER_CHALLENGE = 50
XP_PER_PROJECT = 75
COINS_PER_MISSION = 10
STARS_PER_MISSION = 3  # 1-3 based on performance
# Level curve: level N requires this much cumulative XP. Gentle, then steeper.
_LEVEL_STEP = 250


@dataclass(frozen=True, slots=True)
class Award:
    """The reward delta produced by an event. Additive to a Student's totals."""

    xp: int = 0
    coins: int = 0
    stars: int = 0
    reason: str = ""


def level_for_xp(total_xp: int) -> int:
    """Return the 1-based level for a cumulative XP total."""
    if total_xp < 0:
        raise ValueError("total_xp must be non-negative")
    return total_xp // _LEVEL_STEP + 1


def xp_to_next_level(total_xp: int) -> int:
    """XP remaining until the next level."""
    current = level_for_xp(total_xp)
    return current * _LEVEL_STEP - total_xp


def level_progress(total_xp: int) -> float:
    """Fraction (0.0-1.0) of progress through the current level, for the XP meter."""
    into_level = total_xp % _LEVEL_STEP
    return round(into_level / _LEVEL_STEP, 4)


def stars_for_performance(correct: int, total: int) -> int:
    """Award 1-3 stars based on how well a mission challenge went."""
    if total <= 0:
        return 1
    ratio = correct / total
    if ratio >= 0.9:
        return 3
    if ratio >= 0.6:
        return 2
    return 1


def award_for_mission(
    correct: int = 0, total: int = 0, with_project: bool = False
) -> Award:
    """Compute the reward for completing a mission."""
    xp = XP_PER_MISSION + XP_PER_CHALLENGE
    if with_project:
        xp += XP_PER_PROJECT
    return Award(
        xp=xp,
        coins=COINS_PER_MISSION,
        stars=stars_for_performance(correct, total) if total else STARS_PER_MISSION,
        reason="mission_complete",
    )


def next_daily_streak(current_streak: int, days_since_last: int) -> int:
    """Return the new daily streak given days elapsed since the last active day.

    0 days = same day (unchanged), 1 day = +1, 2+ days = streak broken (reset to 1).
    """
    if days_since_last <= 0:
        return current_streak
    if days_since_last == 1:
        return current_streak + 1
    return 1


def apply_award(
    xp: int, coins: int, stars: int, award: Award
) -> tuple[int, int, int, int]:
    """Apply an award to current totals; return (xp, coins, stars, new_level)."""
    new_xp = xp + award.xp
    return new_xp, coins + award.coins, stars + award.stars, level_for_xp(new_xp)
