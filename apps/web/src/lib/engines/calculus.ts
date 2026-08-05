// Calculus Visualizer engine (ADR-032) — numeric calculus built directly on
// Graph Explorer's safe expression parser (ADR-027): derivatives via central
// difference, definite integrals via the trapezoid rule (with a convergence
// trace so "why does this get more accurate" is visible), and limits by
// approaching from both sides. No symbolic differentiation/integration
// library, no eval, no network, no LLM — every number is a real, bounded
// computation (ADR-015).
import { evaluateAt, parseExpression, sampleFunction, type Node } from "./graph-explorer";

export interface Step {
  label: string;
  expr: string;
}
export type CalcResult = { ok: true; steps: Step[]; result: string } | { ok: false; error: string };

const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return n > 0 ? "+∞" : n < 0 ? "-∞" : "undefined"; // catches NaN too (NaN is neither > 0 nor < 0)
  if (Math.abs(n) < 1e-10) return "0";
  return Number(n.toFixed(6)).toString();
};

function parse(src: string): { ok: true; ast: Node } | { ok: false; error: string } {
  const p = parseExpression(src);
  if (!p.ok) return { ok: false, error: p.error };
  return { ok: true, ast: p.ast };
}

// --- Derivative (central difference) ------------------------------------------
export function derivativeAt(ast: Node, x: number, h: number): number {
  return (evaluateAt(ast, x + h) - evaluateAt(ast, x - h)) / (2 * h);
}

const DERIV_HS = [0.1, 0.01, 0.001, 0.0001];

export function tangentLine(exprSrc: string, aSrc: string): CalcResult {
  const parsed = parse(exprSrc);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const a = Number(aSrc);
  if (!Number.isFinite(a)) return { ok: false, error: "Enter a number for the point a." };

  const fa = evaluateAt(parsed.ast, a);
  if (!Number.isFinite(fa)) return { ok: false, error: `f(${fmt(a)}) is undefined — pick a point in the domain.` };

  const steps: Step[] = [
    { label: "f(x)", expr: exprSrc },
    { label: "Point a", expr: fmt(a) },
    { label: "f(a)", expr: fmt(fa) },
  ];
  let derivative = 0;
  for (const h of DERIV_HS) {
    derivative = derivativeAt(parsed.ast, a, h);
    steps.push({ label: `Difference quotient, h = ${h}`, expr: `(f(a+h) − f(a−h)) / (2h) = ${fmt(derivative)}` });
  }
  steps.push({ label: "f'(a) ≈", expr: fmt(derivative) });
  const sign = fa - derivative * a >= 0 ? "+" : "−";
  const intercept = Math.abs(fa - derivative * a);
  steps.push({ label: "Tangent line", expr: `y = ${fmt(derivative)}x ${sign} ${fmt(intercept)}` });

  return { ok: true, steps, result: `f'(${fmt(a)}) ≈ ${fmt(derivative)}` };
}

// --- Definite integral (trapezoid rule, with a convergence trace) ------------
export function trapezoidSum(ast: Node, a: number, b: number, n: number): number {
  const h = (b - a) / n;
  let sum = 0.5 * (evaluateAt(ast, a) + evaluateAt(ast, b));
  for (let i = 1; i < n; i++) sum += evaluateAt(ast, a + i * h);
  return sum * h;
}

const INTEGRAL_NS = [4, 16, 64, 256, 1024];

export function definiteIntegral(exprSrc: string, aSrc: string, bSrc: string): CalcResult {
  const parsed = parse(exprSrc);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const a = Number(aSrc);
  const b = Number(bSrc);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false, error: "Enter numbers for both bounds." };
  if (a >= b) return { ok: false, error: "The upper bound must be greater than the lower bound." };

  const steps: Step[] = [
    { label: "f(x)", expr: exprSrc },
    { label: "Interval", expr: `[${fmt(a)}, ${fmt(b)}]` },
    { label: "Method", expr: "Trapezoid rule — average the left and right edge, times the width" },
  ];
  let estimate = 0;
  for (const n of INTEGRAL_NS) {
    estimate = trapezoidSum(parsed.ast, a, b, n);
    steps.push({ label: `n = ${n} trapezoids`, expr: fmt(estimate) });
  }
  if (!Number.isFinite(estimate)) return { ok: false, error: "The function isn't finite everywhere on this interval." };
  steps.push({ label: "Estimate", expr: fmt(estimate) });

  return { ok: true, steps, result: `∫ f(x) dx from ${fmt(a)} to ${fmt(b)} ≈ ${fmt(estimate)}` };
}

