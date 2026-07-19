// Math Fix™ topic — Order of Operations (BIDMAS / PEMDAS). The canonical
// misconception showcase: "2 + 3 × 4" answered 20 means the child worked left to
// right instead of multiplying first. Fully deterministic, integer answers, so
// it reuses the exact same practice UI as linear equations. Two signature
// misconceptions: working strictly left-to-right, and ignoring brackets.
import type { Diagnosis, MathTopic, Misconception, PosedProblem } from "../types";

// The presented expression shapes — each invites a specific, checkable slip.
type Expr =
  | { id: string; difficulty: number; kind: "add_mul"; a: number; b: number; c: number }
  | { id: string; difficulty: number; kind: "sub_mul"; a: number; b: number; c: number }
  | { id: string; difficulty: number; kind: "brackets_mul"; a: number; b: number; c: number }
  | {
      id: string;
      difficulty: number;
      kind: "add_mul_sub";
      a: number;
      b: number;
      c: number;
      d: number;
    };

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 6;

type Rng = () => number;
function pick(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `oo-${Date.now().toString(36)}-${counter}`;
}

const MISCONCEPTIONS: Record<string, Misconception> = {
  "left-to-right": {
    id: "left-to-right",
    name: "Worked left to right",
    explain:
      "It looks like you solved it in reading order, left to right — but multiplying happens before adding or taking away, wherever it sits.",
    repair:
      "Scan the whole line first and do the × (and ÷) before any + or −. Then finish left to right.",
  },
  "ignored-brackets": {
    id: "ignored-brackets",
    name: "Skipped the brackets",
    explain:
      "The multiply happened before the brackets — but brackets always go first, before anything else.",
    repair:
      "Do whatever is inside the brackets first, then carry on with × and finally + or −.",
  },
};

export function renderExpr(e: Expr): string {
  switch (e.kind) {
    case "add_mul":
      return `${e.a} + ${e.b} × ${e.c}`;
    case "sub_mul":
      return `${e.a} − ${e.b} × ${e.c}`;
    case "brackets_mul":
      return `(${e.a} + ${e.b}) × ${e.c}`;
    case "add_mul_sub":
      return `${e.a} + ${e.b} × ${e.c} − ${e.d}`;
  }
}

export function solveExpr(e: Expr): number {
  switch (e.kind) {
    case "add_mul":
      return e.a + e.b * e.c;
    case "sub_mul":
      return e.a - e.b * e.c;
    case "brackets_mul":
      return (e.a + e.b) * e.c;
    case "add_mul_sub":
      return e.a + e.b * e.c - e.d;
  }
}

/** The wrong answer produced by evaluating strictly left to right. */
function leftToRight(e: Expr): number {
  switch (e.kind) {
    case "add_mul":
      return (e.a + e.b) * e.c;
    case "sub_mul":
      return (e.a - e.b) * e.c;
    case "brackets_mul":
      return (e.a + e.b) * e.c; // brackets already leftmost — same as correct
    case "add_mul_sub":
      return (e.a + e.b) * e.c - e.d;
  }
}

function stepsFor(e: Expr): string[] {
  switch (e.kind) {
    case "add_mul":
      return [
        `Multiply first — × comes before +: ${e.b} × ${e.c} = ${e.b * e.c}.`,
        `Now add: ${e.a} + ${e.b * e.c} = ${solveExpr(e)}.`,
      ];
    case "sub_mul":
      return [
        `Multiply first — × comes before −: ${e.b} × ${e.c} = ${e.b * e.c}.`,
        `Now take away: ${e.a} − ${e.b * e.c} = ${solveExpr(e)}.`,
      ];
    case "brackets_mul":
      return [
        `Brackets first: ${e.a} + ${e.b} = ${e.a + e.b}.`,
        `Now multiply: ${e.a + e.b} × ${e.c} = ${solveExpr(e)}.`,
      ];
    case "add_mul_sub":
      return [
        `Multiply first: ${e.b} × ${e.c} = ${e.b * e.c}.`,
        `Now left to right: ${e.a} + ${e.b * e.c} = ${e.a + e.b * e.c}, then − ${e.d} = ${solveExpr(e)}.`,
      ];
  }
}

