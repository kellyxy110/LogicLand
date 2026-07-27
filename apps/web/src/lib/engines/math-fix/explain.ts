// A deterministic "explain it another way" — a fully worked *analogous* example
// for a topic, built from the same pure engine (ADR-015). This is the guaranteed
// fallback the Sketchpad shows when the engine's LLM re-explanation isn't
// available, so the feature always works and is child-safe by construction.
import { mathTopicById } from "./registry";

export interface WorkedExample {
  prompt: string;
  steps: string[];
  answer: number;
}

/** Generate a fresh problem of the topic and return its fully worked solution. */
export function workedExample(
  topicId: string,
  difficulty = 3,
  rng?: () => number,
): WorkedExample | null {
  const topic = mathTopicById(topicId);
  if (!topic) return null;
  const p = topic.generate(difficulty, rng);
  // Diagnosing the correct answer yields the correct worked steps.
  const d = p.diagnose(p.answer);
  return { prompt: p.prompt, steps: d.steps, answer: p.answer };
}

/** A friendly one-paragraph worked example, or a gentle nudge if unavailable. */
export function workedExampleText(topicId: string): string {
  const w = workedExample(topicId);
  if (!w) return "Let's try another one together. 🌟";
  return `Here's a similar one, worked out — ${w.prompt}: ${w.steps.join(" ")}`;
}