/** Midpoint-rule rectangles at a modest n, for the visualization (not the accuracy estimate). */
export function integralRectangles(ast: Node, a: number, b: number, n: number): { x0: number; x1: number; height: number }[] {
  const h = (b - a) / n;
  const rects = [];
  for (let i = 0; i < n; i++) {
    const x0 = a + i * h;
    const x1 = x0 + h;
    const mid = (x0 + x1) / 2;
    rects.push({ x0, x1, height: evaluateAt(ast, mid) });
  }
  return rects;
}

// --- Limits (approach from both sides) -----------------------------------------
// The last delta is deliberately tight (1e-6): a genuine vertical asymptote
// (1/x near 0) reaches a huge but still finite magnitude there, which the
// UNBOUNDED_THRESHOLD below distinguishes from a bounded jump discontinuity
// (e.g. sign(x), which stays near ±1 no matter how close x gets to 0).
const LIMIT_DELTAS = [0.1, 0.01, 0.001, 0.0001, 0.000001];
const UNBOUNDED_THRESHOLD = 1e4;

export function limitAt(exprSrc: string, aSrc: string): CalcResult {
  const parsed = parse(exprSrc);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const a = Number(aSrc);
  if (!Number.isFinite(a)) return { ok: false, error: "Enter a number to approach." };

  const steps: Step[] = [{ label: "f(x)", expr: exprSrc }, { label: "x →", expr: fmt(a) }];
  // Both arrays go from farthest to closest (delta shrinking) — the last entry is the closest approach.
  const left = LIMIT_DELTAS.map((d) => evaluateAt(parsed.ast, a - d));
  const right = LIMIT_DELTAS.map((d) => evaluateAt(parsed.ast, a + d));
  LIMIT_DELTAS.forEach((d, i) => steps.push({ label: `x = ${fmt(a - d)} (from left)`, expr: fmt(left[i]) }));
  LIMIT_DELTAS.forEach((d, i) => steps.push({ label: `x = ${fmt(a + d)} (from right)`, expr: fmt(right[i]) }));

  const leftVal = left[left.length - 1];
  const rightVal = right[right.length - 1];
  const unbounded =
    !Number.isFinite(leftVal) || !Number.isFinite(rightVal) || Math.abs(leftVal) > UNBOUNDED_THRESHOLD || Math.abs(rightVal) > UNBOUNDED_THRESHOLD;

  let result: string;
  if (unbounded) {
    steps.push({ label: "Behavior", expr: "grows without bound near this point" });
    result = `lim x→${fmt(a)} f(x) is unbounded — a vertical asymptote`;
  } else if (Math.abs(leftVal - rightVal) < 1e-3) {
    const estimate = (leftVal + rightVal) / 2;
    steps.push({ label: "Left and right limits agree", expr: fmt(estimate) });
    result = `lim x→${fmt(a)} f(x) ≈ ${fmt(estimate)}`;
  } else {
    steps.push({ label: "Left and right limits disagree", expr: `${fmt(leftVal)} ≠ ${fmt(rightVal)}` });
    result = `lim x→${fmt(a)} f(x) does not exist — a jump`;
  }
  return { ok: true, steps, result };
}

export { sampleFunction };

// --- Presets -------------------------------------------------------------------
export const DERIVATIVE_PRESETS: { expr: string; a: string }[] = [
  { expr: "x^2", a: "3" },
  { expr: "sin(x)", a: "0" },
  { expr: "x^3 - 2x", a: "1" },
];
export const INTEGRAL_PRESETS: { expr: string; a: string; b: string }[] = [
  { expr: "x^2", a: "0", b: "2" },
  { expr: "sin(x)", a: "0", b: "3.14159" },
  { expr: "1/(1+x^2)", a: "-1", b: "1" },
];
export const LIMIT_PRESETS: { expr: string; a: string }[] = [
  { expr: "sin(x)/x", a: "0" },
  { expr: "(x^2-1)/(x-1)", a: "1" },
  { expr: "1/x", a: "0" },
];
