import { describe, expect, it } from "vitest";
import { definiteIntegral, derivativeAt, limitAt, tangentLine, trapezoidSum } from "./calculus";
import { parseExpression } from "./graph-explorer";

const ast = (src: string) => {
  const p = parseExpression(src);
  if (!p.ok) throw new Error(p.error);
  return p.ast;
};

describe("calculus engine (ADR-032)", () => {
  describe("derivativeAt", () => {
    it("matches the known derivative of x^2 (2x) at x=3", () => {
      expect(derivativeAt(ast("x^2"), 3, 0.0001)).toBeCloseTo(6, 2);
    });

    it("matches the known derivative of sin(x) (cos(x)) at x=0", () => {
      expect(derivativeAt(ast("sin(x)"), 0, 0.0001)).toBeCloseTo(1, 3);
    });
  });

  describe("tangentLine", () => {
    it("estimates the slope and builds a tangent line for x^2 at x=3", () => {
      const r = tangentLine("x^2", "3");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toContain("6");
        expect(r.steps.some((s) => s.label === "Tangent line")).toBe(true);
      }
    });

    it("rejects a point outside the domain", () => {
      const r = tangentLine("sqrt(x)", "-5");
      expect(r.ok).toBe(false);
    });

    it("rejects a bad expression or non-numeric point", () => {
      expect(tangentLine("2 +", "1").ok).toBe(false);
      expect(tangentLine("x^2", "abc").ok).toBe(false);
    });
  });

  describe("trapezoidSum / definiteIntegral", () => {
    it("approaches the exact integral of x^2 from 0 to 2 (8/3) as n grows", () => {
      const coarse = trapezoidSum(ast("x^2"), 0, 2, 4);
      const fine = trapezoidSum(ast("x^2"), 0, 2, 1024);
      expect(Math.abs(fine - 8 / 3)).toBeLessThan(Math.abs(coarse - 8 / 3));
      expect(fine).toBeCloseTo(8 / 3, 4);
    });

    it("computes a full convergence trace", () => {
      const r = definiteIntegral("x^2", "0", "2");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toContain("2.666");
        expect(r.steps.filter((s) => s.label.includes("trapezoids")).length).toBe(5);
      }
    });

    it("rejects a reversed or equal interval", () => {
      expect(definiteIntegral("x^2", "2", "0").ok).toBe(false);
      expect(definiteIntegral("x^2", "1", "1").ok).toBe(false);
    });
  });

  describe("limitAt", () => {
    it("finds the removable-singularity limit of sin(x)/x at 0 (= 1)", () => {
      const r = limitAt("sin(x)/x", "0");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toContain("≈ 1");
        expect(r.result).not.toContain("does not exist");
      }
    });

    it("finds the limit of (x^2-1)/(x-1) at x=1 (= 2), undefined exactly at 1", () => {
      const r = limitAt("(x^2-1)/(x-1)", "1");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toContain("≈ 2");
    });

    it("identifies 1/x at 0 as unbounded (a vertical asymptote), not a plain jump", () => {
      const r = limitAt("1/x", "0");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toContain("unbounded");
    });

    it("rejects a bad expression or non-numeric point", () => {
      expect(limitAt("2 +", "0").ok).toBe(false);
      expect(limitAt("x", "abc").ok).toBe(false);
    });
  });
});
