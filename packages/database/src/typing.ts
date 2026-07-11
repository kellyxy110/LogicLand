// Keyboard-fluency stats persistence for Keyboard Kingdom. One aggregate row per
// student, accumulated each time they clear a typing level. Powers the accuracy
// and words-per-minute readouts on the parent + teacher dashboards.
import { prisma } from "./index";

export interface TypingResultInput {
  /** Total keystrokes this level (correct presses + misses). */
  keysTyped: number;
  /** Correct keystrokes this level. */
  correctKeys: number;
  /** Wrong keystrokes this level. */
  mistakes: number;
  /** Words-per-minute for this level (words = chars / 5). */
  wpm: number;
}

export interface TypingStatView {
  keysTyped: number;
  correctKeys: number;
  mistakes: number;
  bestWpm: number;
  levelsCleared: number;
  /** Rounded accuracy percentage (100 when nothing typed yet). */
  accuracy: number;
}

/** Fold one cleared level into the student's running totals: accumulate
 *  keystrokes, keep the best WPM, and bump the levels-cleared count. */
export async function recordTypingResult(
  studentId: string,
  input: TypingResultInput,
): Promise<void> {
  const wpm = Math.max(0, Math.round(input.wpm));
  await prisma.typingStat.upsert({
    where: { studentId },
    update: {
      keysTyped: { increment: Math.max(0, input.keysTyped) },
      correctKeys: { increment: Math.max(0, input.correctKeys) },
      mistakes: { increment: Math.max(0, input.mistakes) },
      levelsCleared: { increment: 1 },
      // bestWpm is raised (never lowered) by the follow-up updateMany below.
    },
    create: {
      studentId,
      keysTyped: Math.max(0, input.keysTyped),
      correctKeys: Math.max(0, input.correctKeys),
      mistakes: Math.max(0, input.mistakes),
      levelsCleared: 1,
      bestWpm: wpm,
    },
  });
  // Keep the best WPM without a race: only raise it.
  await prisma.typingStat.updateMany({
    where: { studentId, bestWpm: { lt: wpm } },
    data: { bestWpm: wpm },
  });
}

function toView(row: {
  keysTyped: number;
  correctKeys: number;
  mistakes: number;
  bestWpm: number;
  levelsCleared: number;
}): TypingStatView {
  const total = row.keysTyped;
  return {
    keysTyped: row.keysTyped,
    correctKeys: row.correctKeys,
    mistakes: row.mistakes,
    bestWpm: row.bestWpm,
    levelsCleared: row.levelsCleared,
    accuracy: total > 0 ? Math.round((row.correctKeys / total) * 100) : 100,
  };
}

/** A student's typing stats, or null if they haven't typed yet. */
export async function getTypingStat(
  studentId: string,
): Promise<TypingStatView | null> {
  const row = await prisma.typingStat.findUnique({ where: { studentId } });
  return row ? toView(row) : null;
}
