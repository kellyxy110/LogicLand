// Graph Explorer engine (ADR-027) — a small, SAFE mathematical expression
// evaluator and function sampler. Pure and deterministic: it tokenizes and
// parses `f(x)` into an AST with a precedence-climbing parser and evaluates it
// numerically — never `eval`, never the network. Reusable by Algebra Studio and
// the Calculus Visualizer later. Supports + - * / ^, unary minus, parentheses,
// implicit multiplication (2x, 3sin(x), 2(x+1)), the constants pi and e, and the
// functions sin cos tan sqrt abs ln log exp.

// --- AST -------------------------------------------------------------------
export type Node =
  | { type: "num"; value: number }
  | { type: "var" }
  | { type: "unary"; op: "-"; arg: Node }
  | { type: "binary"; op: "+" | "-" | "*" | "/" | "^"; left: Node; right: Node }
  | { type: "call"; name: string; arg: Node };

export type ParseResult = { ok: true; ast: Node } | { ok: false; error: string };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

// --- Tokenizer -------------------------------------------------------------
type Tok =
  | { t: "num"; v: number }
  | { t: "ident"; v: string }
  | { t: "op"; v: string }
  | { t: "("; }
  | { t: ")"; };

function tokenize(src: string): Tok[] | { error: string } {
  const toks: Tok[] = [];
  let i = 0;
  const s = src.replace(/\s+/g, "");
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const num = Number(s.slice(i, j));
      if (!Number.isFinite(num)) return { error: `Bad number "${s.slice(i, j)}"` };
      toks.push({ t: "num", v: num });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      toks.push({ t: "ident", v: s.slice(i, j).toLowerCase() });
      i = j;
    } else if ("+-*/^".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
    } else if (c === "(") {
      toks.push({ t: "(" });
      i++;
    } else if (c === ")") {
      toks.push({ t: ")" });
      i++;
    } else {
      return { error: `Unexpected character "${c}"` };
    }
  }
  return insertImplicitMultiplication(toks);
}

// A value-ending token followed by a value-starting token means "×": 2x, )x, x(, 2(.
function insertImplicitMultiplication(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  const endsValue = (t: Tok) => t.t === "num" || t.t === ")" || t.t === "ident";
  const startsValue = (t: Tok) => t.t === "num" || t.t === "(" || t.t === "ident";
  for (let k = 0; k < toks.length; k++) {
    out.push(toks[k]);
    const next = toks[k + 1];
    if (next && endsValue(toks[k]) && startsValue(next)) {
      // don't split a function name from its "(" — a bare ident before "(" is a call
      if (toks[k].t === "ident" && next.t === "(") continue;
      out.push({ t: "op", v: "*" });
    }
  }
  return out;
}

// --- Parser (precedence climbing) ------------------------------------------
const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4 };
const RIGHT_ASSOC = new Set(["^"]);
// Unary minus binds looser than ^ (so -x^2 = -(x^2)) but tighter than * and /.
const UNARY_PREC = 3;

