import { describe, expect, it } from "vitest";
import {
  PERCENTAGES_OF_AMOUNT,
  _internals,
  renderPct,
  solvePct,
} from "./percentages-of-amount";
import { mathTopicById, MATH_TOPICS } from "../registry";

const pct = (percent: number, amount: number) => ({
  id: "t",
  difficulty: 1,
  percent,
  amount,
});

describe("Percentages of an Amount — rendering & solving", () => {
  it("renders and solves 20% of 60", () => {
    const p = pct(20, 60);
    expect(renderPct(p)).toBe("20% of 60");
    expect(solvePct(p)).toBe(12);
  });
});

describe("Percentages of an Amount — diagnosis", () => {
  it("forgot to divide by 100: 20% of 60 answered 1200", () => {
    const d = _internals.diagnosePct(pct(20, 60), 1200);
    expect(d.correct).toBe(false);
    expect(d.correctAnswer).toBe(12);
    expect(d.misconception?.id).toBe("forgot-divide-100");
  });

  it("found 10% and stopped: 30% of 80 answered 8 → ten-percent-only", () => {
    // Correct = 24. 10% of 80 = 8, so 8 uniquely matches "found 10% and stopped".
    const d = _internals.diagnosePct(pct(30, 80), 8);
    expect(d.correctAnswer).toBe(24);
    expect(d.misconception?.id).toBe("ten-percent-only");
  });

  it("subtracted the percent: 25% of 80 answered 55 → subtracted-percent", () => {
    // Correct = 20. 80 − 25 = 55. (25% is not a multiple of ten, so ten-percent
    // never applies here.)
    const d = _internals.diagnosePct(pct(25, 80), 55);
    expect(d.correctAnswer).toBe(20);
    expect(d.misconception?.id).toBe("subtracted-percent");
  });

  it("marks the correct answer correct", () => {
    expect(_internals.diagnosePct(pct(20, 60), 12).correct).toBe(true);
  });

  it("no misconception for an unrecognised slip", () => {
    expect(_internals.diagnosePct(pct(20, 60), 99).misconception).toBeNull();
  });
});

describe("Percentages of an Amount — generation & wiring", () => {
  it("generates whole-number answers across every tier", () => {
    for (let d = 1; d <= 6; d++) {
      for (let i = 0; i < 40; i++) {
        const p = PERCENTAGES_OF_AMOUNT.generate(d);
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThan(0);
        expect(p.difficulty).toBe(d);
      }
    }
  });

  it("is registered as a fourth resolvable topic", () => {
    expect(mathTopicById("percentages-of-amount")).toBe(PERCENTAGES_OF_AMOUNT);
    expect(MATH_TOPICS.length).toBeGreaterThanOrEqual(4);
  });
});
