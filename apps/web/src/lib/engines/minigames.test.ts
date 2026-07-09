import { describe, expect, it } from "vitest";
import type { PatternRound, ShapeMatchRound } from "@/types/game";
import {
  boardCleared,
  dealMemoryCards,
  isPair,
  patternBlankIndex,
  patternCorrect,
  patternSolved,
  shapeMatchCorrect,
  starForMistakes,
} from "./minigames";

describe("shape match", () => {
  const round: ShapeMatchRound = { target: "🔺", options: ["🔵", "🔺", "🟩"] };
  it("accepts the matching shape and rejects others", () => {
    expect(shapeMatchCorrect(round, "🔺")).toBe(true);
    expect(shapeMatchCorrect(round, "🔵")).toBe(false);
  });
});

describe("pattern builder", () => {
  const round: PatternRound = {
    sequence: ["🔴", "🔵", "🔴", "?"],
    options: ["🔴", "🔵"],
    answer: "🔵",
  };
  it("locates the blank", () => {
    expect(patternBlankIndex(round)).toBe(3);
  });
  it("checks the answer", () => {
    expect(patternCorrect(round, "🔵")).toBe(true);
    expect(patternCorrect(round, "🔴")).toBe(false);
  });
  it("fills the blank when solved", () => {
    expect(patternSolved(round)).toEqual(["🔴", "🔵", "🔴", "🔵"]);
  });
});

describe("memory", () => {
  const faces = ["🍎", "⭐", "🌲"];
  // Identity shuffle keeps the deal deterministic for assertions.
  const identity = <T>(x: T[]) => x;

  it("deals two of every face with unique ids", () => {
    const cards = dealMemoryCards(faces, identity);
    expect(cards).toHaveLength(6);
    expect(new Set(cards.map((c) => c.id)).size).toBe(6);
    for (const face of faces) {
      expect(cards.filter((c) => c.face === face)).toHaveLength(2);
    }
  });

  it("recognizes a pair only across distinct cards of the same face", () => {
    const cards = dealMemoryCards(faces, identity);
    expect(isPair(cards[0], cards[1])).toBe(true); // 🍎,🍎
    expect(isPair(cards[0], cards[0])).toBe(false); // same card
    expect(isPair(cards[0], cards[2])).toBe(false); // 🍎,⭐
  });

  it("clears the board when all faces are matched", () => {
    expect(boardCleared(2, 3)).toBe(false);
    expect(boardCleared(3, 3)).toBe(true);
  });
});

describe("star scoring", () => {
  it("awards a star only within the mistake threshold", () => {
    expect(starForMistakes(0, 2)).toBe(1);
    expect(starForMistakes(2, 2)).toBe(1);
    expect(starForMistakes(3, 2)).toBe(0);
  });
});
