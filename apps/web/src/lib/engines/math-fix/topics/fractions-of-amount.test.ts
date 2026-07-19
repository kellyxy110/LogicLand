import { describe, expect, it } from "vitest";
import {
  FRACTIONS_OF_AMOUNT,
  _internals,
  renderFrac,
  solveFrac,
} from "./fractions-of-amount";
import { mathTopicById, MATH_TOPICS } from "../registry";

const frac = (n: number, d: number, amount: number) => ({
  id: "t",
  difficulty: 1,
  n,
  d,
  amount,
});

describe("Fractions of an Amount — rendering & solving", () => {
  it("renders and solves 3/4 of 12", () => {
    const p = frac(3, 4, 12);
    expect(renderFrac(p)).toBe("3/4 of 12");
    expect(solveFrac(p)).toBe(9);
  });
});

describe("Fractions of an Amount — diagnosis", () => {
  it("gave one part only: 3/4 of 12 answered 3 → one-part-only", () => {
    // 12 ÷ 4 = 3, but they forgot to × 3. Correct = 9.
    const d = _internals.diagnoseFrac(frac(3, 4, 12), 3);
    expect(d.correct).toBe(false);
    expect(d.correctAnswer).toBe(9);
    expect(d.misconception?.id).toBe("one-part-only");
  });

  it("divided by the top: 2/3 of 12 answered 6 → divided-by-numerator", () => {
    // 12 ÷ 2 = 6 (used the numerator to divide). Correct = 8. One-part-only would
    // be 12 ÷ 3 = 4, so 6 uniquely matches divided-by-numerator.
    const d = _internals.diagnoseFrac(frac(2, 3, 12), 6);
    expect(d.correctAnswer).toBe(8);
    expect(d.misconception?.id).toBe("divided-by-numerator");
  });

  it("marks the correct answer correct", () => {
    expect(_internals.diagnoseFrac(frac(3, 4, 12), 9).correct).toBe(true);
  });

  it("no misconception for an unrecognised slip", () => {
    expect(_internals.diagnoseFrac(frac(3, 4, 12), 99).misconception).toBeNull();
  });
});

describe("Fractions of an Amount — generation & wiring", () => {
  it("generates whole-number answers across every tier", () => {
    for (let d = 1; d <= 6; d++) {
      for (let i = 0; i < 40; i++) {
        const p = FRACTIONS_OF_AMOUNT.generate(d);
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThan(0);
        expect(p.difficulty).toBe(d);
      }
    }
  });

  it("is registered as a third resolvable topic", () => {
    expect(mathTopicById("fractions-of-amount")).toBe(FRACTIONS_OF_AMOUNT);
    expect(MATH_TOPICS.length).toBeGreaterThanOrEqual(3);
  });
});
