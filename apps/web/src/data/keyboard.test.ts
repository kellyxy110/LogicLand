import { describe, expect, it } from "vitest";
import { gameDataFor } from "./missions";
import { KEYBOARD_KINGDOM_WORLD, KEYBOARD_QUEST } from "./keyboard";

// Guards the Keyboard Kingdom world ↔ game wiring so a live mission can never
// ship without a playable game behind it, and the ladder keeps its 7+ levels.

describe("Keyboard Kingdom catalog", () => {
  it("has the keyboard theme and is unlocked/playable", () => {
    expect(KEYBOARD_KINGDOM_WORLD.theme).toBe("keyboard");
    expect(KEYBOARD_KINGDOM_WORLD.locked).toBe(false);
    expect(KEYBOARD_KINGDOM_WORLD.missions.length).toBeGreaterThan(0);
  });

  it("every LIVE mission resolves to real game data", () => {
    const live = KEYBOARD_KINGDOM_WORLD.missions.filter((m) => m.status === "live");
    expect(live.length).toBeGreaterThan(0);
    for (const m of live) {
      const data = gameDataFor(m.slug);
      expect(data, `game data for ${m.slug}`).not.toBeNull();
      expect(["key-quest", "balloon-pop"]).toContain(data!.kind);
    }
  });
});

describe("KEYBOARD_QUEST ladder", () => {
  it("has at least 7 levels with unique ids and non-empty targets", () => {
    expect(KEYBOARD_QUEST.levels.length).toBeGreaterThanOrEqual(7);
    const ids = KEYBOARD_QUEST.levels.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of KEYBOARD_QUEST.levels) {
      expect(l.content.targets.length).toBeGreaterThan(0);
      expect(l.content.targets.every((t) => t.length > 0)).toBe(true);
    }
  });

  it("grows in difficulty: single keys early, words/sentences later", () => {
    const first = KEYBOARD_QUEST.levels[0].content.targets;
    const last = KEYBOARD_QUEST.levels.at(-1)!.content.targets;
    // Level 1 tokens are single keys; the final level types whole words.
    expect(first.every((t) => t.length === 1)).toBe(true);
    expect(last.some((t) => t.length > 1)).toBe(true);
  });
});
