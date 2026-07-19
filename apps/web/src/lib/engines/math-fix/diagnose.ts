// Math Fix™ — the misconception engine. This is what makes Math Fix more than a
// red-pen: instead of just "wrong", it works out *which idea* a child is missing
// by predicting the exact wrong answer each known misconception would produce,
// then matching it against what they actually typed. Fully deterministic for
// linear equations — no LLM needed to be reliable. (An LLM can later warm up the
// wording; the diagnosis itself stays rule-based and trustworthy.)
import type { Problem } from "./problems";
import { solutionSteps } from "./problems";
import type { Diagnosis, Misconception } from "./types";

// The misconception library for linear equations. Each entry also carries a
// `predict(problem)` that returns the wrong answer this misconception yields, or
// null when it doesn't apply to that problem's shape.
interface MisconceptionModel extends Misconception {
  predict: (p: Problem) => number | null;
}

const MODELS: MisconceptionModel[] = [
  {
    id: "ignored-coefficient",
    name: "Skipped the multiply",
    explain:
      "It looks like you treated the number in front of the brackets as if it had already gone — like the equation was just (x + c) = d.",
    repair:
      "The number outside the brackets still has to be shared with everything inside before you can move on. Share it first, then solve.",
    predict: (p) => (p.form === "bracket" ? p.d - p.c : null),
  },
  {
    id: "partial-distribution",
    name: "Shared with only one part",
    explain:
      "You multiplied the x by the outside number, but the other number inside the brackets didn't get multiplied too.",
    repair:
      "When you share the outside number, every part inside the brackets gets it — both the x and the number.",
    predict: (p) =>
      p.form === "bracket" && (p.d - p.c) % p.a === 0 ? (p.d - p.c) / p.a : null,
  },
  {
    id: "forgot-final-divide",
    name: "Forgot the last divide",
    explain:
      "You shared the number correctly, but at the end x was still multiplied by it — the last divide got missed.",
    repair:
      "After you tidy the equation to (number)·x = (number), divide both sides by that number to get x on its own.",
    predict: (p) => (p.form === "bracket" ? p.d - p.a * p.c : null),
  },
  {
    id: "sign-error",
    name: "Moved a number the wrong way",
    explain:
      "A number crossed the equals sign but kept its sign — when it moves across, it flips from add to take-away (or the other way).",
    repair:
      "Whatever you do to one side, do to the other. Moving a +number across means taking it away on the other side.",
    predict: (p) => {
      if (p.form === "bracket") return p.d / p.a + p.c; // added c instead of subtracting
      if (p.b !== 0 && (p.d + p.b) % p.a === 0) return (p.d + p.b) / p.a;
      return null;
    },
  },
  {
    id: "forgot-divide-simple",
    name: "Forgot to divide",
    explain:
      "You moved the numbers across correctly, but x was still multiplied by its coefficient — it didn't get divided out.",
    repair:
      "Once you have (number)·x = (number), divide both sides by that number so x stands alone.",
    predict: (p) => (p.form === "simple" && p.a !== 1 ? p.d - p.b : null),
  },
];

/** Diagnose a submitted answer: right or wrong, which misconception (if any), and
 *  the full worked solution. Wrong answers are matched against the misconception
 *  models in priority order; the first exact match wins. */
export function diagnose(p: Problem, studentAnswer: number): Diagnosis {
  const steps = solutionSteps(p);
  if (studentAnswer === p.answer) {
    return { correct: true, correctAnswer: p.answer, misconception: null, steps };
  }
  for (const m of MODELS) {
    const predicted = m.predict(p);
    if (
      predicted !== null &&
      Number.isInteger(predicted) &&
      predicted !== p.answer &&
      predicted === studentAnswer
    ) {
      const { predict: _predict, ...misconception } = m;
      return { correct: false, correctAnswer: p.answer, misconception, steps };
    }
  }
  return { correct: false, correctAnswer: p.answer, misconception: null, steps };
}

/** The full library (without predictors) — for a misconceptions glossary / the
 *  parent-teacher view of what a child has struggled with. */
export function misconceptionLibrary(): Misconception[] {
  return MODELS.map(({ predict: _p, ...rest }) => rest);
}
