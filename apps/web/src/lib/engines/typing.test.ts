import { describe, expect, it } from "vitest";
import {
  accuracyPercent,
  classifyKey,
  expectedChar,
  isTokenComplete,
  starForTyping,
  typedChar,
} from "./typing";

describe("typedChar", () => {
  it("lowercases single printable keys and maps space", () => {
    expect(typedChar("A")).toBe("a");
    expect(typedChar("m")).toBe("m");
    expect(typedChar(" ")).toBe(" ");
    expect(typedChar("Spacebar")).toBe(" ");
  });
  it("ignores non-typing keys", () => {
    expect(typedChar("Shift")).toBeNull();
    expect(typedChar("ArrowLeft")).toBeNull();
    expect(typedChar("Enter")).toBeNull();
  });
});

describe("classifyKey", () => {
  it("advances through a word and completes on the last letter", () => {
    const t = "cat";
    expect(classifyKey(t, 0, "c")).toBe("advance");
    expect(classifyKey(t, 1, "A")).toBe("advance"); // case-insensitive
    expect(classifyKey(t, 2, "t")).toBe("complete");
  });
  it("flags a wrong letter as a miss without advancing", () => {
    expect(classifyKey("cat", 0, "x")).toBe("miss");
  });
  it("ignores modifier keys (not a mistake)", () => {
    expect(classifyKey("cat", 0, "Shift")).toBe("ignore");
  });
  it("matches spaces inside a sentence", () => {
    const s = "i am";
    expect(classifyKey(s, 1, " ")).toBe("advance");
  });
  it("single-character token completes immediately", () => {
    expect(classifyKey("a", 0, "a")).toBe("complete");
  });
});

describe("expectedChar / isTokenComplete", () => {
  it("reports the next needed character, then null at the end", () => {
    expect(expectedChar("hi", 0)).toBe("h");
    expect(expectedChar("hi", 1)).toBe("i");
    expect(expectedChar("hi", 2)).toBeNull();
    expect(isTokenComplete("hi", 2)).toBe(true);
    expect(isTokenComplete("hi", 1)).toBe(false);
  });
});

describe("scoring", () => {
  it("awards the star only within the miss threshold", () => {
    expect(starForTyping(0, 2)).toBe(1);
    expect(starForTyping(2, 2)).toBe(1);
    expect(starForTyping(3, 2)).toBe(0);
  });
  it("computes accuracy, defaulting to 100 before any typing", () => {
    expect(accuracyPercent(0, 0)).toBe(100);
    expect(accuracyPercent(9, 1)).toBe(90);
    expect(accuracyPercent(3, 1)).toBe(75);
  });
});
