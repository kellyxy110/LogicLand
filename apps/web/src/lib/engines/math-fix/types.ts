// Math Fix™ — shared contracts across every maths topic. A topic owns its own
// problem generation and misconception diagnosis, but they all speak this common
// language so the UI, mastery engine and tests stay topic-agnostic. Adding a new
// topic is: implement a MathTopic, register it — nothing else changes.

export interface Misconception {
  id: string;
  /** Short label for dashboards / a misconception glossary. */
  name: string;
  /** Kid-friendly "here's what happened" — names the slip without shaming. */
  explain: string;
  /** The idea to repair — the thing to hold onto next time. */
  repair: string;
}

export interface Diagnosis {
  correct: boolean;
  correctAnswer: number;
  /** The identified misconception, when a known error pattern produced exactly
   *  the child's answer. Null for a correct answer or an unrecognised slip. */
  misconception: Misconception | null;
  /** Worked solution, always provided so the whole method is visible. */
  steps: string[];
}

/** A problem posed to the learner — fully self-contained: it renders itself and
 *  diagnoses an answer, so the UI never needs to know which topic it came from. */
export interface PosedProblem {
  id: string;
  /** e.g. "Solve for x" or "Work it out". */
  instruction: string;
  /** What the child reads, e.g. "3(x + 4) = 12" or "2 + 3 × 4". */
  prompt: string;
  answer: number;
  difficulty: number;
  diagnose(studentAnswer: number): Diagnosis;
}

export interface MathTopic {
  id: string;
  name: string;
  /** One-line description for the topic picker. */
  blurb: string;
  minDifficulty: number;
  maxDifficulty: number;
  generate(difficulty: number, rng?: () => number): PosedProblem;
}
