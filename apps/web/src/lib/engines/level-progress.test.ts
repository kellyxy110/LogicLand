import { describe, expect, it } from "vitest";
import type { GameLevel } from "@/types/game";
import {
  allLevelsComplete,
  currentLevelIndex,
  isLevelUnlocked,
  levelStatus,
  recordCompletion,
  totalStars,
  type LevelProgress,
} from "./level-progress";

const levels: GameLevel<null>[] = [
  { id: "l1", title: "Discovery", objective: "", content: null },
  { id: "l2", title: "Practice", objective: "", content: null },
  { id: "l3", title: "Mastery", objective: "", content: null },
];

describe("currentLevelIndex", () => {
  it("starts at 0 with no progress and resumes at the first unfinished level", () => {
    expect(currentLevelIndex(levels, {})).toBe(0);
    expect(currentLevelIndex(levels, { l1: { done: true, stars: 1, attempts: 1 } })).toBe(1);
  });
  it("returns levels.length when every level is done (never loops to 0)", () => {
    const all: LevelProgress = {
      l1: { done: true, stars: 1, attempts: 1 },
      l2: { done: true, stars: 0, attempts: 2 },
      l3: { done: true, stars: 1, attempts: 1 },
    };
    expect(currentLevelIndex(levels, all)).toBe(3);
  });
});

describe("isLevelUnlocked", () => {
  it("opens level 1 by default and the next only after the previous is cleared", () => {
    expect(isLevelUnlocked(levels, {}, 0)).toBe(true);
    expect(isLevelUnlocked(levels, {}, 1)).toBe(false);
    expect(isLevelUnlocked(levels, { l1: { done: true, stars: 0, attempts: 1 } }, 1)).toBe(true);
    expect(isLevelUnlocked(levels, { l1: { done: true, stars: 0, attempts: 1 } }, 2)).toBe(false);
  });
});

describe("levelStatus", () => {
  it("reports locked / available / completed / mastered", () => {
    const p: LevelProgress = {
      l1: { done: true, stars: 1, attempts: 1 }, // no-miss clear
      l2: { done: true, stars: 0, attempts: 3 }, // cleared with misses
    };
    expect(levelStatus(levels, p, 0)).toBe("mastered");
    expect(levelStatus(levels, p, 1)).toBe("completed");
    expect(levelStatus(levels, p, 2)).toBe("available");
    expect(levelStatus(levels, {}, 2)).toBe("locked");
  });
});

describe("recordCompletion", () => {
  it("keeps the best stars and counts attempts without mutating input", () => {
    const p0: LevelProgress = {};
    const p1 = recordCompletion(p0, "l1", 0);
    expect(p1.l1).toEqual({ done: true, stars: 0, attempts: 1 });
    const p2 = recordCompletion(p1, "l1", 1); // replay does better
    expect(p2.l1).toEqual({ done: true, stars: 1, attempts: 2 });
    const p3 = recordCompletion(p2, "l1", 0); // replay does worse — best kept
    expect(p3.l1.stars).toBe(1);
    expect(p0).toEqual({}); // original untouched
  });
});

describe("mastery + scoring", () => {
  it("allLevelsComplete only when every level is done", () => {
    expect(allLevelsComplete(levels, {})).toBe(false);
    const almost: LevelProgress = {
      l1: { done: true, stars: 1, attempts: 1 },
      l2: { done: true, stars: 1, attempts: 1 },
    };
    expect(allLevelsComplete(levels, almost)).toBe(false);
    const all = recordCompletion(almost, "l3", 1);
    expect(allLevelsComplete(levels, all)).toBe(true);
  });
  it("totalStars sums best stars across levels", () => {
    const p: LevelProgress = {
      l1: { done: true, stars: 1, attempts: 1 },
      l2: { done: true, stars: 0, attempts: 1 },
      l3: { done: true, stars: 1, attempts: 1 },
    };
    expect(totalStars(levels, p)).toBe(2);
  });
});
