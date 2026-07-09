// Typed client for the LogicLand Intelligence Engine (FastAPI).
// All AI + curriculum intelligence flows through here — never call providers
// directly from the frontend.
import { ENGINE_URL } from "@logicland/shared";

async function engineFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ENGINE_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Engine ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// --- Response shapes (mirror logicland-engine/models/schemas.py) ---
export interface MissionSummary {
  slug: string;
  title: string;
  skill: string;
  badge: string;
}
export interface WorldSummary {
  slug: string;
  title: string;
  week: number;
  skill: string;
  missions: MissionSummary[];
}
export interface Journey {
  total_weeks: number;
  worlds: WorldSummary[];
}
export interface Progress {
  completed: number;
  total: number;
  percent: number;
  current_mission_slug: string | null;
  current_world_slug: string | null;
  skills_mastered: string[];
}
export interface AwardedBadge {
  slug: string;
  name: string;
  reason: string;
}
export interface MissionReward {
  xp_awarded: number;
  coins_awarded: number;
  stars_awarded: number;
  new_total_xp: number;
  new_level: number;
  level_progress: number;
  badges: AwardedBadge[];
}
export interface TutorReply {
  answer: string;
  is_hint: boolean;
  safe: boolean;
}
export interface MissionDetail {
  slug: string;
  title: string;
  skill: string;
  story: string;
  objective: string;
  activity: string;
  challenge: string;
  project: string;
  homework: string;
  parent_summary: string;
  badge: string;
  estimated_minutes: number;
}

// --- Generators (teacher studio) ---
export interface GenerateRequest {
  mission_slug: string;
  skill: string;
  difficulty?: number;
  count?: number;
}
export interface WorksheetItem {
  prompt: string;
  answer: string | null;
}
export interface Worksheet {
  title: string;
  items: WorksheetItem[];
}
export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}
export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}
export interface Flashcard {
  front: string;
  back: string;
}
export interface FlashcardDeck {
  title: string;
  cards: Flashcard[];
}

// The six-realm World Map (production catalog). Shapes mirror
// logicland-engine/curriculum/worlds.py.
export interface WorldMissionSummary {
  slug: string;
  title: string;
  skill: string;
  badge: string;
  game: string;
  order: number;
  story: string;
  objective: string;
  status: "live" | "soon";
  estimated_minutes: number;
}
export interface LandWorldSummary {
  slug: string;
  title: string;
  subtitle: string;
  theme: string;
  order: number;
  locked: boolean;
  skills: string[];
  missions: WorldMissionSummary[];
}

export const engine = {
  getWorlds: () =>
    engineFetch<{ worlds: LandWorldSummary[] }>("/curriculum/worlds").then(
      (r) => r.worlds,
    ),

  getJourney: () => engineFetch<Journey>("/curriculum/journey"),

  getMission: (slug: string) =>
    engineFetch<MissionDetail>(`/curriculum/mission/${encodeURIComponent(slug)}`),

  generateWorksheet: (body: GenerateRequest) =>
    engineFetch<Worksheet>("/generate/worksheet", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  generateQuiz: (body: GenerateRequest) =>
    engineFetch<Quiz>("/generate/quiz", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  generateFlashcards: (body: GenerateRequest) =>
    engineFetch<FlashcardDeck>("/generate/flashcards", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getProgress: (body: {
    student_id: string;
    completed_missions: string[];
    daily_streak?: number;
  }) =>
    engineFetch<Progress>("/progress/journey", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  completeMission: (body: {
    student_id: string;
    mission_slug: string;
    xp?: number;
    coins?: number;
    stars?: number;
    daily_streak?: number;
    correct?: number;
    total?: number;
    with_project?: boolean;
  }) =>
    engineFetch<MissionReward>("/gamification/mission-complete", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  askTutor: (body: {
    student_id: string;
    question: string;
    mission_slug?: string;
    hint_level?: number;
  }) =>
    engineFetch<TutorReply>("/tutor/ask", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
