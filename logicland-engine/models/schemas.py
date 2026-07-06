"""Pydantic request/response schemas shared across the API layer.

These are transport contracts (what crosses the wire to Next.js). Persistence
lives in Prisma (``packages/database``); the engine treats those records as
inputs and returns derived, AI-enriched artifacts.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# --- AI Helper (tutor) ---
class TutorAskRequest(BaseModel):
    student_id: str
    question: str = Field(min_length=1, max_length=500)
    mission_slug: str | None = None
    hint_level: int = Field(default=1, ge=1, le=3, description="1=nudge, 3=strong hint")


class TutorAskResponse(BaseModel):
    answer: str
    is_hint: bool = True
    safe: bool = True


# --- Worksheet / Quiz / Flashcard generation ---
class GenerateRequest(BaseModel):
    mission_slug: str
    skill: str
    difficulty: int = Field(default=1, ge=1, le=3)
    count: int = Field(default=5, ge=1, le=20)


class WorksheetItem(BaseModel):
    prompt: str
    answer: str | None = None


class WorksheetResponse(BaseModel):
    title: str
    items: list[WorksheetItem]


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int


class QuizResponse(BaseModel):
    title: str
    questions: list[QuizQuestion]


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardResponse(BaseModel):
    title: str
    cards: list[Flashcard]


# --- Reports & summaries ---
class WeeklyReportRequest(BaseModel):
    student_id: str
    student_name: str
    week: int
    completed_missions: list[str] = []
    badges_earned: list[str] = []
    attendance_rate: float = Field(default=1.0, ge=0.0, le=1.0)


class WeeklyReportResponse(BaseModel):
    student_name: str
    week: int
    summary: str
    highlights: list[str]
    next_steps: list[str]


# --- Certificates ---
class CertificateRequest(BaseModel):
    student_name: str
    achievement: str
    kind: str = Field(default="mission", description="mission|world|graduation")


class CertificateResponse(BaseModel):
    student_name: str
    achievement: str
    kind: str
    citation: str


# --- Progress ---
class ProgressRequest(BaseModel):
    student_id: str
    completed_missions: list[str] = []
    daily_streak: int = Field(default=0, ge=0)


class ProgressResponse(BaseModel):
    completed: int
    total: int
    percent: float
    current_mission_slug: str | None
    current_world_slug: str | None
    skills_mastered: list[str]


# --- Gamification: mission completion ---
class MissionCompleteRequest(BaseModel):
    student_id: str
    mission_slug: str
    xp: int = Field(default=0, ge=0, description="Current total XP before award.")
    coins: int = Field(default=0, ge=0)
    stars: int = Field(default=0, ge=0)
    daily_streak: int = Field(default=0, ge=0)
    correct: int = Field(default=0, ge=0)
    total: int = Field(default=0, ge=0)
    with_project: bool = False


class AwardedBadge(BaseModel):
    slug: str
    name: str
    reason: str


class MissionCompleteResponse(BaseModel):
    xp_awarded: int
    coins_awarded: int
    stars_awarded: int
    new_total_xp: int
    new_level: int
    level_progress: float
    badges: list[AwardedBadge]
