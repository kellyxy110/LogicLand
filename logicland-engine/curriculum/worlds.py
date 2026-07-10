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
        status="live",
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
        status="live",
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
        status="live",
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


# --- Coding City missions (World 3) ---------------------------------------
# A full, progressive HTML course: 15 modules played through the html-studio
# game (a kid-sized VS Code workflow — folder, file, editor, live preview). Each
# module is a guided class; its ordered steps are the levels within. Every module
# is *live and playable* — the course never dead-ends into "coming soon". Lesson
# content (steps, starters, checks) lives in the frontend at data/studio.ts,
# keyed by these slugs.
_CODING_CITY_MISSIONS: list[LandMission] = [
    LandMission(
        slug="first-web-page",
        title="My First Web Page",
        skill="Web Basics & Structure",
        badge="Web Weaver",
        game="html-studio",
        order=1,
        story=(
            "Welcome to Coding City! Real coders build web pages. Make a folder, "
            "create a file, and write your very first HTML."
        ),
        objective="Build a basic HTML document with a title and a paragraph.",
        status="live",
        estimated_minutes=20,
    ),
    LandMission(
        slug="headings",
        title="Heading Levels",
        skill="Headings & Hierarchy",
        badge="Heading Hero",
        game="html-studio",
        order=2,
        story="Every great page needs titles. Learn all six heading sizes.",
        objective="Use headings h1–h6 to organise a page.",
        status="live",
    ),
    LandMission(
        slug="text-and-paragraphs",
        title="Words & Sentences",
        skill="Paragraphs & Text",
        badge="Paragraph Pro",
        game="html-studio",
        order=3,
        story="Fill your page with words people love to read.",
        objective="Write paragraphs and format text (strong, em, mark).",
        status="live",
    ),
    LandMission(
        slug="links",
        title="Web Links",
        skill="Links & Navigation",
        badge="Link Ranger",
        game="html-studio",
        order=4,
        story="Connect your pages to the whole web with links.",
        objective="Create links with href and build a navigation menu.",
        status="live",
    ),
    LandMission(
        slug="images",
        title="Pictures",
        skill="Images & Alt Text",
        badge="Image Innovator",
        game="html-studio",
        order=5,
        story="A picture says a thousand words. Add some to your page!",
        objective="Add images with src and always-kind alt text.",
        status="live",
    ),
    LandMission(
        slug="lists",
        title="Lists",
        skill="Ordered & Unordered Lists",
        badge="List Legend",
        game="html-studio",
        order=6,
        story="Tidy up your ideas with bullet and numbered lists.",
        objective="Build ul/ol lists, including a nested list.",
        status="live",
    ),
    LandMission(
        slug="page-sections",
        title="Page Sections",
        skill="Semantic Structure",
        badge="Structure Sage",
        game="html-studio",
        order=7,
        story="Give your page rooms: a header, a main area, and a footer.",
        objective="Organise a page with semantic section tags.",
        status="live",
    ),
    LandMission(
        slug="buttons",
        title="Buttons",
        skill="Buttons & Interaction",
        badge="Button Builder",
        game="html-studio",
        order=8,
        story="Buttons make things happen. Build a mission control panel!",
        objective="Create buttons and tell them apart from links.",
        status="live",
    ),
    LandMission(
        slug="tables",
        title="Tables",
        skill="Tables & Data",
        badge="Table Titan",
        game="html-studio",
        order=9,
        story="Show information in neat rows and columns.",
        objective="Build a table with rows, headings, and a caption.",
        status="live",
    ),
    LandMission(
        slug="forms",
        title="Forms",
        skill="Forms & Inputs",
        badge="Form Friend",
        game="html-studio",
        order=10,
        story="Let visitors answer questions with a friendly form.",
        objective="Build a labelled form with inputs, a dropdown, and a textarea.",
        status="live",
    ),
    LandMission(
        slug="media",
        title="Sound & Video",
        skill="Audio & Video",
        badge="Media Maker",
        game="html-studio",
        order=11,
        story="Add music and movies to your web page.",
        objective="Add audio and video with controls, sources, and captions.",
        status="live",
    ),
    LandMission(
        slug="accessibility",
        title="Friendly for Everyone",
        skill="Accessibility Basics",
        badge="Access Ace",
        game="html-studio",
        order=12,
        story="Make sure your page works for every single visitor.",
        objective="Add alt text, labels, language, and clear structure.",
        status="live",
    ),
    LandMission(
        slug="metadata",
        title="Page Information",
        skill="Metadata & the Head",
        badge="Meta Master",
        game="html-studio",
        order=13,
        story="Tell the browser all about your page with hidden information.",
        objective="Set up the head with title, charset, viewport, and language.",
        status="live",
    ),
    LandMission(
        slug="debugging",
        title="Fix the Page",
        skill="Debugging HTML",
        badge="Debug Detective",
        game="html-studio",
        order=14,
        story="Oh no — this page is broken! Can you repair it and save the city?",
        objective="Find and fix missing tags, attributes, and structure.",
        status="live",
    ),
    LandMission(
        slug="website-project",
        title="My Website Project",
        skill="Complete Website",
        badge="Website Creator",
        game="html-studio",
        order=15,
        story="Your grand finale: build a complete web page using everything!",
        objective="Combine structure, media, links, lists, and sections into one page.",
        status="live",
        estimated_minutes=30,
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
        subtitle="Build real web pages with code",
        theme="city",
        order=3,
        locked=False,
        skills=["HTML", "CSS", "Web Design"],
        missions=_CODING_CITY_MISSIONS,
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
