"""Progress domain — where a student is in the journey and what comes next.

Pure functions over the curriculum source of truth. The web tier supplies the
set of completed mission slugs (from Prisma); this module derives ordering,
percent complete, mastery, and the next recommended mission.
"""

from __future__ import annotations

from dataclasses import dataclass

from curriculum.beginner_journey import BEGINNER_JOURNEY, Mission


@dataclass(frozen=True, slots=True)
class JourneyProgress:
    completed: int
    total: int
    percent: float
    current_mission_slug: str | None
    current_world_slug: str | None
    skills_mastered: list[str]


def _ordered_missions() -> list[tuple[str, Mission]]:
    """Flatten worlds -> missions in journey order, keeping the world slug."""
    return [(w.slug, m) for w in BEGINNER_JOURNEY for m in w.missions]


def compute_progress(completed_slugs: set[str]) -> JourneyProgress:
    """Derive the student's position in the beginner journey."""
    ordered = _ordered_missions()
    total = len(ordered)
    completed = sum(1 for _, m in ordered if m.slug in completed_slugs)

    current_world: str | None = None
    current_mission: str | None = None
    for world_slug, m in ordered:
        if m.slug not in completed_slugs:
            current_world, current_mission = world_slug, m.slug
            break

    skills = sorted({m.skill for _, m in ordered if m.slug in completed_slugs})
    percent = round(completed / total * 100, 1) if total else 0.0
    return JourneyProgress(
        completed=completed,
        total=total,
        percent=percent,
        current_mission_slug=current_mission,
        current_world_slug=current_world,
        skills_mastered=skills,
    )


def next_mission(completed_slugs: set[str]) -> Mission | None:
    """Return the next mission the student should attempt, or None if graduated."""
    for _, m in _ordered_missions():
        if m.slug not in completed_slugs:
            return m
    return None
