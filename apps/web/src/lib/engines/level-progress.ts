// Pure rules for a game's level ladder: which level a learner is on, what's
// unlocked, and how a completion updates their record. No React, no storage —
// data in, verdict out — so the rules are deterministic and unit-testable. The
// client hook (features/games/useLevelProgress.ts) adds persistence on top.
import type { GameLevel } from "@/types/game";

export interface LevelRecord {
  /** Cleared at least once. */
  done: boolean;
  /** Best stars ever earned on this level (never decreases on replay). */
  stars: number;
  /** How many times the level has been attempted (played to completion). */
  attempts: number;
}

/** Per-mission progress, keyed by level id. Absent id = never played. */
export type LevelProgress = Record<string, LevelRecord>;

/** Status a level tile shows on the ladder. */
export type LevelStatus = "locked" | "available" | "completed" | "mastered";

/** Index of the first not-yet-cleared level, or levels.length when all done.
 *  This is where a returning learner resumes — never back at level 1. */
export function currentLevelIndex<C>(
  levels: GameLevel<C>[],
  progress: LevelProgress,
): number {
  const i = levels.findIndex((l) => !progress[l.id]?.done);
  return i === -1 ? levels.length : i;
}

/** A level unlocks once the previous one is cleared. Level 1 is always open. */
export function isLevelUnlocked<C>(
  levels: GameLevel<C>[],
  progress: LevelProgress,
  index: number,
): boolean {
  if (index <= 0) return true;
  const prev = levels[index - 1];
  return !!prev && !!progress[prev.id]?.done;
}

/** Ladder status for a single level: locked until unlocked; mastered when it
 *  was cleared with a full star (no misses); completed otherwise. */
export function levelStatus<C>(
  levels: GameLevel<C>[],
  progress: LevelProgress,
  index: number,
): LevelStatus {
  const level = levels[index];
  const rec = level ? progress[level.id] : undefined;
  if (rec?.done) return rec.stars >= 1 ? "mastered" : "completed";
  return isLevelUnlocked(levels, progress, index) ? "available" : "locked";
}

/** Fold a completed attempt into the record: keep the best stars, count the
 *  attempt, and mark it done. Immutable — returns a new progress map. */
export function recordCompletion(
  progress: LevelProgress,
  levelId: string,
  stars: number,
): LevelProgress {
  const prev = progress[levelId] ?? { done: false, stars: 0, attempts: 0 };
  return {
    ...progress,
    [levelId]: {
      done: true,
      stars: Math.max(prev.stars, stars),
      attempts: prev.attempts + 1,
    },
  };
}

export function allLevelsComplete<C>(
  levels: GameLevel<C>[],
  progress: LevelProgress,
): boolean {
  return levels.length > 0 && levels.every((l) => progress[l.id]?.done);
}

/** Total best stars across every level — the mission's headline score. */
export function totalStars<C>(
  levels: GameLevel<C>[],
  progress: LevelProgress,
): number {
  return levels.reduce((sum, l) => sum + (progress[l.id]?.stars ?? 0), 0);
}

/** Reconcile two progress maps (e.g. local cache + server record). For each
 *  level: done if either says done, best stars kept, highest attempt count.
 *  Commutative, so sync order never matters. */
export function mergeProgress(
  a: LevelProgress,
  b: LevelProgress,
): LevelProgress {
  const out: LevelProgress = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[id];
    const y = b[id];
    out[id] = {
      done: !!x?.done || !!y?.done,
      stars: Math.max(x?.stars ?? 0, y?.stars ?? 0),
      attempts: Math.max(x?.attempts ?? 0, y?.attempts ?? 0),
    };
  }
  return out;
}
