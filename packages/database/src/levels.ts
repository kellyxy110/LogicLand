// Per-level progress persistence, keyed by curriculum slugs (FK-free, matching
// the denormalized Student.completedMissions approach). The client cache
// (localStorage) syncs into these rows so progress survives across devices and
// is visible to parents and teachers.
import { prisma } from "./index";

export interface LevelResultInput {
  missionSlug: string;
  levelId: string;
  /** Stars earned this attempt; the row keeps the best ever. */
  stars: number;
}

export interface LevelRecord {
  missionSlug: string;
  levelId: string;
  bestStars: number;
  attempts: number;
  completed: boolean;
}

/** Record one level clear: keep the best stars, bump the attempt count. */
export async function saveLevelResult(
  studentId: string,
  input: LevelResultInput,
): Promise<void> {
  const key = {
    studentId_missionSlug_levelId: {
      studentId,
      missionSlug: input.missionSlug,
      levelId: input.levelId,
    },
  };
  const existing = await prisma.levelProgress.findUnique({ where: key });
  const bestStars = Math.max(existing?.bestStars ?? 0, input.stars);
  await prisma.levelProgress.upsert({
    where: key,
    update: { bestStars, attempts: { increment: 1 }, completed: true },
    create: {
      studentId,
      missionSlug: input.missionSlug,
      levelId: input.levelId,
      bestStars: input.stars,
      attempts: 1,
      completed: true,
    },
  });
  await prisma.student.update({
    where: { id: studentId },
    data: { lastActiveOn: new Date() },
  });
}

/** All level rows for a student, optionally filtered to one mission. */
export async function getLevelRecords(
  studentId: string,
  missionSlug?: string,
): Promise<LevelRecord[]> {
  const rows = await prisma.levelProgress.findMany({
    where: { studentId, ...(missionSlug ? { missionSlug } : {}) },
    orderBy: [{ missionSlug: "asc" }, { levelId: "asc" }],
  });
  return rows.map((r) => ({
    missionSlug: r.missionSlug,
    levelId: r.levelId,
    bestStars: r.bestStars,
    attempts: r.attempts,
    completed: r.completed,
  }));
}
