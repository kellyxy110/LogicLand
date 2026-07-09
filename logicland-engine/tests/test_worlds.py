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


def test_six_worlds_only_logic_forest_unlocked() -> None:
    assert len(LOGICLAND_WORLDS) == 6
    unlocked = [w for w in LOGICLAND_WORLDS if not w.locked]
    assert [w.slug for w in unlocked] == ["logic-forest"]


def test_logic_forest_has_five_missions_two_live() -> None:
    forest = find_land_world("logic-forest")
    assert forest is not None
    assert len(forest.missions) == 5
    live = [m.slug for m in forest.missions if m.status == "live"]
    assert set(live) == {"robot-path", "typing-quest"}


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
