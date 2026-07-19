// Math Fix™ mastery persistence. One aggregate row per (student, topic),
// accumulated each time the learner answers a question. Powers the mastery,
// accuracy and "idea to reteach" readouts on the parent + teacher dashboards.
import { prisma } from "./index";

export interface MathAttemptInput {
  /** The topic id, e.g. "linear-equations" or "order-of-operations". */
  topicId: string;
  /** Whether this single attempt was correct. */
  correct: boolean;
  /** The learner's current difficulty tier after this attempt (1–6). */
  difficulty: number;
  /** Current correct-streak after this attempt. */
  streak: number;
  /** Whether the topic is now mastered (stays true once earned). */
  mastered: boolean;
  /** Misconception id identified on a wrong answer, if any. */
  misconceptionId?: string | null;
}

export interface MathMasteryView {
  topicId: string;
  attempts: number;
  correct: number;
  /** Rounded accuracy percentage (0 when nothing attempted yet). */
  accuracy: number;
  bestStreak: number;
  difficulty: number;
  mastered: boolean;
  /** The most recent misconception seen — what a teacher should reteach. */
  lastMisconception: string | null;
}

/** Fold one answered question into the student's per-topic mastery totals. */
export async function recordMathAttempt(
  studentId: string,
  input: MathAttemptInput,
): Promise<void> {
  const streak = Math.max(0, Math.round(input.streak));
  await prisma.mathMastery.upsert({
    where: { studentId_topicId: { studentId, topicId: input.topicId } },
    update: {
      attempts: { increment: 1 },
      correct: { increment: input.correct ? 1 : 0 },
      difficulty: input.difficulty,
      // Clear the flag on a correct answer; on a wrong+identified answer record
      // the idea; on a wrong+unidentified slip leave the previous note alone.
      lastMisconception: input.correct ? null : input.misconceptionId ?? undefined,
      ...(input.mastered ? { mastered: true } : {}),
    },
    create: {
      studentId,
      topicId: input.topicId,
      attempts: 1,
      correct: input.correct ? 1 : 0,
      bestStreak: streak,
      difficulty: input.difficulty,
      mastered: input.mastered,
      lastMisconception: input.correct ? null : input.misconceptionId ?? null,
    },
  });
  // Raise the best streak without a race (only ever upward).
  await prisma.mathMastery.updateMany({
    where: { studentId, topicId: input.topicId, bestStreak: { lt: streak } },
    data: { bestStreak: streak },
  });
}

function toView(row: {
  topicId: string;
  attempts: number;
  correct: number;
  bestStreak: number;
  difficulty: number;
  mastered: boolean;
  lastMisconception: string | null;
}): MathMasteryView {
  return {
    topicId: row.topicId,
    attempts: row.attempts,
    correct: row.correct,
    accuracy: row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0,
    bestStreak: row.bestStreak,
    difficulty: row.difficulty,
    mastered: row.mastered,
    lastMisconception: row.lastMisconception,
  };
}

/** All of a student's Math Fix topic mastery, newest activity first. */
export async function getMathMastery(studentId: string): Promise<MathMasteryView[]> {
  const rows = await prisma.mathMastery.findMany({
    where: { studentId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toView);
}
