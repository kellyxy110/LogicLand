"""Phase 2 tests — gamification, progress, badges, generators, and new endpoints.

All deterministic and LLM-key-free: generator services fall back to safe content
when no key is configured, so these run in CI without secrets.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from badges import service as badges
from curriculum.beginner_journey import BEGINNER_JOURNEY
from gamification import service as game
from main import app
from models.schemas import GenerateRequest
from progress import service as progress
from quizzes.service import grade
from utils.jsonx import extract_json

client = TestClient(app)

ALL_SLUGS = [m.slug for w in BEGINNER_JOURNEY for m in w.missions]


# --- Gamification ---
def test_level_curve() -> None:
    assert game.level_for_xp(0) == 1
    assert game.level_for_xp(249) == 1
    assert game.level_for_xp(250) == 2
    assert 0.0 <= game.level_progress(300) <= 1.0


def test_stars_for_performance() -> None:
    assert game.stars_for_performance(9, 10) == 3
    assert game.stars_for_performance(6, 10) == 2
    assert game.stars_for_performance(1, 10) == 1
    assert game.stars_for_performance(0, 0) == 1  # no divide-by-zero


def test_streak_rules() -> None:
    assert game.next_daily_streak(4, 0) == 4  # same day
    assert game.next_daily_streak(4, 1) == 5  # next day
    assert game.next_daily_streak(4, 3) == 1  # broken


def test_award_and_apply() -> None:
    award = game.award_for_mission(correct=10, total=10, with_project=True)
    assert award.stars == 3
    xp, coins, stars, level = game.apply_award(0, 0, 0, award)
    assert xp == award.xp and level == game.level_for_xp(xp)


# --- Progress ---
def test_progress_start_and_finish() -> None:
    start = progress.compute_progress(set())
    assert start.completed == 0
    assert start.current_mission_slug == ALL_SLUGS[0]

    done = progress.compute_progress(set(ALL_SLUGS))
    assert done.completed == done.total
    assert done.current_mission_slug is None
    assert progress.next_mission(set(ALL_SLUGS)) is None


# --- Badges ---
def test_mission_and_world_badges() -> None:
    first = ALL_SLUGS[0]
    assert badges.mission_badge(first) is not None
    assert badges.mission_badge("nope") is None
    worlds = badges.world_completion_badges(set(ALL_SLUGS))
    assert len(worlds) == len(BEGINNER_JOURNEY)
    assert badges.streak_badge(7) is not None
    assert badges.streak_badge(5) is None


# --- JSON extraction ---
def test_extract_json_variants() -> None:
    assert extract_json('```json\n[{"a":1}]\n```') == [{"a": 1}]
    assert extract_json('Sure! {"x": 2} done') == {"x": 2}
    assert extract_json("not json") is None


# --- Generators (fallback path, no LLM key) ---
def test_generators_fallback_shapes() -> None:
    req = GenerateRequest(mission_slug="collect-stars", skill="Loops", count=4)
    ws = client.post("/api/generate/worksheet", json=req.model_dump())
    assert ws.status_code == 200 and len(ws.json()["items"]) == 4
    qz = client.post("/api/generate/quiz", json=req.model_dump())
    assert qz.status_code == 200 and len(qz.json()["questions"]) == 4
    fc = client.post("/api/generate/flashcards", json=req.model_dump())
    assert fc.status_code == 200 and len(fc.json()["cards"]) == 4


def test_quiz_grading() -> None:
    from models.schemas import QuizQuestion, QuizResponse

    quiz = QuizResponse(
        title="t",
        questions=[
            QuizQuestion(question="q1", options=["a", "b"], correct_index=0),
            QuizQuestion(question="q2", options=["a", "b"], correct_index=1),
        ],
    )
    assert grade(quiz, [0, 1]) == (2, 2)
    assert grade(quiz, [1, 1]) == (1, 2)
    assert grade(quiz, [9, 9]) == (0, 2)  # out-of-range answers count as wrong


# --- New endpoints ---
def test_mission_complete_endpoint() -> None:
    body = {
        "student_id": "s1",
        "mission_slug": ALL_SLUGS[0],
        "xp": 200,
        "coins": 5,
        "stars": 2,
        "daily_streak": 7,
        "correct": 5,
        "total": 5,
        "with_project": True,
    }
    resp = client.post("/api/gamification/mission-complete", json=body)
    assert resp.status_code == 200
    data = resp.json()
    assert data["new_total_xp"] > 200
    assert data["new_level"] >= 1
    assert any(b["slug"].startswith("streak-") for b in data["badges"])


def test_progress_endpoint() -> None:
    resp = client.post(
        "/api/progress/journey",
        json={"student_id": "s1", "completed_missions": ALL_SLUGS[:2]},
    )
    assert resp.status_code == 200
    assert resp.json()["completed"] == 2
