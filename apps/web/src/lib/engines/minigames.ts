// Pure logic for the tap-based Logic Forest mini-games (Shape Match, Memory,
// Pattern Builder). No React, no randomness baked in (shuffle is injectable), so
// every rule is deterministic and unit-testable — the same discipline as the
// robot engine. Components own presentation; these own correctness.
import type { PatternRound, ShapeMatchRound } from "@/types/game";

/** The blank slot in a pattern round is marked with "?". */
export const PATTERN_BLANK = "?";

// --- Shape Match ----------------------------------------------------------
export function shapeMatchCorrect(round: ShapeMatchRound, choice: string): boolean {
  return choice === round.target;
}

// --- Pattern Builder ------------------------------------------------------
export function patternBlankIndex(round: PatternRound): number {
  return round.sequence.indexOf(PATTERN_BLANK);
}

export function patternCorrect(round: PatternRound, choice: string): boolean {
  return choice === round.answer;
}

/** The completed pattern once the correct answer is placed. */
export function patternSolved(round: PatternRound): string[] {
  const i = patternBlankIndex(round);
  if (i < 0) return round.sequence;
  const filled = [...round.sequence];
  filled[i] = round.answer;
  return filled;
}

// --- Memory (matching pairs) ----------------------------------------------
export interface MemoryCard {
  id: number;
  face: string;
}

type Shuffle = <T>(items: T[]) => T[];

/** Fisher–Yates. Isolated so tests can inject a deterministic shuffle. */
export const defaultShuffle: Shuffle = (items) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Build a shuffled board where each face appears exactly twice. */
export function dealMemoryCards(
  faces: string[],
  shuffle: Shuffle = defaultShuffle,
): MemoryCard[] {
  const doubled = faces.flatMap((face) => [face, face]);
  return shuffle(doubled).map((face, id) => ({ id, face }));
}

/** Two distinct cards form a pair when their faces match. */
export function isPair(a: MemoryCard, b: MemoryCard): boolean {
  return a.id !== b.id && a.face === b.face;
}

/** The board is cleared once every face's pair has been matched. */
export function boardCleared(matchedFaces: number, totalFaces: number): boolean {
  return matchedFaces >= totalFaces;
}

/** One bonus star when the child stayed at or under the mistake threshold. */
export function starForMistakes(mistakes: number, threshold: number): number {
  return mistakes <= threshold ? 1 : 0;
}
