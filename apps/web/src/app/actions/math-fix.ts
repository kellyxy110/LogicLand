"use server";
// Math Fix™ mastery telemetry. Each answered question reports how it went; we
// fold it into the student's per-topic mastery for the parent + teacher
// dashboards. Resilient: never blocks practice if the DB hiccups, and silently
// no-ops for a signed-in user who isn't a student (teacher/parent trying it out).
import {
  getMathMastery as dbGetMathMastery,
  recordMathAttempt,
  type MathAttemptInput,
  type MathMasteryView,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";
import { workedExampleText } from "@/lib/engines/math-fix";

export async function recordMathAttemptAction(input: MathAttemptInput): Promise<void> {
  try {
    const student = await currentStudent();
    await recordMathAttempt(student.id, input);
  } catch (err) {
    console.error(
      "[recordMathAttempt] could not save math mastery:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getMyMathMastery(): Promise<MathMasteryView[]> {
  try {
    const student = await currentStudent();
    return dbGetMathMastery(student.id);
  } catch {
    return [];
  }
}

export interface MathExplainInput {
  topicId: string;
  prompt: string;
  instruction: string;
  correctAnswer: string;
  studentAnswer?: string | null;
  misconceptionName?: string | null;
  steps: string[];
}

export interface MathExplanation {
  text: string;
  /** "ai" from the engine's LLM; "example" from the deterministic fallback. */
  source: "ai" | "example";
}

/**
 * Re-explain a Math Fix problem another way. The deterministic diagnosis stays
 * the source of truth; this only re-words the method. It asks the engine (never
 * an LLM directly — rule 8; the engine runs it through provider.py + safety.py)
 * when LOGICLAND_ENGINE_URL is configured, and ALWAYS falls back to a
 * deterministic worked example so the feature works even before the engine is
 * deployed. Never throws.
 */
export async function explainMathAction(
  input: MathExplainInput,
): Promise<MathExplanation> {
  const base = process.env.LOGICLAND_ENGINE_URL;
  if (base) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/math-fix/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: input.topicId,
          prompt: input.prompt,
          instruction: input.instruction,
          correct_answer: input.correctAnswer,
          student_answer: input.studentAnswer ?? null,
          misconception_name: input.misconceptionName ?? null,
          steps: input.steps,
        }),
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { explanation?: string };
        if (data.explanation) return { text: data.explanation, source: "ai" };
      }
    } catch {
      // Engine unavailable / slow — fall through to the deterministic example.
    }
  }
  return { text: workedExampleText(input.topicId), source: "example" };
}
