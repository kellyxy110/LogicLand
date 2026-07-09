"""World Map catalog tests — the six-realm production spine.

Deterministic and key-free: the catalog is static data plus a badge lookup.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from badges import service as badges
from curriculum.worlds import (
    LOGICLAND_WORLDS,
    find_land_mission,
    find_land_world,
)
from main import app

client = TestClient(app)


def test_six_worlds_logic_forest_and_coding_city_unlocked() -> None:
    assert len(LOGICLAND_WORLDS) == 6
    unlocked = [w.slug for w in LOGICLAND_WORLDS if not w.locked]
    assert unlocked == ["logic-forest", "coding-city"]


def test_coding_city_has_live_html_studio_mission() -> None:
    city = find_land_world("coding-city")
    assert city is not None
    first = next(m for m in city.missions if m.slug == "first-web-page")
    assert first.game == "html-studio"
    assert first.status == "live"
    assert badges.mission_badge("first-web-page").name == "Web Weaver"  # type: ignore[union-attr]


def test_logic_forest_is_fully_playable() -> None:
    forest = find_land_world("logic-forest")
    assert forest is not None
    assert len(forest.missions) == 5
    live = [m.slug for m in forest.missions if m.status == "live"]
    assert set(live) == {
        "robot-path",
        "shape-match",
        "memory-game",
        "pattern-builder",
        "typing-quest",
    }


def test_worlds_endpoint_shape() -> None:
    resp = client.get("/api/curriculum/worlds")
    assert resp.status_code == 200
    worlds = resp.json()["worlds"]
    assert len(worlds) == 6
    assert [w["order"] for w in worlds] == [1, 2, 3, 4, 5, 6]
    forest = next(w for w in worlds if w["slug"] == "logic-forest")
    assert forest["locked"] is False
    assert forest["missions"][0]["game"] == "robot-maze"


def test_land_missions_award_badges() -> None:
    for m in find_land_world("logic-forest").missions:  # type: ignore[union-attr]
        award = badges.mission_badge(m.slug)
        assert award is not None
        assert award.name == m.badge


def test_unknown_mission_has_no_badge() -> None:
    assert find_land_mission("does-not-exist") is None
    assert badges.mission_badge("does-not-exist") is None
