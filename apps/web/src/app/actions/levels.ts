"use server";
// Level-progress persistence. The tap games cache progress in localStorage for
// instant, offline play, and call these actions to mirror it into the database
// so it survives across devices and is visible on the parent/teacher dashboards.
import {
  getLevelRecords as dbGetLevelRecords,
  saveLevelResult as dbSaveLevelResult,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";
import type { LevelProgress } from "@/lib/engines/level-progress";

/** Persist one level clear (keeps best stars server-side). Fire-and-forget from
 *  the client — a failure just leaves the localStorage cache as the record. */
export async function saveLevelResult(
  missionSlug: string,
  levelId: string,
  stars: number,
): Promise<void> {
  const student = await currentStudent();
  await dbSaveLevelResult(student.id, { missionSlug, levelId, stars });
}

/** The signed-in student's saved level records for one mission, shaped as the
 *  client's LevelProgress map so the hook can merge it with its local cache. */
export async function getLevelRecords(
  missionSlug: string,
): Promise<LevelProgress> {
  const student = await currentStudent();
  const rows = await dbGetLevelRecords(student.id, missionSlug);
  const progress: LevelProgress = {};
  for (const r of rows) {
    progress[r.levelId] = {
      done: r.completed,
      stars: r.bestStars,
      attempts: r.attempts,
    };
  }
  return progress;
}
