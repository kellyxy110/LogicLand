// Math Fix™ topic — Solving Linear Equations. Wraps the linear-equations engine
// (../problems, ../diagnose) in the shared MathTopic contract so it plugs into
// the registry, the topic picker and the practice UI like any other topic.
import { diagnose } from "../diagnose";
import {
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  generateProblem,
  renderProblem,
} from "../problems";
import type { MathTopic, PosedProblem } from "../types";

export const LINEAR_EQUATIONS: MathTopic = {
  id: "linear-equations",
  name: "Solving Linear Equations",
  blurb: "Find x — from x + 5 = 8 up to 3(x + 4) = 12.",
  minDifficulty: MIN_DIFFICULTY,
  maxDifficulty: MAX_DIFFICULTY,
  generate(difficulty, rng): PosedProblem {
    const p = generateProblem(difficulty, rng);
    return {
      id: p.id,
      instruction: "Solve for x",
      prompt: renderProblem(p),
      answer: p.answer,
      difficulty: p.difficulty,
      diagnose: (studentAnswer: number) => diagnose(p, studentAnswer),
    };
  },
};
