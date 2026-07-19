// Math Fix™ — adaptive mastery. Pure state transitions: correct answers build a
// streak and step the difficulty up; a wrong answer eases the difficulty back so
// the next question repairs rather than punishes. "Mastered" means the child has
// cleared the top tier with a clean streak. No randomness, no side effects — the
// UI and tests both drive it deterministically.
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "./problems";

/** Correct answers in a row needed to step up a tier (and to master the top). */
export const STREAK_TO_ADVANCE = 3;

export interface MasteryState {
  attempts: number;
  correct: number;
  /** Current run of correct answers at the active difficulty. */
  streak: number;
  bestStreak: number;
  /** Active difficulty tier (1–6) — the next problem is generated at this. */
  difficulty: number;
  mastered: boolean;
}

export const START_MASTERY: MasteryState = {
  attempts: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  difficulty: MIN_DIFFICULTY,
  mastered: false,
};

/** Advance the mastery state after one graded attempt. */
export function afterAttempt(state: MasteryState, wasCorrect: boolean): MasteryState {
  const attempts = state.attempts + 1;
  if (!wasCorrect) {
    // Ease down a tier so the next problem targets the shaky idea; keep mastery
    // once earned (a later slip doesn't erase that they got there).
    return {
      ...state,
      attempts,
      streak: 0,
      difficulty: Math.max(MIN_DIFFICULTY, state.difficulty - 1),
    };
  }

  const streak = state.streak + 1;
  const bestStreak = Math.max(state.bestStreak, streak);
  const correct = state.correct + 1;

  if (streak >= STREAK_TO_ADVANCE) {
    if (state.difficulty >= MAX_DIFFICULTY) {
      return { ...state, attempts, correct, streak, bestStreak, mastered: true };
    }
    // Step up a tier and start a fresh streak at the harder level.
    return {
      ...state,
      attempts,
      correct,
      streak: 0,
      bestStreak,
      difficulty: state.difficulty + 1,
    };
  }

  return { ...state, attempts, correct, streak, bestStreak };
}

/** 0–100 progress toward mastering the topic: how far up the tiers, plus partial
 *  credit for the current streak within the active tier. */
export function masteryPercent(state: MasteryState): number {
  if (state.mastered) return 100;
  const tiers = MAX_DIFFICULTY - MIN_DIFFICULTY + 1;
  const cleared = state.difficulty - MIN_DIFFICULTY;
  const withinTier = Math.min(state.streak, STREAK_TO_ADVANCE) / STREAK_TO_ADVANCE;
  return Math.min(99, Math.round(((cleared + withinTier) / tiers) * 100));
}

/** Accuracy so far (0–100), for the child's encouragement and the dashboards. */
export function accuracyPercent(state: MasteryState): number {
  if (state.attempts === 0) return 0;
  return Math.round((state.correct / state.attempts) * 100);
}
