import { describe, expect, it } from "vitest";
import { gameDataFor } from "./missions";

// Every leveled game must offer a full 12-level ladder (acceptance requirement),
// with stable unique ids and internally consistent content.

const LEVELED = [
  "shape-match",
  "memory-game",
  "pattern-builder",
  "keyboard-basics",
  "keyboard-words",
  "keyboard-coder",
];

describe("all leveled games reach level 12", () => {
  it.each(LEVELED)("%s has 12 levels with unique ids", (slug) => {
    const data = gameDataFor(slug);
    expect(data, `game data for ${slug}`).not.toBeNull();
    const levels = (data as { levels?: { id: string }[] }).levels ?? [];
    expect(levels.length).toBe(12);
    const ids = levels.map((l) => l.id);
    expect(new Set(ids).size).toBe(12);
  });
});

interface ShapeLevels {
  levels: { content: { rounds: { target: string; options: string[] }[] } }[];
}
interface PatternLevels {
  levels: {
    content: { rounds: { sequence: string[]; options: string[]; answer: string }[] };
  }[];
}

describe("content integrity", () => {
  it("shape-match: every round's options include its target", () => {
    const data = gameDataFor("shape-match") as unknown as ShapeLevels;
    for (const lvl of data.levels) {
      for (const r of lvl.content.rounds) {
        expect(r.options, `target ${r.target}`).toContain(r.target);
      }
    }
  });

  it("pattern-builder: every round's answer is in its options and fills the blank", () => {
    const data = gameDataFor("pattern-builder") as unknown as PatternLevels;
    for (const lvl of data.levels) {
      for (const r of lvl.content.rounds) {
        expect(r.sequence.at(-1)).toBe("?"); // exactly one trailing blank
        expect(r.options).toContain(r.answer);
      }
    }
  });
});
