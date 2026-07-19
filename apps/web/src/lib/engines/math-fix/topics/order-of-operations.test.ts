import { describe, expect, it } from "vitest";
import { ORDER_OF_OPERATIONS, _internals, renderExpr, solveExpr } from "./order-of-operations";
import { mathTopicById, MATH_TOPICS } from "../registry";

const addMul = (a: number, b: number, c: number) =>
  ({ id: "t", difficulty: 1, kind: "add_mul" as const, a, b, c });
const bracketsMul = (a: number, b: number, c: number) =>
  ({ id: "t", difficulty: 4, kind: "brackets_mul" as const, a, b, c });
const subMul = (a: number, b: number, c: number) =>
  ({ id: "t", difficulty: 2, kind: "sub_mul" as const, a, b, c });

describe("Order of Operations — rendering & solving", () => {
  it("renders and solves the canonical example", () => {
    const e = addMul(2, 3, 4);
    expect(renderExpr(e)).toBe("2 + 3 × 4");
    expect(solveExpr(e)).toBe(14); // not 20
  });

  it("respects brackets and subtraction precedence", () => {
    expect(solveExpr(bracketsMul(2, 3, 4))).toBe(20); // (2+3)×4
    expect(solveExpr(subMul(14, 3, 4))).toBe(2); // 14 − 3×4
  });
});

describe("Order of Operations — misconception diagnosis", () => {
  it("THE showcase: 2 + 3 × 4 answered 20 → worked-left-to-right", () => {
    const e = addMul(2, 3, 4);
    const d = _internals.diagnoseExpr(e, 20);
    expect(d.correct).toBe(false);
    expect(d.correctAnswer).toBe(14);
    expect(d.misconception?.id).toBe("left-to-right");
    expect(d.steps.length).toBeGreaterThan(0);
  });

  it("marks the correct answer correct with no misconception", () => {
    expect(_internals.diagnoseExpr(addMul(2, 3, 4), 14).correct).toBe(true);
    expect(_internals.diagnoseExpr(addMul(2, 3, 4), 14).misconception).toBeNull();
  });

  it("brackets example: (2+3)×4 answered 14 → skipped-the-brackets", () => {
    // Ignoring brackets: 2 + 3×4 = 14. Correct = 20.
    const e = bracketsMul(2, 3, 4);
    const d = _internals.diagnoseExpr(e, 14);
    expect(d.correctAnswer).toBe(20);
    expect(d.misconception?.id).toBe("ignored-brackets");
  });

  it("returns no misconception for an unrecognised slip", () => {
    expect(_internals.diagnoseExpr(addMul(2, 3, 4), 99).misconception).toBeNull();
  });
});

describe("Order of Operations — generation & topic wiring", () => {
  it("generates integer, non-negative answers across every tier", () => {
    for (let d = 1; d <= 6; d++) {
      for (let i = 0; i < 40; i++) {
        const p = ORDER_OF_OPERATIONS.generate(d);
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(p.difficulty).toBe(d);
        expect(p.prompt.length).toBeGreaterThan(0);
      }
    }
  });

  it("is registered and resolvable by id", () => {
    expect(mathTopicById("order-of-operations")).toBe(ORDER_OF_OPERATIONS);
    expect(MATH_TOPICS.length).toBeGreaterThanOrEqual(2);
    // Unique topic ids.
    const ids = MATH_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a posed problem diagnoses its own answer correctly", () => {
    const p = ORDER_OF_OPERATIONS.generate(1);
    expect(p.diagnose(p.answer).correct).toBe(true);
  });
});