function diagnoseExpr(e: Expr, studentAnswer: number): Diagnosis {
  const correctAnswer = solveExpr(e);
  const steps = stepsFor(e);
  if (studentAnswer === correctAnswer) {
    return { correct: true, correctAnswer, misconception: null, steps };
  }

  // Predict wrong answers from each misconception; first exact match wins.
  const predictions: { value: number; misconception: Misconception }[] = [];
  if (e.kind === "brackets_mul") {
    predictions.push({
      value: e.a + e.b * e.c, // did the × before the brackets
      misconception: MISCONCEPTIONS["ignored-brackets"],
    });
  } else {
    predictions.push({
      value: leftToRight(e),
      misconception: MISCONCEPTIONS["left-to-right"],
    });
  }

  for (const p of predictions) {
    if (Number.isInteger(p.value) && p.value !== correctAnswer && p.value === studentAnswer) {
      return { correct: false, correctAnswer, misconception: p.misconception, steps };
    }
  }
  return { correct: false, correctAnswer, misconception: null, steps };
}

function generateExpr(difficulty: number, rng: Rng): Expr {
  const tier = Math.min(Math.max(Math.round(difficulty), MIN_DIFFICULTY), MAX_DIFFICULTY);
  const id = nextId();
  switch (tier) {
    case 1: {
      return { id, difficulty: tier, kind: "add_mul", a: pick(rng, 1, 8), b: pick(rng, 2, 4), c: pick(rng, 2, 4) };
    }
    case 2: {
      // a − b × c with a ≥ b·c so the answer stays non-negative.
      const b = pick(rng, 2, 4);
      const c = pick(rng, 2, 4);
      const a = b * c + pick(rng, 1, 8);
      return { id, difficulty: tier, kind: "sub_mul", a, b, c };
    }
    case 3: {
      return { id, difficulty: tier, kind: "add_mul", a: pick(rng, 2, 12), b: pick(rng, 2, 6), c: pick(rng, 2, 6) };
    }
    case 4: {
      return { id, difficulty: tier, kind: "brackets_mul", a: pick(rng, 1, 8), b: pick(rng, 1, 8), c: pick(rng, 2, 5) };
    }
    case 5: {
      const a = pick(rng, 1, 8);
      const b = pick(rng, 2, 5);
      const c = pick(rng, 2, 5);
      const d = pick(rng, 1, a + b * c); // keep the result non-negative
      return { id, difficulty: tier, kind: "add_mul_sub", a, b, c, d };
    }
    default: {
      return { id, difficulty: tier, kind: "brackets_mul", a: pick(rng, 2, 12), b: pick(rng, 2, 12), c: pick(rng, 2, 6) };
    }
  }
}

export const ORDER_OF_OPERATIONS: MathTopic = {
  id: "order-of-operations",
  name: "Order of Operations",
  blurb: "BIDMAS done right — why 2 + 3 × 4 is 14, not 20.",
  minDifficulty: MIN_DIFFICULTY,
  maxDifficulty: MAX_DIFFICULTY,
  generate(difficulty, rng = Math.random): PosedProblem {
    const e = generateExpr(difficulty, rng);
    return {
      id: e.id,
      instruction: "Work it out",
      prompt: renderExpr(e),
      answer: solveExpr(e),
      difficulty: e.difficulty,
      diagnose: (studentAnswer: number) => diagnoseExpr(e, studentAnswer),
    };
  },
};

/** The Order of Operations misconception library (for labels / a glossary). */
export const ORDER_MISCONCEPTIONS: Misconception[] = Object.values(MISCONCEPTIONS);

// Exposed for tests.
export const _internals = { generateExpr, solveExpr, renderExpr, diagnoseExpr, leftToRight };
