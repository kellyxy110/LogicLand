// Math Fix™ topic — Percentages of an Amount (e.g. "20% of 60"). Answers are
// whole numbers, so it reuses the same practice UI. Three deterministic,
// classic misconceptions: multiplying without dividing by 100, finding 10% and
// stopping, and subtracting the percent from the amount.
//
// Generation trick that keeps every answer a whole number: the percent is
// always a multiple of 5 and the amount is always a multiple of 20, so
// amount × percent ÷ 100 = (percent ÷ 5) × (amount ÷ 20) × ... is an integer.
import type { Diagnosis, MathTopic, Misconception, PosedProblem } from "../types";

interface PctProblem {
  id: string;
  difficulty: number;
  /** percent (a multiple of 5) and amount (a multiple of 20). */
  percent: number;
  amount: number;
}

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 6;

type Rng = () => number;
function pick(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}
function choose<T>(rng: Rng, xs: T[]): T {
  return xs[Math.floor(rng() * xs.length)];
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `pc-${Date.now().toString(36)}-${counter}`;
}

const MISCONCEPTIONS: Record<string, Misconception> = {
  "forgot-divide-100": {
    id: "forgot-divide-100",
    name: "Forgot to divide by 100",
    explain:
      "You multiplied the amount by the percent, but a percentage means ‘out of 100’, so the answer still needs to be divided by 100.",
    repair:
      "Find 1% first by dividing the amount by 100, then multiply by the percent — or do amount × percent, then ÷ 100.",
  },
  "ten-percent-only": {
    id: "ten-percent-only",
    name: "Found 10% and stopped",
    explain:
      "You found 10% of the amount correctly, but then forgot to scale it up to the full percentage that was asked for.",
    repair:
      "10% is a great start — now multiply it by how many tens are in your percentage (e.g. 30% is 10% × 3).",
  },
  "subtracted-percent": {
    id: "subtracted-percent",
    name: "Subtracted the percent",
    explain:
      "You took the percent away from the amount. But a percentage OF an amount asks for a part of it, not the amount minus that number.",
    repair:
      "‘20% of 80’ means a share of 80, not 80 − 20. Find the part by multiplying and dividing by 100.",
  },
};

export function renderPct(p: PctProblem): string {
  return `${p.percent}% of ${p.amount}`;
}

export function solvePct(p: PctProblem): number {
  return (p.amount * p.percent) / 100;
}

function stepsFor(p: PctProblem): string[] {
  return [
    `${p.percent}% means ${p.percent} out of every 100.`,
    `Work out ${p.amount} × ${p.percent} ÷ 100 = ${p.amount * p.percent} ÷ 100 = ${solvePct(p)}.`,
  ];
}

function diagnosePct(p: PctProblem, studentAnswer: number): Diagnosis {
  const correctAnswer = solvePct(p);
  const steps = stepsFor(p);
  if (studentAnswer === correctAnswer) {
    return { correct: true, correctAnswer, misconception: null, steps };
  }

  const predictions: { value: number; misconception: Misconception }[] = [];
  // "Found 10% and stopped" only makes sense when the percent is a higher
  // multiple of ten (for 10% itself, that IS the right answer).
  if (p.percent % 10 === 0 && p.percent > 10) {
    predictions.push({ value: p.amount / 10, misconception: MISCONCEPTIONS["ten-percent-only"] });
  }
  predictions.push({ value: p.amount - p.percent, misconception: MISCONCEPTIONS["subtracted-percent"] });
  predictions.push({ value: p.amount * p.percent, misconception: MISCONCEPTIONS["forgot-divide-100"] });

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

// Percent sets per tier (all multiples of 5) and the amount multiplier range.
const PERCENTS: number[][] = [
  [10, 50],
  [10, 20, 50],
  [20, 25, 50, 75],
  [5, 30, 40, 60],
  [15, 35, 70, 80],
  [45, 55, 65, 85],
];
const K_RANGE: [number, number][] = [
  [2, 5],
  [2, 6],
  [2, 7],
  [3, 8],
  [3, 9],
  [4, 10],
];

function generatePct(difficulty: number, rng: Rng): PctProblem {
  const tier = Math.min(Math.max(Math.round(difficulty), MIN_DIFFICULTY), MAX_DIFFICULTY);
  const percent = choose(rng, PERCENTS[tier - 1]);
  const [kLo, kHi] = K_RANGE[tier - 1];
  const amount = 20 * pick(rng, kLo, kHi);
  return { id: nextId(), difficulty: tier, percent, amount };
}

export const PERCENTAGES_OF_AMOUNT: MathTopic = {
  id: "percentages-of-amount",
  name: "Percentages of an Amount",
  blurb: "Find a percentage of a number — like 20% of 60.",
  minDifficulty: MIN_DIFFICULTY,
  maxDifficulty: MAX_DIFFICULTY,
  generate(difficulty, rng = Math.random): PosedProblem {
    const p = generatePct(difficulty, rng);
    return {
      id: p.id,
      instruction: "Work it out",
      prompt: renderPct(p),
      answer: solvePct(p),
      difficulty: p.difficulty,
      diagnose: (studentAnswer: number) => diagnosePct(p, studentAnswer),
    };
  },
};

/** The Percentages-of-an-Amount misconception library (for labels / a glossary). */
export const PERCENT_MISCONCEPTIONS: Misconception[] = Object.values(MISCONCEPTIONS);

// Exposed for tests.
export const _internals = { generatePct, solvePct, renderPct, diagnosePct };
