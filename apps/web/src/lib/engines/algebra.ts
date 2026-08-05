// Algebra Studio engine (ADR-028) — deterministic single-variable polynomial
// algebra: simplify, expand, factor, solve. Built on Graph Explorer's safe
// tokenizer/parser (ADR-027, `parseExpression`) — never `eval`, never the
// network, exact rational arithmetic throughout (no floating-point drift on
// integer/fraction coefficients). Every operation returns a list of labelled
// steps, never just an answer, matching the "AI never grades, the engine
// explains" principle (ADR-015).
import { parseExpression, type Node } from "./graph-explorer";

// --- Exact rational arithmetic ----------------------------------------------
export interface Fraction {
  num: number;
  den: number; // always > 0
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(num: number, den = 1): Fraction {
  if (den === 0) throw new Error("Division by zero.");
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

const fadd = (a: Fraction, b: Fraction): Fraction => frac(a.num * b.den + b.num * a.den, a.den * b.den);
const fsub = (a: Fraction, b: Fraction): Fraction => frac(a.num * b.den - b.num * a.den, a.den * b.den);
const fmul = (a: Fraction, b: Fraction): Fraction => frac(a.num * b.num, a.den * b.den);
const fdiv = (a: Fraction, b: Fraction): Fraction => {
  if (b.num === 0) throw new Error("Division by zero.");
  return frac(a.num * b.den, a.den * b.num);
};
const fneg = (a: Fraction): Fraction => ({ num: -a.num, den: a.den });
const fisZero = (a: Fraction): boolean => a.num === 0;
const feq = (a: Fraction, b: Fraction): boolean => a.num === b.num && a.den === b.den;
const ftoNumber = (a: Fraction): number => a.num / a.den;

export function fractionToString(f: Fraction): string {
  return f.den === 1 ? String(f.num) : `${f.num}/${f.den}`;
}

// --- Polynomial (index i = coefficient of x^i, ascending) ------------------
export type Polynomial = Fraction[];

function trim(p: Polynomial): Polynomial {
  const out = [...p];
  while (out.length > 1 && fisZero(out[out.length - 1])) out.pop();
  return out;
}

function polyAdd(a: Polynomial, b: Polynomial): Polynomial {
  const len = Math.max(a.length, b.length);
  const out: Polynomial = [];
  for (let i = 0; i < len; i++) out.push(fadd(a[i] ?? frac(0), b[i] ?? frac(0)));
  return trim(out);
}
function polySub(a: Polynomial, b: Polynomial): Polynomial {
  return polyAdd(a, b.map(fneg));
}
function polyScale(a: Polynomial, k: Fraction): Polynomial {
  return trim(a.map((c) => fmul(c, k)));
}
export function polyDegree(p: Polynomial): number {
  return p.length - 1;
}
export function polyIsZero(p: Polynomial): boolean {
  return p.length === 1 && fisZero(p[0]);
}

export function polynomialToString(p: Polynomial): string {
  if (polyIsZero(p)) return "0";
  const parts: string[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const c = p[i];
    if (fisZero(c)) continue;
    const sign = c.num < 0 ? "-" : "+";
    const abs: Fraction = c.num < 0 ? fneg(c) : c;
    const coefStr = feq(abs, frac(1)) && i !== 0 ? "" : fractionToString(abs);
    const varStr = i === 0 ? "" : i === 1 ? "x" : `x^${i}`;
    const term = coefStr && varStr ? `${coefStr}${varStr}` : coefStr || varStr;
    parts.push(parts.length === 0 ? (sign === "-" ? `-${term}` : term) : `${sign} ${term}`);
  }
  return parts.length ? parts.join(" ") : "0";
}

// --- AST → term list (distributes products; never combines) ----------------
export interface Term {
  coeff: Fraction;
  degree: number;
}

export type ToTermsResult = { ok: true; terms: Term[] } | { ok: false; error: string };

function multiplyTermLists(a: Term[], b: Term[]): Term[] {
  const out: Term[] = [];
  for (const ta of a) for (const tb of b) out.push({ coeff: fmul(ta.coeff, tb.coeff), degree: ta.degree + tb.degree });
  return out;
}

/** Distributes an AST into a flat (uncombined) list of coeff*x^degree terms. */
function toTerms(node: Node): ToTermsResult {
  switch (node.type) {
    case "num":
      return { ok: true, terms: [{ coeff: frac(node.value), degree: 0 }] };
    case "var":
      return { ok: true, terms: [{ coeff: frac(1), degree: 1 }] };
    case "unary": {
      const inner = toTerms(node.arg);
      if (!inner.ok) return inner;
      return { ok: true, terms: inner.terms.map((t) => ({ coeff: fneg(t.coeff), degree: t.degree })) };
    }
    case "call":
      return { ok: false, error: "Algebra Studio works with +, -, *, /, ^ and parentheses on x — no functions like sin yet." };
    case "binary": {
      const l = toTerms(node.left);
      if (!l.ok) return l;
      const r = toTerms(node.right);
      if (!r.ok) return r;
      switch (node.op) {
        case "+":
          return { ok: true, terms: [...l.terms, ...r.terms] };
        case "-":
          return { ok: true, terms: [...l.terms, ...r.terms.map((t) => ({ coeff: fneg(t.coeff), degree: t.degree }))] };
        case "*":
          return { ok: true, terms: multiplyTermLists(l.terms, r.terms) };
        case "/": {
          // Only division by a constant (no x) is a polynomial operation.
          if (r.terms.some((t) => t.degree !== 0)) {
            return { ok: false, error: "I can only divide by a plain number here, not by an expression with x." };
          }
          const divisor = r.terms.reduce((acc, t) => fadd(acc, t.coeff), frac(0));
          if (fisZero(divisor)) return { ok: false, error: "Division by zero." };
          return { ok: true, terms: l.terms.map((t) => ({ coeff: fdiv(t.coeff, divisor), degree: t.degree })) };
        }
        case "^": {
          if (node.right.type !== "num" || !Number.isInteger(node.right.value) || node.right.value < 0) {
            return { ok: false, error: "Exponents must be non-negative whole numbers here, like x^2." };
          }
          const exp = node.right.value;
          if (exp > 12) return { ok: false, error: "That exponent is too large for Algebra Studio to expand." };
          let acc: Term[] = [{ coeff: frac(1), degree: 0 }];
          for (let i = 0; i < exp; i++) acc = multiplyTermLists(acc, l.terms);
          return { ok: true, terms: acc };
        }
      }
      return { ok: false, error: "Unsupported operator." };
    }
  }
}

function combineTerms(terms: Term[]): Polynomial {
  const maxDeg = terms.reduce((m, t) => Math.max(m, t.degree), 0);
  const poly: Polynomial = Array.from({ length: maxDeg + 1 }, () => frac(0));
  for (const t of terms) poly[t.degree] = fadd(poly[t.degree], t.coeff);
  return trim(poly);
}

function termsToRawString(terms: Term[]): string {
  if (terms.length === 0) return "0";
  return terms
    .map((t, i) => {
      const neg = t.coeff.num < 0;
      const abs = neg ? fneg(t.coeff) : t.coeff;
      const coefStr = feq(abs, frac(1)) && t.degree !== 0 ? "" : fractionToString(abs);
      const varStr = t.degree === 0 ? "" : t.degree === 1 ? "x" : `x^${t.degree}`;
      const term = coefStr && varStr ? `${coefStr}${varStr}` : coefStr || varStr || "0";
      const sign = neg ? "-" : "+";
      return i === 0 ? (neg ? `-${term}` : term) : `${sign} ${term}`;
    })
    .join(" ");
}

export function toPolynomial(node: Node): { ok: true; poly: Polynomial } | { ok: false; error: string } {
  const terms = toTerms(node);
  if (!terms.ok) return terms;
  return { ok: true, poly: combineTerms(terms.terms) };
}

// --- Parsing (expression or equation) ---------------------------------------
export type AlgebraInput =
  | { kind: "expr"; ast: Node; raw: string }
  | { kind: "equation"; lhs: Node; rhs: Node; raw: string };

export function parseAlgebra(src: string): { ok: true; input: AlgebraInput } | { ok: false; error: string } {
  const raw = src.trim();
  if (!raw) return { ok: false, error: "Type an expression or equation, like 2(x + 3) - x." };
  const eqIdx = raw.indexOf("=");
  if (eqIdx === -1) {
    const p = parseExpression(raw);
    if (!p.ok) return { ok: false, error: p.error };
    return { ok: true, input: { kind: "expr", ast: p.ast, raw } };
  }
  if (raw.indexOf("=", eqIdx + 1) !== -1) return { ok: false, error: "I can only handle one equals sign." };
  const lhsSrc = raw.slice(0, eqIdx);
  const rhsSrc = raw.slice(eqIdx + 1);
  const lp = parseExpression(lhsSrc);
  if (!lp.ok) return { ok: false, error: `Left side: ${lp.error}` };
  const rp = parseExpression(rhsSrc);
  if (!rp.ok) return { ok: false, error: `Right side: ${rp.error}` };
  return { ok: true, input: { kind: "equation", lhs: lp.ast, rhs: rp.ast, raw } };
}

// --- Steps -------------------------------------------------------------------
export interface Step {
  label: string;
  expr: string;
}
export type OpResult = { ok: true; steps: Step[]; result: string } | { ok: false; error: string };

export function simplifyExpression(src: string): OpResult {
  const parsed = parseAlgebra(src);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (parsed.input.kind !== "expr") return { ok: false, error: "Simplify works on an expression, not an equation — try Solve instead." };
  const terms = toTerms(parsed.input.ast);
  if (!terms.ok) return { ok: false, error: terms.error };
  const poly = combineTerms(terms.terms);
  const result = polynomialToString(poly);
  const steps: Step[] = [{ label: "Start", expr: parsed.input.raw }];
  if (terms.terms.length > 1) steps.push({ label: "Combine like terms", expr: result });
  else steps.push({ label: "Already simplified", expr: result });
  return { ok: true, steps, result };
}

export function expandExpression(src: string): OpResult {
  const parsed = parseAlgebra(src);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (parsed.input.kind !== "expr") return { ok: false, error: "Expand works on an expression, not an equation." };
  const terms = toTerms(parsed.input.ast);
  if (!terms.ok) return { ok: false, error: terms.error };
  const poly = combineTerms(terms.terms);
  const result = polynomialToString(poly);
  const steps: Step[] = [{ label: "Start", expr: parsed.input.raw }];
  const raw = termsToRawString(terms.terms);
  if (raw !== result) steps.push({ label: "Distribute", expr: raw });
  steps.push({ label: "Combine like terms", expr: result });
  return { ok: true, steps, result };
}

// Rational-root search for a polynomial with rational coefficients: clears
// denominators to integers, then tries p/q where p | constant, q | leading
// coefficient (bounded, so this stays fast and terminating).
function findRationalRoot(poly: Polynomial): Fraction | null {
  if (polyDegree(poly) < 1) return null;
  const denomLcm = poly.reduce((l, c) => (l * c.den) / gcd(l, c.den), 1);
  const intCoeffs = poly.map((c) => Math.round(c.num * (denomLcm / c.den)));
  const a0 = intCoeffs[0];
  const an = intCoeffs[intCoeffs.length - 1];
  if (an === 0) return null;
  const divisors = (n: number): number[] => {
    const out: number[] = [];
    const a = Math.max(1, Math.abs(n));
    for (let i = 1; i <= a; i++) if (a % i === 0) out.push(i);
    return out;
  };
  const pCands = a0 === 0 ? [0] : divisors(a0);
  const qCands = divisors(an);
  const evalInt = (num: number, den: number): Fraction => {
    let acc = frac(0);
    let pw = frac(1);
    const x = frac(num, den);
    for (const c of poly) {
      acc = fadd(acc, fmul(c, pw));
      pw = fmul(pw, x);
    }
    return acc;
  };
  for (const p of pCands) {
    for (const q of qCands) {
      for (const sign of [1, -1]) {
        const num = sign * p;
        if (num === 0 && p !== 0) continue;
        const r = frac(num, q);
        if (fisZero(evalInt(r.num, r.den))) return r;
        if (p === 0) break;
      }
    }
  }
  return null;
}

// Synthetic division of poly by (x - root); returns the quotient (degree-1).
function syntheticDivide(poly: Polynomial, root: Fraction): Polynomial {
  const coeffsDesc = [...poly].reverse(); // highest degree first
  const quotientDesc: Fraction[] = [coeffsDesc[0]];
  for (let i = 1; i < coeffsDesc.length - 1; i++) {
    quotientDesc.push(fadd(coeffsDesc[i], fmul(quotientDesc[i - 1], root)));
  }
  return trim(quotientDesc.reverse());
}

interface Factor {
  // Represents (coeffOfX)x + constant, i.e. a linear factor, OR an
  // irreducible remainder polynomial (degree 0 or an unfactored quadratic+).
  kind: "linear-root" | "remainder";
  root?: Fraction; // for linear-root: the zero of this factor
  poly?: Polynomial; // for remainder
}

function factorPolynomial(poly: Polynomial): { factors: Factor[]; leading: Fraction; steps: Step[] } {
  const steps: Step[] = [];
  let current = poly;
  const factors: Factor[] = [];

  // Pull out the overall leading coefficient once at the end via monic reduction.
  while (polyDegree(current) >= 1 && !polyIsZero(current)) {
    if (polyDegree(current) === 2) {
      const [c, b, a] = current;
      const disc = fsub(fmul(b, b), fmul(frac(4), fmul(a, c)));
      const discNum = ftoNumber(disc);
      if (discNum >= 0) {
        const sqrtDisc = Math.sqrt(discNum);
        if (Number.isInteger(sqrtDisc)) {
          const r1 = fdiv(fsub(fneg(b), frac(sqrtDisc)), fmul(frac(2), a));
          const r2 = fdiv(fadd(fneg(b), frac(sqrtDisc)), fmul(frac(2), a));
          factors.push({ kind: "linear-root", root: r1 });
          factors.push({ kind: "linear-root", root: r2 });
          steps.push({
            label: `Factor the quadratic ${polynomialToString(current)}`,
            expr: `roots x = ${fractionToString(r1)}, x = ${fractionToString(r2)}`,
          });
          current = [frac(1)];
          break;
        }
      }
      // Doesn't factor over the rationals — keep as an irreducible remainder.
      factors.push({ kind: "remainder", poly: current });
      current = [frac(1)];
      break;
    }
    const root = findRationalRoot(current);
    if (root === null) {
      factors.push({ kind: "remainder", poly: current });
      current = [frac(1)];
      break;
    }
    factors.push({ kind: "linear-root", root });
    const quotient = syntheticDivide(current, root);
    steps.push({
      label: `Divide out the root x = ${fractionToString(root)}`,
      expr: `${polynomialToString(current)} = (x ${root.num <= 0 ? "+" : "-"} ${fractionToString(root.num <= 0 ? fneg(root) : root)}) · (${polynomialToString(quotient)})`,
    });
    current = quotient;
  }
  return { factors, leading: current[current.length - 1] ?? frac(1), steps };
}

function factorsToString(factors: Factor[], leadingScale: Fraction): string {
  let out = feq(leadingScale, frac(1)) ? "" : fractionToString(leadingScale);
  for (const f of factors) {
    if (f.kind === "linear-root" && f.root) {
      const r = f.root;
      if (fisZero(r)) out += "x";
      else if (r.num < 0) out += `(x + ${fractionToString(fneg(r))})`;
      else out += `(x - ${fractionToString(r)})`;
    } else if (f.kind === "remainder" && f.poly) {
      out += polyDegree(f.poly) === 0 ? fractionToString(f.poly[0]) : `(${polynomialToString(f.poly)})`;
    }
  }
  return out || "1";
}

export function factorExpression(src: string): OpResult {
  const parsed = parseAlgebra(src);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (parsed.input.kind !== "expr") return { ok: false, error: "Factor works on an expression, not an equation." };
  const p = toPolynomial(parsed.input.ast);
  if (!p.ok) return { ok: false, error: p.error };
  const poly = p.poly;
  const steps: Step[] = [{ label: "Start", expr: parsed.input.raw }];
  if (polyIsZero(poly)) return { ok: true, steps: [...steps, { label: "Already", expr: "0" }], result: "0" };
  const simplified = polynomialToString(poly);
  if (simplified !== parsed.input.raw) steps.push({ label: "Simplify first", expr: simplified });
  if (polyDegree(poly) === 0) {
    steps.push({ label: "Constant — nothing to factor", expr: simplified });
    return { ok: true, steps, result: simplified };
  }

  // Pull out the GCF of all coefficients before root-hunting, for a cleaner result.
  const coeffGcdNums = poly.filter((c) => !fisZero(c)).map((c) => c.num);
  const allInts = poly.every((c) => c.den === 1);
  let gcfVal = 1;
  if (allInts && coeffGcdNums.length > 0) {
    gcfVal = coeffGcdNums.reduce((g, n) => gcd(g, n), coeffGcdNums[0]);
    gcfVal = Math.abs(gcfVal);
  }
  let working = poly;
  const gcfFrac = frac(gcfVal);
  if (gcfVal > 1) {
    working = polyScale(poly, frac(1, gcfVal));
    steps.push({ label: `Factor out the GCF (${gcfVal})`, expr: `${gcfVal}(${polynomialToString(working)})` });
  }

  const { factors, steps: rootSteps } = factorPolynomial(working);
  steps.push(...rootSteps);
  const onlyRemainder = factors.length === 1 && factors[0].kind === "remainder" && polyDegree(factors[0].poly!) === polyDegree(working);
  if (onlyRemainder) {
    const result = gcfVal > 1 ? `${gcfVal}(${polynomialToString(working)})` : simplified;
    steps.push({ label: "Can't factor further over the rationals", expr: result });
    return { ok: true, steps, result };
  }
  const result = factorsToString(factors, gcfFrac);
  steps.push({ label: "Factored form", expr: result });
  return { ok: true, steps, result };
}

export function solveEquation(src: string): OpResult {
  const parsed = parseAlgebra(src);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (parsed.input.kind !== "equation") return { ok: false, error: "Solve needs an equation with an =, like 2x + 1 = 7." };
  const lhs = toPolynomial(parsed.input.lhs);
  if (!lhs.ok) return { ok: false, error: `Left side: ${lhs.error}` };
  const rhs = toPolynomial(parsed.input.rhs);
  if (!rhs.ok) return { ok: false, error: `Right side: ${rhs.error}` };
  const steps: Step[] = [{ label: "Start", expr: parsed.input.raw }];
  const moved = polySub(lhs.poly, rhs.poly);
  steps.push({ label: "Move everything to one side", expr: `${polynomialToString(moved)} = 0` });

  if (polyIsZero(moved)) {
    steps.push({ label: "Always true", expr: "Every value of x is a solution." });
    return { ok: true, steps, result: "All real numbers" };
  }
  const deg = polyDegree(moved);
  if (deg === 0) {
    steps.push({ label: "Never true", expr: "There is no solution." });
    return { ok: true, steps, result: "No solution" };
  }
  if (deg === 1) {
    const b = moved[0];
    const a = moved[1];
    const root = fdiv(fneg(b), a);
    steps.push({ label: "Isolate x", expr: `x = ${fractionToString(root)}` });
    return { ok: true, steps, result: `x = ${fractionToString(root)}` };
  }
  if (deg === 2) {
    const [c, b, a] = moved;
    const disc = fsub(fmul(b, b), fmul(frac(4), fmul(a, c)));
    const discNum = ftoNumber(disc);
    if (discNum < 0) {
      steps.push({ label: "Discriminant is negative", expr: "No real solutions." });
      return { ok: true, steps, result: "No real solutions" };
    }
    const sqrtDisc = Math.sqrt(discNum);
    if (Number.isInteger(sqrtDisc)) {
      const r1 = fdiv(fsub(fneg(b), frac(sqrtDisc)), fmul(frac(2), a));
      const r2 = fdiv(fadd(fneg(b), frac(sqrtDisc)), fmul(frac(2), a));
      steps.push({ label: "Use the quadratic formula (exact)", expr: `x = ${fractionToString(r1)} or x = ${fractionToString(r2)}` });
      return { ok: true, steps, result: `x = ${fractionToString(r1)} or x = ${fractionToString(r2)}` };
    }
    const r1 = (-ftoNumber(b) - sqrtDisc) / (2 * ftoNumber(a));
    const r2 = (-ftoNumber(b) + sqrtDisc) / (2 * ftoNumber(a));
    steps.push({
      label: "Use the quadratic formula (irrational — decimal approximation)",
      expr: `x ≈ ${r1.toFixed(4)} or x ≈ ${r2.toFixed(4)}`,
    });
    return { ok: true, steps, result: `x ≈ ${r1.toFixed(4)} or x ≈ ${r2.toFixed(4)}` };
  }

  // Higher degree: reduce via rational roots until we hit an unfactorable remainder.
  const { factors, steps: rootSteps } = factorPolynomial(moved);
  steps.push(...rootSteps);
  const roots = factors.filter((f): f is Factor & { root: Fraction } => f.kind === "linear-root" && f.root !== undefined);
  const remainder = factors.find((f) => f.kind === "remainder");
  if (roots.length === 0) {
    steps.push({ label: "No rational roots found", expr: "I can only solve equations that reduce to rational roots here." });
    return { ok: false, error: "I can only solve equations that reduce to rational roots here." };
  }
  const uniqueRoots = [...new Map(roots.map((r) => [fractionToString(r.root), r.root])).values()];
  const rootsStr = uniqueRoots.map((r) => `x = ${fractionToString(r)}`).join(" or ");
  if (remainder && polyDegree(remainder.poly!) >= 1) {
    steps.push({
      label: "Remaining factor has no rational roots",
      expr: `${rootsStr} (plus roots of ${polynomialToString(remainder.poly!)}, not found here)`,
    });
  } else {
    steps.push({ label: "Solutions", expr: rootsStr });
  }
  return { ok: true, steps, result: rootsStr };
}

// --- Presets (kid-facing starting points) ----------------------------------
export interface AlgebraPreset {
  label: string;
  expr: string;
}
export const ALGEBRA_PRESETS: AlgebraPreset[] = [
  { label: "Combine terms", expr: "3x + 5 - x + 2" },
  { label: "Distribute", expr: "2(x + 3) - x" },
  { label: "Multiply binomials", expr: "(x + 2)(x + 3)" },
  { label: "Factor a quadratic", expr: "x^2 + 5x + 6" },
  { label: "Solve linear", expr: "2x + 1 = 7" },
  { label: "Solve quadratic", expr: "x^2 - 5x + 6 = 0" },
];
