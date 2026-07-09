"""Badge award rules.

Each mission carries a badge (see the curriculum). Higher-order "meta" badges are
earned by patterns of progress (e.g. finishing a whole world, streaks). Rules are
pure and data-driven so new badges are added without touching call sites.
"""

from __future__ import annotations

from dataclasses import dataclass

from curriculum.beginner_journey import BEGINNER_JOURNEY
from curriculum.worlds import find_land_mission


@dataclass(frozen=True, slots=True)
class BadgeAward:
    slug: str
    name: str
    reason: str


# Meta badges beyond the per-mission ones.
_STREAK_BADGES = {
    3: ("streak-3", "On Fire!"),
    7: ("streak-7", "Week Warrior"),
    30: ("streak-30", "Unstoppable"),
}


def _badge_slug(name: str) -> str:
    return name.lower().replace(" ", "-").replace("!", "")


def mission_badge(mission_slug: str) -> BadgeAward | None:
    """Return the badge granted for completing a specific mission.

    Checks the six-World map first (the production catalog), then falls back to
    the legacy beginner journey so both curricula award correctly.
    """
    land = find_land_mission(mission_slug)
    if land is not None:
        return BadgeAward(
            slug=_badge_slug(land.badge),
            name=land.badge,
            reason=f"Completed {land.title}",
        )
    for world in BEGINNER_JOURNEY:
        for m in world.missions:
            if m.slug == mission_slug:
                return BadgeAward(
                    slug=_badge_slug(m.badge),
                    name=m.badge,
                    reason=f"Completed {m.title}",
                )
    return None


def world_completion_badges(completed_slugs: set[str]) -> list[BadgeAward]:
    """Award a badge for each fully-completed world."""
    awards: list[BadgeAward] = []
    for world in BEGINNER_JOURNEY:
        if world.missions and all(m.slug in completed_slugs for m in world.missions):
            awards.append(
                BadgeAward(
                    slug=f"world-{world.slug}",
                    name=f"{world.title} Champion",
                    reason=f"Completed the world '{world.title}'",
                )
            )
    return awards


def streak_badge(daily_streak: int) -> BadgeAward | None:
    """Return a streak milestone badge when a threshold is exactly reached."""
    if daily_streak in _STREAK_BADGES:
        slug, name = _STREAK_BADGES[daily_streak]
        return BadgeAward(slug=slug, name=name, reason=f"{daily_streak}-day streak")
    return None


def evaluate(completed_slugs: set[str], daily_streak: int = 0) -> list[BadgeAward]:
    """Compute all badges a student is currently eligible for.

    Idempotent: the caller de-dupes against already-issued StudentBadges.
    """
    awards: list[BadgeAward] = []
    for slug in completed_slugs:
        if (b := mission_badge(slug)) is not None:
            awards.append(b)
    awards.extend(world_completion_badges(completed_slugs))
    if (s := streak_badge(daily_streak)) is not None:
        awards.append(s)
    return awards
