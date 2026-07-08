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
}

function toProgress(s: StudentRow): StudentProgress {
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
  };
}

/** Every student in the classroom. V1 is a single classroom (one teacher), so
 *  the roster is all students, most-recently-active first. */
export async function listClassroomStudents(): Promise<StudentProgress[]> {
  const rows = await prisma.student.findMany({
    include: { user: { select: { email: true } } },
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
    include: { user: { select: { email: true } } },
    orderBy: { displayName: "asc" },
  });
  return rows.map(toProgress);
}
