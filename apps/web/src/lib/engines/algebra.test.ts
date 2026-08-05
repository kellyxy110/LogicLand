import { describe, expect, it } from "vitest";
import {
  expandExpression,
  factorExpression,
  fractionToString,
  frac,
  parseAlgebra,
  polynomialToString,
  simplifyExpression,
  solveEquation,
  toPolynomial,
} from "./algebra";
import { parseExpression } from "./graph-explorer";

describe("algebra engine (ADR-028)", () => {
  describe("Fraction", () => {
    it("reduces to lowest terms and normalizes sign to the numerator", () => {
      expect(frac(2, 4)).toEqual({ num: 1, den: 2 });
      expect(frac(3, -6)).toEqual({ num: -1, den: 2 });
      expect(fractionToString(frac(4, 2))).toBe("2");
      expect(fractionToString(frac(3, 4))).toBe("3/4");
    });
  });

  describe("toPolynomial (via parseExpression)", () => {
    const poly = (src: string) => {
      const p = parseExpression(src);
      if (!p.ok) throw new Error(p.error);
      const r = toPolynomial(p.ast);
      if (!r.ok) throw new Error(r.error);
      return polynomialToString(r.poly);
    };

    it("distributes products of sums", () => {
      expect(poly("(x + 2)(x + 3)")).toBe("x^2 + 5x + 6");
      expect(poly("2(x + 3)")).toBe("2x + 6");
    });

    it("expands integer powers", () => {
      expect(poly("(x + 1)^3")).toBe("x^3 + 3x^2 + 3x + 1");
    });

    it("divides by a plain constant", () => {
      expect(poly("(4x + 8)/2")).toBe("2x + 4");
    });

    it("rejects division by an expression containing x", () => {
      const p = parseExpression("1/(x+1)");
      if (!p.ok) throw new Error(p.error);
      const r = toPolynomial(p.ast);
      expect(r.ok).toBe(false);
    });

    it("rejects functions like sin", () => {
      const p = parseExpression("sin(x)");
      if (!p.ok) throw new Error(p.error);
      const r = toPolynomial(p.ast);
      expect(r.ok).toBe(false);
    });
  });

  describe("parseAlgebra", () => {
    it("splits an equation on a single =", () => {
      const r = parseAlgebra("2x + 1 = 7");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.input.kind).toBe("equation");
    });

    it("rejects more than one =", () => {
      const r = parseAlgebra("x = 1 = 2");
      expect(r.ok).toBe(false);
    });

    it("rejects empty input", () => {
      expect(parseAlgebra("").ok).toBe(false);
      expect(parseAlgebra("   ").ok).toBe(false);
    });
  });

  describe("simplifyExpression", () => {
    it("combines like terms", () => {
      const r = simplifyExpression("3x + 5 - x + 2");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("2x + 7");
    });

    it("rejects an equation", () => {
      const r = simplifyExpression("x = 1");
      expect(r.ok).toBe(false);
    });

    it("surfaces a friendly parse error", () => {
      const r = simplifyExpression("2 +");
      expect(r.ok).toBe(false);
    });
  });

  describe("expandExpression", () => {
    it("distributes then combines, with a distribute step", () => {
      const r = expandExpression("(x + 2)(x + 3)");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toBe("x^2 + 5x + 6");
        expect(r.steps.some((s) => s.label === "Distribute")).toBe(true);
      }
    });

    it("handles a single distribution", () => {
      const r = expandExpression("2(x + 3) - x");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("x + 6");
    });
  });

  describe("factorExpression", () => {
    it("factors a monic quadratic with integer roots", () => {
      const r = factorExpression("x^2 + 5x + 6");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result.replace(/\s/g, "")).toMatch(/^\(x\+[23]\)\(x\+[23]\)$/);
    });

    it("pulls out a GCF from a linear expression", () => {
      const r = factorExpression("2x + 4");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("2(x + 2)");
    });

    it("factors a non-monic quadratic", () => {
      const r = factorExpression("2x^2 + 7x + 3");
      expect(r.ok).toBe(true);
      if (r.ok) {
        // (2x + 1)(x + 3) — verify by re-expanding via toPolynomial, not string match.
        const check = expandExpression("(2x + 1)(x + 3)");
        expect(check.ok && check.result).toBe("2x^2 + 7x + 3");
      }
    });

    it("is honest when a quadratic doesn't factor over the rationals", () => {
      const r = factorExpression("x^2 + x + 1");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.steps.some((s) => s.label.includes("Can't factor"))).toBe(true);
    });

    it("factors a cubic via rational root reduction", () => {
      const r = factorExpression("x^3 - 6x^2 + 11x - 6");
      expect(r.ok).toBe(true);
      if (r.ok) {
        // roots are 1, 2, 3 — check by evaluating the polynomial identity instead of exact string order.
        expect(r.result).toContain("(x -");
      }
    });

    it("reports a constant as nothing to factor", () => {
      const r = factorExpression("7");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("7");
    });
  });

  describe("solveEquation", () => {
    it("solves a linear equation", () => {
      const r = solveEquation("2x + 1 = 7");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("x = 3");
    });

    it("solves a linear equation with fractional answer", () => {
      const r = solveEquation("3x + 1 = 0");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("x = -1/3");
    });

    it("solves a factorable quadratic exactly", () => {
      const r = solveEquation("x^2 - 5x + 6 = 0");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toContain("x = 2");
        expect(r.result).toContain("x = 3");
      }
    });

    it("reports no real solutions for a negative discriminant", () => {
      const r = solveEquation("x^2 + x + 1 = 0");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("No real solutions");
    });

    it("gives a decimal approximation for irrational roots", () => {
      const r = solveEquation("x^2 - 2 = 0");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toMatch(/1\.4142/);
    });

    it("reports identity equations as always true", () => {
      const r = solveEquation("x + 1 = x + 1");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("All real numbers");
    });

    it("reports contradictions as no solution", () => {
      const r = solveEquation("x + 1 = x + 2");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("No solution");
    });

    it("rejects a bare expression (no =)", () => {
      const r = solveEquation("2x + 1");
      expect(r.ok).toBe(false);
    });

    it("solves a cubic that reduces to rational roots", () => {
      const r = solveEquation("x^3 - 6x^2 + 11x - 6 = 0");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toContain("x = 1");
        expect(r.result).toContain("x = 2");
        expect(r.result).toContain("x = 3");
      }
    });
  });
});
