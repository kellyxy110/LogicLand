// Math Fix™ — the linear-equations problem engine. Pure, deterministic, and
// testable (no LLM): it generates graded equations with clean integer answers,
// renders them, and produces a kid-friendly worked solution. Diagnosis of *why*
// a wrong answer is wrong lives in ./diagnose — the part that makes Math Fix
// more than a marking machine.
//
// A problem is one of two presented forms, because the shape matters for the
// misconceptions it invites:
//   simple:  a·x + b = d          (b may be 0, a may be 1)
//   bracket: a·(x + c) = d        (distribution is the interesting step)

export type Problem =
  | {
      id: string;
      form: "simple";
      a: number;
      b: number;
      d: number;
      answer: number;
      difficulty: number;
    }
  | {
      id: string;
      form: "bracket";
      a: number;
      c: number;
      d: number;
      answer: number;
      difficulty: number;
    };

/** Lowest and highest difficulty tiers Math Fix generates for this topic. */
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 6;

type Rng = () => number;

function pick(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `mf-${Date.now().toString(36)}-${counter}`;
}

/** Render a problem as the equation the child reads, e.g. "3(x + 4) = 12". */
export function renderProblem(p: Problem): string {
  if (p.form === "bracket") {
    const inside = p.c >= 0 ? `x + ${p.c}` : `x - ${-p.c}`;
    return `${p.a}(${inside}) = ${p.d}`;
  }
  const coeff = p.a === 1 ? "x" : `${p.a}x`;
  if (p.b === 0) return `${coeff} = ${p.d}`;
  const sign = p.b >= 0 ? `+ ${p.b}` : `- ${-p.b}`;
  return `${coeff} ${sign} = ${p.d}`;
}

/** The correct value of x for a problem (also stored as `answer`). */
export function solve(p: Problem): number {
  return p.form === "bracket" ? p.d / p.a - p.c : (p.d - p.b) / p.a;
}

/** Kid-friendly, step-by-step worked solution — always available (shown after a
 *  wrong answer, and on request), so a child can see the *whole* method, not
 *  just the fixed idea. */
export function solutionSteps(p: Problem): string[] {
  if (p.form === "bracket") {
    const ac = p.a * p.c;
    const afterMove = p.d - ac;
    const steps = [
      `Share the ${p.a} with both parts inside the brackets: ${p.a}·x and ${p.a}·${p.c}.`,
      `That gives ${p.a}x + ${ac} = ${p.d}.`,
      `Take ${ac} from both sides: ${p.a}x = ${afterMove}.`,
      `Divide both sides by ${p.a}: x = ${p.answer}.`,
    ];
    return steps;
  }
  const steps: string[] = [];
  if (p.b !== 0) {
    const moved = p.d - p.b;
    steps.push(
      p.b > 0
        ? `Take ${p.b} from both sides: ${p.a === 1 ? "x" : `${p.a}x`} = ${moved}.`
        : `Add ${-p.b} to both sides: ${p.a === 1 ? "x" : `${p.a}x`} = ${moved}.`,
    );
  }
  if (p.a !== 1) {
    steps.push(`Divide both sides by ${p.a}: x = ${p.answer}.`);
  } else if (p.b === 0) {
    steps.push(`x is already on its own: x = ${p.answer}.`);
  }
  return steps;
}

/** Generate a fresh problem at the given difficulty tier (1–6). Answers are
 *  always non-negative integers so the arithmetic stays age-appropriate. */
export function generateProblem(
  difficulty: number,
  rng: Rng = Math.random,
): Problem {
  const tier = Math.min(Math.max(Math.round(difficulty), MIN_DIFFICULTY), MAX_DIFFICULTY);
  const id = nextId();

  switch (tier) {
    case 1: {
      // x + b = d
      const x = pick(rng, 1, 10);
      const b = pick(rng, 1, 9);
      return { id, form: "simple", a: 1, b, d: x + b, answer: x, difficulty: tier };
    }
    case 2: {
      // a·x = d
      const x = pick(rng, 1, 10);
      const a = pick(rng, 2, 5);
      return { id, form: "simple", a, b: 0, d: a * x, answer: x, difficulty: tier };
    }
    case 3: {
      // a·x + b = d (b can be negative)
      const x = pick(rng, 1, 10);
      const a = pick(rng, 2, 5);
      const b = pick(rng, -8, 8);
      return { id, form: "simple", a, b, d: a * x + b, answer: x, difficulty: tier };
    }
    case 4: {
      // a·(x + c) = d, small
      const x = pick(rng, 0, 8);
      const a = pick(rng, 2, 3);
      const c = pick(rng, 1, 6);
      return { id, form: "bracket", a, c, d: a * (x + c), answer: x, difficulty: tier };
    }
    case 5: {
      // a·(x + c) = d, bigger
      const x = pick(rng, 0, 10);
      const a = pick(rng, 2, 5);
      const c = pick(rng, 1, 8);
      return { id, form: "bracket", a, c, d: a * (x + c), answer: x, difficulty: tier };
    }
    default: {
      // 6: bracket with a possible negative inside
      const x = pick(rng, 1, 12);
      const a = pick(rng, 3, 6);
      const c = pick(rng, -6, 8);
      return { id, form: "bracket", a, c, d: a * (x + c), answer: x, difficulty: tier };
    }
  }
}
