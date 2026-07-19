// Math Fix™ topic — Fractions of an Amount (e.g. "3/4 of 12"). Integer answers,
// so it reuses the same practice UI. Two signature misconceptions, both common
// and deterministic: giving just one part (forgetting to multiply by the top
// number), and dividing by the top number instead of the bottom.
import type { Diagnosis, MathTopic, Misconception, PosedProblem } from "../types";

interface FracProblem {
  id: string;
  difficulty: number;
  /** numerator (top), denominator (bottom), amount. amount is divisible by d. */
  n: number;
  d: number;
  amount: number;
}

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 6;

type Rng = () => number;
function pick(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `fr-${Date.now().toString(36)}-${counter}`;
}

const MISCONCEPTIONS: Record<string, Misconception> = {
  "one-part-only": {
    id: "one-part-only",
    name: "Gave one part only",
    explain:
      "You split the amount into equal parts correctly, but then handed over just one part instead of the number on top of the fraction.",
    repair:
      "After you divide by the bottom number, multiply by the top number to take that many parts.",
  },
  "divided-by-numerator": {
    id: "divided-by-numerator",
    name: "Divided by the top number",
    explain:
      "It looks like you divided by the top number of the fraction — but the amount is shared using the bottom number (the denominator).",
    repair:
      "Divide the amount by the bottom number first, then multiply by the top number.",
  },
};

export function renderFrac(p: FracProblem): string {
  return `${p.n}/${p.d} of ${p.amount}`;
}

export function solveFrac(p: FracProblem): number {
  return (p.amount / p.d) * p.n;
}

function stepsFor(p: FracProblem): string[] {
  const part = p.amount / p.d;
  return [
    `Split ${p.amount} into ${p.d} equal parts: ${p.amount} ÷ ${p.d} = ${part}.`,
    `Take ${p.n} of those parts: ${part} × ${p.n} = ${solveFrac(p)}.`,
  ];
}

function diagnoseFrac(p: FracProblem, studentAnswer: number): Diagnosis {
  const correctAnswer = solveFrac(p);
  const steps = stepsFor(p);
  if (studentAnswer === correctAnswer) {
    return { correct: true, correctAnswer, misconception: null, steps };
  }

  const predictions: { value: number; misconception: Misconception }[] = [
    { value: p.amount / p.d, misconception: MISCONCEPTIONS["one-part-only"] }, // forgot ×n
    { value: p.amount / p.n, misconception: MISCONCEPTIONS["divided-by-numerator"] },
  ];
  for (const pred of predictions) {
    if (
      Number.isInteger(pred.value) &&
      pred.value !== correctAnswer &&
      pred.value === studentAnswer
    ) {
      return { correct: false, correctAnswer, misconception: pred.misconception, steps };
    }
  }
  return { correct: false, correctAnswer, misconception: null, steps };
}

function generateFrac(difficulty: number, rng: Rng): FracProblem {
  const tier = Math.min(Math.max(Math.round(difficulty), MIN_DIFFICULTY), MAX_DIFFICULTY);
  const id = nextId();
  // Denominator grows with difficulty; numerator ≥ 2 so a signature error always
  // exists; the amount is d × k so the answer is a whole number.
  const dHi = [4, 3, 5, 6, 8, 10][tier - 1];
  const dLo = tier <= 2 ? 3 : 4;
  const d = Math.max(3, pick(rng, dLo, Math.max(dLo, dHi)));
  const n = pick(rng, 2, d - 1);
  const k = pick(rng, 2, [5, 8, 6, 8, 9, 12][tier - 1]);
  return { id, difficulty: tier, n, d, amount: d * k };
}

export const FRACTIONS_OF_AMOUNT: MathTopic = {
  id: "fractions-of-amount",
  name: "Fractions of an Amount",
  blurb: "Work out a fraction of a number — like 3/4 of 12.",
  minDifficulty: MIN_DIFFICULTY,
  maxDifficulty: MAX_DIFFICULTY,
  generate(difficulty, rng = Math.random): PosedProblem {
    const p = generateFrac(difficulty, rng);
    return {
      id: p.id,
      instruction: "Work it out",
      prompt: renderFrac(p),
      answer: solveFrac(p),
      difficulty: p.difficulty,
      diagnose: (studentAnswer: number) => diagnoseFrac(p, studentAnswer),
    };
  },
};

/** The Fractions-of-an-Amount misconception library (for labels / a glossary). */
export const FRACTION_MISCONCEPTIONS: Misconception[] = Object.values(MISCONCEPTIONS);

// Exposed for tests.
export const _internals = { generateFrac, solveFrac, renderFrac, diagnoseFrac };
