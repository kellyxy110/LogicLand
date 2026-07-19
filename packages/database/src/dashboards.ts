// Read models for the teacher + parent dashboards. Kept beside the schema so
// the persistence shape stays in one place. These are pure reads; the web tier
// passes Clerk identity and renders the result.
import { prisma } from "./index";

/** Flat, UI-friendly view of a student's progress. Shared by teacher roster
 *  rows and parent child cards. */
export interface StudentProgress {
  id: string;
  displayName: string;
  email: string;
  ageYears: number | null;
  level: number;
  xp: number;
  coins: number;
  stars: number;
  dailyStreak: number;
  completedMissions: string[];
  earnedBadges: string[];
  lastActiveOn: Date | null;
  /** Keyboard-fluency summary, when the student has typed. */
  typing: { accuracy: number; bestWpm: number } | null;
  /** Math Fix™ summary across topics, when the student has practised. The
   *  `lastMisconception` is a misconception id — the web tier maps it to a label. */
  math: {
    topicsStarted: number;
    topicsMastered: number;
    accuracy: number;
    lastMisconception: string | null;
  } | null;
}

interface MathRow {
  attempts: number;
  correct: number;
  mastered: boolean;
  lastMisconception: string | null;
}

interface StudentRow {
  id: string;
  displayName: string;
  ageYears: number | null;
  level: number;
  xp: number;
  coins: number;
  stars: number;
  dailyStreak: number;
  completedMissions: string[];
  earnedBadges: string[];
  lastActiveOn: Date | null;
  user: { email: string };
  typingStat: {
    keysTyped: number;
    correctKeys: number;
    bestWpm: number;
  } | null;
  mathMastery: MathRow[];
}

function toMath(rows: MathRow[]): StudentProgress["math"] {
  if (rows.length === 0) return null;
  const attempts = rows.reduce((a, r) => a + r.attempts, 0);
  const correct = rows.reduce((a, r) => a + r.correct, 0);
  return {
    topicsStarted: rows.length,
    topicsMastered: rows.filter((r) => r.mastered).length,
    accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    lastMisconception: rows.find((r) => r.lastMisconception)?.lastMisconception ?? null,
  };
}

function toProgress(s: StudentRow): StudentProgress {
  const t = s.typingStat;
  return {
    id: s.id,
    displayName: s.displayName,
    email: s.user.email,
    ageYears: s.ageYears,
    level: s.level,
    xp: s.xp,
    coins: s.coins,
    stars: s.stars,
    dailyStreak: s.dailyStreak,
    completedMissions: s.completedMissions,
    earnedBadges: s.earnedBadges,
    lastActiveOn: s.lastActiveOn,
    typing: t
      ? {
          accuracy: t.keysTyped > 0 ? Math.round((t.correctKeys / t.keysTyped) * 100) : 100,
          bestWpm: t.bestWpm,
        }
      : null,
    math: toMath(s.mathMastery),
  };
}

const TYPING_SELECT = {
  select: { keysTyped: true, correctKeys: true, bestWpm: true },
} as const;

const MATH_SELECT = {
  select: { attempts: true, correct: true, mastered: true, lastMisconception: true },
  orderBy: { updatedAt: "desc" },
} as const;

/** Every student in the classroom. V1 is a single classroom (one teacher), so
 *  the roster is all students, most-recently-active first. */
export async function listClassroomStudents(): Promise<StudentProgress[]> {
  const rows = await prisma.student.findMany({
    include: {
      user: { select: { email: true } },
      typingStat: TYPING_SELECT,
      mathMastery: MATH_SELECT,
    },
    orderBy: [{ lastActiveOn: { sort: "desc", nulls: "last" } }, { xp: "desc" }],
  });
  return rows.map(toProgress);
}

/** The children linked to the signed-in parent (by Clerk id). Empty if the
 *  parent has no linked children yet. */
export async function getParentChildren(
  clerkId: string,
): Promise<StudentProgress[]> {
  const rows = await prisma.student.findMany({
    where: { parent: { user: { clerkId } } },
    include: {
      user: { select: { email: true } },
      typingStat: TYPING_SELECT,
      mathMastery: MATH_SELECT,
    },
    orderBy: { displayName: "asc" },
  });
  return rows.map(toProgress);
}
