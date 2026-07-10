// Pure rules for Keyboard Kingdom (Typing Town). Given a target token and how
// much has been typed, it decides whether a pressed key advances, completes, or
// is a miss — no React, no DOM — so the keyboard game is deterministic and fully
// unit-testable. The component (features/games/KeyboardQuest.tsx) adds input and
// on-screen keys on top.

/** Turn a KeyboardEvent.key into the character we compare against, or null for
 *  keys that aren't "typing" (Shift, Arrow, Tab, …). Case-insensitive; the
 *  space bar (either spelling) maps to a real space. */
export function typedChar(key: string): string | null {
  if (key === " " || key === "Spacebar" || key === "Space") return " ";
  if (key.length === 1) return key.toLowerCase();
  return null;
}

/** The character the learner should type next in `target`, or null when the
 *  whole token is already typed. */
export function expectedChar(target: string, pos: number): string | null {
  if (pos < 0 || pos >= target.length) return null;
  return target[pos].toLowerCase();
}

export type KeyOutcome = "advance" | "complete" | "miss" | "ignore";

/** Classify a key press against the current token position:
 *  - "ignore": not a typing key (do nothing, not a mistake)
 *  - "miss": a typing key that's the wrong character
 *  - "advance": correct character, more of the token remains
 *  - "complete": correct character that finishes the token */
export function classifyKey(
  target: string,
  pos: number,
  key: string,
): KeyOutcome {
  const c = typedChar(key);
  if (c === null) return "ignore";
  const want = expectedChar(target, pos);
  if (want === null) return "ignore";
  if (c !== want) return "miss";
  return pos + 1 >= target.length ? "complete" : "advance";
}

/** Whether every character of the token has been typed. */
export function isTokenComplete(target: string, pos: number): boolean {
  return pos >= target.length;
}

/** One star for a clean-enough run: at most `threshold` misses across the level.
 *  Mirrors the tap games so "mastered" (stars >= 1) means the same everywhere. */
export function starForTyping(mistakes: number, threshold: number): number {
  return mistakes <= threshold ? 1 : 0;
}

/** Typing accuracy as a 0–100 percentage, for the skills dashboard. Correct
 *  keystrokes over total keystrokes; 100 when nothing has been typed yet. */
export function accuracyPercent(correct: number, mistakes: number): number {
  const total = correct + mistakes;
  if (total <= 0) return 100;
  return Math.round((correct / total) * 100);
}
