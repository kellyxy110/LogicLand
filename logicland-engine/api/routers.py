"""FastAPI routers — thin HTTP controllers that delegate to domain services.

Controllers here contain NO business logic. They validate input (via Pydantic
schemas), call the appropriate service, and shape the response. This keeps the
domain packages testable in isolation and the API surface easy to reason about.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from badges import service as badges_service
from curriculum.beginner_journey import BEGINNER_JOURNEY, find_mission, total_weeks
from curriculum.worlds import all_worlds
from flashcards.service import FlashcardService
from gamification import service as game
from models.schemas import (
    AwardedBadge,
    CertificateRequest,
    CertificateResponse,
    FlashcardResponse,
    GenerateRequest,
    MissionCompleteRequest,
    MissionCompleteResponse,
    ProgressRequest,
    ProgressResponse,
    QuizResponse,
    TutorAskRequest,
    TutorAskResponse,
    WeeklyReportRequest,
    WeeklyReportResponse,
    WorksheetResponse,
)
from progress import service as progress_service
from quizzes.service import QuizService
from tutor.service import TutorService
from worksheets.service import WorksheetService

# --- Curriculum ---
curriculum_router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@curriculum_router.get("/journey")
async def get_journey() -> dict[str, object]:
    """Return the full 12-week beginner journey (worlds + missions)."""
    return {
        "total_weeks": total_weeks(),
        "worlds": [
            {
                "slug": w.slug,
                "title": w.title,
                "week": w.week,
                "skill": w.theme_skill,
                "missions": [
                    {
                        "slug": m.slug,
                        "title": m.title,
                        "skill": m.skill,
                        "badge": m.badge,
                    }
                    for m in w.missions
                ],
            }
            for w in BEGINNER_JOURNEY
        ],
    }


@curriculum_router.get("/worlds")
async def get_worlds() -> dict[str, object]:
    """Return the six-realm World Map (the production top-level catalog).

    Missions are inlined so the frontend map + world home render from one fetch.
    Lock state is server-owned here; the frontend never decides what's unlocked.
    """
    return {
        "worlds": [
            {
                "slug": w.slug,
                "title": w.title,
                "subtitle": w.subtitle,
                "theme": w.theme,
                "order": w.order,
                "locked": w.locked,
                "skills": w.skills,
                "missions": [
                    {
                        "slug": m.slug,
                        "title": m.title,
                        "skill": m.skill,
                        "badge": m.badge,
                        "game": m.game,
                        "order": m.order,
                        "story": m.story,
                        "objective": m.objective,
                        "status": m.status,
                        "estimated_minutes": m.estimated_minutes,
                    }
                    for m in sorted(w.missions, key=lambda m: m.order)
                ],
            }
            for w in sorted(all_worlds(), key=lambda w: w.order)
        ],
    }


@curriculum_router.get("/mission/{slug}")
async def get_mission(slug: str) -> dict[str, object]:
    """Return the full detail for a single mission (the mission player uses this)."""
    m = find_mission(slug)
    if m is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {
        "slug": m.slug,
        "title": m.title,
        "skill": m.skill,
        "story": m.story,
        "objective": m.objective,
        "activity": m.activity,
        "challenge": m.challenge,
        "project": m.project,
        "homework": m.homework,
        "parent_summary": m.parent_summary,
        "badge": m.badge,
        "estimated_minutes": m.estimated_minutes,
    }


# --- AI Helper (tutor) ---
tutor_router = APIRouter(prefix="/tutor", tags=["tutor"])


@tutor_router.post("/ask", response_model=TutorAskResponse)
async def ask_tutor(req: TutorAskRequest) -> TutorAskResponse:
    return await TutorService().ask(req)


# --- Reports (stub wiring; service to be implemented in reports/) ---
reports_router = APIRouter(prefix="/reports", tags=["reports"])


@reports_router.post("/weekly", response_model=WeeklyReportResponse)
async def weekly_report(req: WeeklyReportRequest) -> WeeklyReportResponse:
    # Placeholder deterministic summary until reports.service is implemented.
    return WeeklyReportResponse(
        student_name=req.student_name,
        week=req.week,
        summary=(
            f"{req.student_name} completed {len(req.completed_missions)} mission(s) "
            f"in week {req.week} and earned {len(req.badges_earned)} badge(s)."
        ),
        highlights=[f"Earned: {b}" for b in req.badges_earned]
        or ["Showed up and tried!"],
        next_steps=["Keep exploring next week's world 🌟"],
    )


# --- Certificates (stub wiring) ---
certificates_router = APIRouter(prefix="/certificates", tags=["certificates"])


@certificates_router.post("/generate", response_model=CertificateResponse)
async def generate_certificate(req: CertificateRequest) -> CertificateResponse:
    return CertificateResponse(
        student_name=req.student_name,
        achievement=req.achievement,
        kind=req.kind,
        citation=(
            f"Awarded to {req.student_name} for {req.achievement}. "
            "A brave and brilliant LogicLand coder!"
        ),
    )


# --- Progress ---
progress_router = APIRouter(prefix="/progress", tags=["progress"])


@progress_router.post("/journey", response_model=ProgressResponse)
async def student_progress(req: ProgressRequest) -> ProgressResponse:
    p = progress_service.compute_progress(set(req.completed_missions))
    return ProgressResponse(
        completed=p.completed,
        total=p.total,
        percent=p.percent,
        current_mission_slug=p.current_mission_slug,
        current_world_slug=p.current_world_slug,
        skills_mastered=p.skills_mastered,
    )


# --- Gamification ---
gamification_router = APIRouter(prefix="/gamification", tags=["gamification"])


@gamification_router.post("/mission-complete", response_model=MissionCompleteResponse)
async def mission_complete(req: MissionCompleteRequest) -> MissionCompleteResponse:
    award = game.award_for_mission(
        correct=req.correct, total=req.total, with_project=req.with_project
    )
    new_xp, _coins, _stars, new_level = game.apply_award(
        req.xp, req.coins, req.stars, award
    )
    badges = [badges_service.mission_badge(req.mission_slug)]
    badges += [badges_service.streak_badge(req.daily_streak)]
    awarded = [
        AwardedBadge(slug=b.slug, name=b.name, reason=b.reason)
        for b in badges
        if b is not None
    ]
    return MissionCompleteResponse(
        xp_awarded=award.xp,
        coins_awarded=award.coins,
        stars_awarded=award.stars,
        new_total_xp=new_xp,
        new_level=new_level,
        level_progress=game.level_progress(new_xp),
        badges=awarded,
    )


# --- Content generators ---
generate_router = APIRouter(prefix="/generate", tags=["generate"])


@generate_router.post("/worksheet", response_model=WorksheetResponse)
async def gen_worksheet(req: GenerateRequest) -> WorksheetResponse:
    return await WorksheetService().generate(req)


@generate_router.post("/quiz", response_model=QuizResponse)
async def gen_quiz(req: GenerateRequest) -> QuizResponse:
    return await QuizService().generate(req)


@generate_router.post("/flashcards", response_model=FlashcardResponse)
async def gen_flashcards(req: GenerateRequest) -> FlashcardResponse:
    return await FlashcardService().generate(req)


ALL_ROUTERS = [
    curriculum_router,
    tutor_router,
    reports_router,
    certificates_router,
    progress_router,
    gamification_router,
    generate_router,
]
