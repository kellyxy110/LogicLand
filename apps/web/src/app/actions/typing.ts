"use server";
// Keyboard Kingdom typing telemetry. The keyboard game reports how a level went
// (keystrokes, accuracy, WPM); we fold it into the student's running stats for
// the parent + teacher dashboards. Resilient: never blocks play if the DB hiccups.
import {
  getTypingStat as dbGetTypingStat,
  recordTypingResult,
  type TypingResultInput,
  type TypingStatView,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";

export async function recordTyping(input: TypingResultInput): Promise<void> {
  try {
    const student = await currentStudent();
    await recordTypingResult(student.id, input);
  } catch (err) {
    console.error(
      "[recordTyping] could not save typing stats:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getMyTypingStat(): Promise<TypingStatView | null> {
  try {
    const student = await currentStudent();
    return dbGetTypingStat(student.id);
  } catch {
    return null;
  }
}
