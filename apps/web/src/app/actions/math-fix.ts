"use server";
// Math Fix™ mastery telemetry. Each answered question reports how it went; we
// fold it into the student's per-topic mastery for the parent + teacher
// dashboards. Resilient: never blocks practice if the DB hiccups, and silently
// no-ops for a signed-in user who isn't a student (teacher/parent trying it out).
import {
  getMathMastery as dbGetMathMastery,
  recordMathAttempt,
  type MathAttemptInput,
  type MathMasteryView,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";

export async function recordMathAttemptAction(input: MathAttemptInput): Promise<void> {
  try {
    const student = await currentStudent();
    await recordMathAttempt(student.id, input);
  } catch (err) {
    console.error(
      "[recordMathAttempt] could not save math mastery:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getMyMathMastery(): Promise<MathMasteryView[]> {
  try {
    const student = await currentStudent();
    return dbGetMathMastery(student.id);
  } catch {
    return [];
  }
}
