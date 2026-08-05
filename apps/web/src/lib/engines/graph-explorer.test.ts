import { describe, expect, it } from "vitest";
import { evaluateAt, parseExpression, sampleFunction } from "./graph-explorer";

const evalOf = (src: string, x: number): number => {
  const p = parseExpression(src);
  if (!p.ok) throw new Error(`parse failed: ${p.error}`);
  return evaluateAt(p.ast, x);
};

describe("graph-explorer expression engine (ADR-027)", () => {
  it("evaluates arithmetic with correct precedence", () => {
    expect(evalOf("2 + 3 * 4", 0)).toBe(14);
    expect(evalOf("(2 + 3) * 4", 0)).toBe(20);
    expect(evalOf("10 - 2 - 3", 0)).toBe(5); // left-assoc
  });

  it("treats ^ as right-associative", () => {
    expect(evalOf("2^3^2", 0)).toBe(512); // 2^(3^2), not (2^3)^2 = 64
  });

  it("uses x, and applies unary minus", () => {
    expect(evalOf("x^2", 3)).toBe(9);
    expect(evalOf("-x", 5)).toBe(-5);
    expect(evalOf("-x^2", 3)).toBe(-9); // -(x^2)
  });

  it("supports implicit multiplication", () => {
    expect(evalOf("2x", 4)).toBe(8);
    expect(evalOf("2(x+1)", 3)).toBe(8);
    expect(evalOf("3sin(0)", 0)).toBe(0);
  });

  it("evaluates functions and constants", () => {
    expect(evalOf("sin(0)", 0)).toBe(0);
    expect(evalOf("cos(0)", 0)).toBe(1);
    expect(evalOf("sqrt(9)", 0)).toBe(3);
    expect(evalOf("abs(-4)", 0)).toBe(4);
    expect(evalOf("ln(e)", 0)).toBeCloseTo(1);
    expect(evalOf("pi", 0)).toBeCloseTo(Math.PI);
  });

  it("returns friendly errors for bad input", () => {
    expect(parseExpression("")).toMatchObject({ ok: false });
    expect(parseExpression("2 +")).toMatchObject({ ok: false });
    expect(parseExpression("sin x")).toMatchObject({ ok: false }); // needs brackets
    expect(parseExpression("(x + 1")).toMatchObject({ ok: false }); // unbalanced
    expect(parseExpression("2 @ 3")).toMatchObject({ ok: false }); // bad char
    const unknown = parseExpression("foo(x)");
    expect(unknown.ok).toBe(false);
  });

  it("produces non-finite results (not exceptions) for domain gaps", () => {
    expect(Number.isFinite(evalOf("1/x", 0))).toBe(false); // 1/0 → Infinity
    expect(Number.isNaN(evalOf("sqrt(x)", -1))).toBe(true); // sqrt(-1) → NaN
  });
});

describe("sampleFunction", () => {
  it("samples a parabola and reports the observed range", () => {
    const r = sampleFunction("x^2", { min: -2, max: 2, steps: 4 });
    expect(r.points).toHaveLength(5);
    expect(r.points.every((p) => p.ok)).toBe(true);
    expect(r.yMin).toBe(0);
    expect(r.yMax).toBe(4);
  });

  it("marks gaps where the function is undefined", () => {
    const r = sampleFunction("1/x", { min: -1, max: 1, steps: 2 });
    // x = 0 is sampled at the midpoint → a gap
    expect(r.points.find((p) => p.x === 0)?.ok).toBe(false);
  });

  it("returns the parse error and no points for bad input", () => {
    const r = sampleFunction("x +", { min: 0, max: 1 });
    expect(r.error).toBeTruthy();
    expect(r.points).toHaveLength(0);
  });

  it("rejects an inverted domain", () => {
    const r = sampleFunction("x", { min: 5, max: 1 });
    expect(r.error).toBeTruthy();
  });
});
