"""The LogicLand World Map — the six-realm product spine.

This is the top-level curriculum structure the learner navigates: six themed
Worlds, each holding Missions. It is the canonical, server-owned catalog (the
frontend only *reads* it) so lock state and progression stay authoritative.

Relationship to ``beginner_journey.py``: that module is the legacy 12-week,
skill-themed journey still powering the original student pages. These six Worlds
are the production map; skill content will be re-homed under the relevant Worlds
over time. Keeping both avoids orphaning shipped content during the migration.

Vocabulary (never say "Lesson 1"):
    World   -> a themed realm (e.g. "Logic Forest")
    Mission -> a single adventure within a world, teaching one core Skill
    Game    -> the interactive engine a mission is played through
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Game kinds a mission can be played through. New kinds (blockly, scratch,
# python, ...) are added here as the platform grows; the frontend MissionRunner
# switches on this value, so adding a game never touches existing missions.
GameKind = str  # "robot-maze" | "typing-quest" | "shape-match" | "memory" | ...

# Mission availability. "live" is playable now; "soon" appears on the map to
# preserve the roadmap but is not yet playable (honest, never a fake button).
MissionStatus = str  # "live" | "soon"


@dataclass(frozen=True, slots=True)
class LandMission:
    slug: str
    title: str
    skill: str
    badge: str
    game: GameKind
    order: int
    story: str
    objective: str
    status: MissionStatus = "live"
    estimated_minutes: int = 15


@dataclass(frozen=True, slots=True)
class LandWorld:
    slug: str
    title: str
    subtitle: str
    # Theme key the frontend maps to art + palette (no colors hardcoded here).
    theme: str
    order: int
    locked: bool
    skills: list[str]
    missions: list[LandMission] = field(default_factory=list)


# --- Logic Forest missions (World 1) --------------------------------------
_LOGIC_FOREST_MISSIONS: list[LandMission] = [
    LandMission(
        slug="robot-path",
        title="Robot Path",
        skill="Sequencing",
        badge="Pathfinder",
        game="robot-maze",
        order=1,
        story=(
            "Robo is lost among the trees! Type commands to guide Robo through "
            "the forest and reach the treasure."
        ),
        objective="Guide Robo to the treasure using a sequence of commands.",
        status="live",
    ),
    LandMission(
        slug="shape-match",
        title="Shape Match",
        skill="Pattern Recognition",
        badge="Shape Sorter",
        game="shape-match",
        order=2,
        story="The forest shapes are all mixed up. Can you match them?",
        objective="Sort shapes to build pattern-recognition skills.",
        status="soon",
    ),
    LandMission(
        slug="memory-game",
        title="Memory Game",
        skill="Memory & Recall",
        badge="Memory Master",
        game="memory",
        order=3,
        story="Robo hid some treasures. Remember where they are!",
        objective="Strengthen working memory by matching hidden pairs.",
        status="soon",
    ),
    LandMission(
        slug="pattern-builder",
        title="Pattern Builder",
        skill="Patterns & Loops",
        badge="Pattern Wizard",
        game="pattern-builder",
        order=4,
        story="Build the forest patterns to wake the sleeping flowers.",
        objective="Recreate and extend patterns — the seed of loops.",
        status="soon",
    ),
    LandMission(
        slug="typing-quest",
        title="Typing Quest",
        skill="Commands & Typing",
        badge="Command Captain",
        game="typing-quest",
        order=5,
        story=(
            "Robo listens to typed commands! Type each command correctly to "
            "send Robo on a quest through the forest."
        ),
        objective="Type coding commands accurately to control Robo.",
        status="live",
    ),
]


# --- The six Worlds --------------------------------------------------------
LOGICLAND_WORLDS: list[LandWorld] = [
    LandWorld(
        slug="logic-forest",
        title="Logic Forest",
        subtitle="Where every adventure begins",
        theme="forest",
        order=1,
        locked=False,
        skills=["Sequencing", "Patterns", "Commands", "Problem Solving"],
        missions=_LOGIC_FOREST_MISSIONS,
    ),
    LandWorld(
        slug="number-kingdom",
        title="Number Kingdom",
        subtitle="Math magic and mighty numbers",
        theme="kingdom",
        order=2,
        locked=True,
        skills=["Counting", "Addition", "Logic"],
    ),
    LandWorld(
        slug="coding-city",
        title="Coding City",
        subtitle="Build programs, brick by brick",
        theme="city",
        order=3,
        locked=True,
        skills=["Loops", "Conditions", "Functions"],
    ),
    LandWorld(
        slug="robot-factory",
        title="Robot Factory",
        subtitle="Design and program real robots",
        theme="factory",
        order=4,
        locked=True,
        skills=["Robotics", "Sensors", "Sequencing"],
    ),
    LandWorld(
        slug="ai-mountain",
        title="AI Mountain",
        subtitle="Teach machines to think",
        theme="mountain",
        order=5,
        locked=True,
        skills=["AI", "Data", "Reasoning"],
    ),
    LandWorld(
        slug="innovation-space",
        title="Innovation Space",
        subtitle="Invent the future",
        theme="space",
        order=6,
        locked=True,
        skills=["Design", "Creativity", "Engineering"],
    ),
]


def all_worlds() -> list[LandWorld]:
    return LOGICLAND_WORLDS


def find_land_world(slug: str) -> LandWorld | None:
    return next((w for w in LOGICLAND_WORLDS if w.slug == slug), None)


def find_land_mission(slug: str) -> LandMission | None:
    for world in LOGICLAND_WORLDS:
        for m in world.missions:
            if m.slug == slug:
                return m
    return None