export function parseExpression(src: string): ParseResult {
  if (!src.trim()) return { ok: false, error: "Type a function of x, like x^2 - 1." };
  const tokedResult = tokenize(src);
  if ("error" in tokedResult) return { ok: false, error: tokedResult.error };
  const toks = tokedResult;
  let pos = 0;
  const peek = () => toks[pos];

  function parsePrimary(): Node {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression.");
    if (tok.t === "op" && (tok.v === "-" || tok.v === "+")) {
      pos++;
      // Parse a power-level operand so -x^2 = -(x^2), matching maths convention.
      const arg = parseExpr(UNARY_PREC);
      return tok.v === "-" ? { type: "unary", op: "-", arg } : arg;
    }
    if (tok.t === "num") {
      pos++;
      return { type: "num", value: tok.v };
    }
    if (tok.t === "(") {
      pos++;
      const inner = parseExpr(0);
      if (peek()?.t !== ")") throw new Error("Missing a closing ).");
      pos++;
      return inner;
    }
    if (tok.t === "ident") {
      pos++;
      if (tok.v === "x") return { type: "var" };
      if (tok.v in CONSTANTS) return { type: "num", value: CONSTANTS[tok.v] };
      if (tok.v in FUNCTIONS) {
        if (peek()?.t !== "(") throw new Error(`${tok.v} needs (brackets), like ${tok.v}(x).`);
        pos++;
        const arg = parseExpr(0);
        if (peek()?.t !== ")") throw new Error("Missing a closing ).");
        pos++;
        return { type: "call", name: tok.v, arg };
      }
      throw new Error(`I don't know "${tok.v}". Use x, pi, e, or a function like sin.`);
    }
    throw new Error("Unexpected symbol in the expression.");
  }

  function parseExpr(minPrec: number): Node {
    let left = parsePrimary();
    for (;;) {
      const tok = peek();
      if (!tok || tok.t !== "op" || !(tok.v in PREC)) break;
      const prec = PREC[tok.v];
      if (prec < minPrec) break;
      pos++;
      const nextMin = RIGHT_ASSOC.has(tok.v) ? prec : prec + 1;
      const right = parseExpr(nextMin);
      left = { type: "binary", op: tok.v as "+" | "-" | "*" | "/" | "^", left, right };
    }
    return left;
  }

  try {
    const ast = parseExpr(0);
    if (pos < toks.length) return { ok: false, error: "I couldn't read the whole expression." };
    return { ok: true, ast };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't parse that." };
  }
}

// --- Evaluation ------------------------------------------------------------
export function evaluateAt(ast: Node, x: number): number {
  switch (ast.type) {
    case "num":
      return ast.value;
    case "var":
      return x;
    case "unary":
      return -evaluateAt(ast.arg, x);
    case "binary": {
      const a = evaluateAt(ast.left, x);
      const b = evaluateAt(ast.right, x);
      switch (ast.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^":
          return Math.pow(a, b);
      }
      return NaN;
    }
    case "call":
      return FUNCTIONS[ast.name](evaluateAt(ast.arg, x));
  }
}

// --- Sampling --------------------------------------------------------------
export interface SamplePoint {
  x: number;
  y: number;
  /** false where y is not a finite number (a gap: asymptote, domain error). */
  ok: boolean;
}
export interface SampleResult {
  points: SamplePoint[];
  /** Finite y-range actually observed, for auto-scaling. null when all gaps. */
  yMin: number | null;
  yMax: number | null;
  error?: string;
}

export interface SampleOptions {
  min: number;
  max: number;
  steps?: number;
}

/** Sample f(x) across [min, max]. Parses once; a parse error returns no points. */
export function sampleFunction(src: string, opts: SampleOptions): SampleResult {
  const parsed = parseExpression(src);
  if (!parsed.ok) return { points: [], yMin: null, yMax: null, error: parsed.error };
  const steps = Math.max(2, Math.min(opts.steps ?? 240, 2000));
  const { min, max } = opts;
  if (!(Number.isFinite(min) && Number.isFinite(max) && max > min)) {
    return { points: [], yMin: null, yMax: null, error: "The domain must have max greater than min." };
  }
  const points: SamplePoint[] = [];
  let yMin: number | null = null;
  let yMax: number | null = null;
  for (let k = 0; k <= steps; k++) {
    const x = min + ((max - min) * k) / steps;
    const y = evaluateAt(parsed.ast, x);
    const ok = Number.isFinite(y);
    points.push({ x, y, ok });
    if (ok) {
      yMin = yMin === null ? y : Math.min(yMin, y);
      yMax = yMax === null ? y : Math.max(yMax, y);
    }
  }
  return { points, yMin, yMax };
}

// --- Presets (kid-facing starting points) ----------------------------------
export interface GraphPreset {
  label: string;
  expr: string;
}
export const GRAPH_PRESETS: GraphPreset[] = [
  { label: "Line", expr: "2x + 1" },
  { label: "Parabola", expr: "x^2" },
  { label: "Cubic", expr: "x^3 - 3x" },
  { label: "Wave", expr: "sin(x)" },
  { label: "Reciprocal", expr: "1/x" },
  { label: "Root", expr: "sqrt(x)" },
  { label: "Bell", expr: "e^(-x^2)" },
];
