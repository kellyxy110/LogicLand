"""The LogicLand Beginner Journey — 12 weeks of story-based coding adventures.

This module is the canonical, code-level source of curriculum structure used by
the engine. The human-readable companion lives in ``docs/curriculum.md``.

Vocabulary (never say "Lesson 1"):
    World   -> a themed universe (e.g. "The Lost Robot")
    Mission -> a single adventure within a world, teaching one core Skill
    Skill   -> the computational-thinking concept a mission builds
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class Mission:
    slug: str
    title: str
    skill: str
    story: str
    objective: str
    activity: str
    challenge: str
    project: str
    homework: str
    parent_summary: str
    badge: str
    estimated_minutes: int
    required_assets: list[str] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class World:
    slug: str
    title: str
    week: int
    theme_skill: str
    missions: list[Mission]


def _m(  # small helper to keep the data table readable
    slug: str,
    title: str,
    skill: str,
    story: str,
    badge: str,
    minutes: int = 45,
) -> Mission:
    return Mission(
        slug=slug,
        title=title,
        skill=skill,
        story=story,
        objective=f"Learn {skill.lower()} by {title.lower()}.",
        activity=f"Guided, playful activity practicing {skill.lower()}.",
        challenge=f"A stretch challenge that deepens {skill.lower()}.",
        project=f"Build a small project showcasing {skill.lower()}.",
        homework="A short, joyful at-home task (10-15 minutes).",
        parent_summary=(
            f"This week your child explored {skill.lower()}. "
            "Ask them to show you what they built!"
        ),
        badge=badge,
        estimated_minutes=minutes,
        required_assets=["mission-illustration", "robo-character", "reward-animation"],
    )


BEGINNER_JOURNEY: list[World] = [
    World(
        "meet-robo",
        "Meet Robo",
        1,
        "Algorithms",
        [
            _m(
                "robo-hello",
                "Meet Robo",
                "Algorithms",
                "A friendly robot named Robo wakes up and needs a friend to guide him.",
                "First Friend",
            ),
        ],
    ),
    World(
        "directions",
        "Which Way, Robo?",
        2,
        "Sequencing & Directions",
        [
            _m(
                "robo-directions",
                "Which Way, Robo?",
                "Directions",
                "Robo is lost in the meadow. Give him step-by-step directions home.",
                "Pathfinder",
            ),
        ],
    ),
    World(
        "patterns",
        "The Pattern Forest",
        3,
        "Patterns",
        [
            _m(
                "pattern-forest",
                "The Pattern Forest",
                "Patterns",
                "Magical trees glow in repeating patterns Robo must complete.",
                "Pattern Wizard",
            ),
        ],
    ),
    World(
        "loops",
        "The Star Collector",
        4,
        "Loops",
        [
            _m(
                "collect-stars",
                "Collect the Stars",
                "Loops",
                "There are too many stars to grab one by one — teach Robo to loop!",
                "Loop Hero",
            ),
        ],
    ),
    World(
        "events",
        "The Button Kingdom",
        5,
        "Events",
        [
            _m(
                "button-kingdom",
                "The Button Kingdom",
                "Events",
                "In a kingdom of buttons, every press makes something wonderful happen.",
                "Event Master",
            ),
        ],
    ),
    World(
        "conditions",
        "The Fork in the Road",
        6,
        "Conditions",
        [
            _m(
                "avoid-obstacles",
                "Avoid the Obstacles",
                "Conditions",
                "IF there is a rock, THEN Robo must jump. Help him choose wisely.",
                "Choice Champion",
            ),
        ],
    ),
    World(
        "debugging",
        "The Glitch Cave",
        7,
        "Debugging",
        [
            _m(
                "glitch-cave",
                "The Glitch Cave",
                "Debugging",
                "Something is wrong with Robo's plan. Become a bug detective!",
                "Bug Detective",
            ),
        ],
    ),
    World(
        "animation",
        "The Dancing Robot",
        8,
        "Animation",
        [
            _m(
                "dancing-robot",
                "The Dancing Robot",
                "Animation",
                "Make Robo dance by changing how he looks over time.",
                "Animator",
            ),
        ],
    ),
    World(
        "interactive-stories",
        "Robo's Storybook",
        9,
        "Interactive Stories",
        [
            _m(
                "robo-storybook",
                "Robo's Storybook",
                "Interactive Stories",
                "Build a story where the reader chooses what Robo does next.",
                "Storyteller",
            ),
        ],
    ),
    World(
        "mini-game",
        "The Star Chase Game",
        10,
        "Combining Skills",
        [
            _m(
                "star-chase",
                "Build a Mini Game",
                "Combining Skills",
                "Put loops, events, and conditions together into a real game.",
                "Game Maker",
                minutes=60,
            ),
        ],
    ),
    World(
        "project-build",
        "My Big Idea",
        11,
        "Project Building",
        [
            _m(
                "big-idea",
                "Build Your Big Idea",
                "Project Building",
                "Dream up your own project and bring it to life with Robo.",
                "Creator",
                minutes=60,
            ),
        ],
    ),
    World(
        "graduation",
        "The Graduation Showcase",
        12,
        "Showcase & Reflection",
        [
            _m(
                "showcase",
                "Graduation Showcase",
                "Showcase & Reflection",
                "Present everything you built. You are officially a LogicLand coder!",
                "LogicLand Graduate",
                minutes=60,
            ),
        ],
    ),
]


def total_weeks() -> int:
    return len(BEGINNER_JOURNEY)


def find_world(week: int) -> World | None:
    return next((w for w in BEGINNER_JOURNEY if w.week == week), None)


def find_mission(slug: str) -> Mission | None:
    for world in BEGINNER_JOURNEY:
        for m in world.missions:
            if m.slug == slug:
                return m
    return None
