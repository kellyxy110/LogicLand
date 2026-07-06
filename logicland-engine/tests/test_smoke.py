"""Smoke tests that keep the engine honest without needing an LLM key."""

from __future__ import annotations

from fastapi.testclient import TestClient

from curriculum.beginner_journey import total_weeks
from main import app
from utils.safety import is_safe, sanitize_for_child

client = TestClient(app)


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_curriculum_has_twelve_weeks() -> None:
    assert total_weeks() == 12
    resp = client.get("/api/curriculum/journey")
    assert resp.status_code == 200
    assert resp.json()["total_weeks"] == 12


def test_safety_filter() -> None:
    assert is_safe("Great job, let's loop the stars!")
    assert not is_safe("you are stupid")
    assert sanitize_for_child("you are stupid") != "you are stupid"
