"use server";
// Canvas V2 "Explain this block" (ADR-025). Routes a semantic block to the
// engine's scaffolded tutor (never the final answer) and ALWAYS degrades to a
// deterministic local explanation when the engine or provider is unavailable —
// the same fail-safe contract as Math Fix. The frontend never calls an LLM
// directly; this server action attaches the service token via the engine client.
import { engine } from "@/lib/engine";
import type { CanvasBlockKind } from "@/lib/engines/canvas-doc";

export interface ExplainBlockInput {
  kind: CanvasBlockKind;
  text: string;
}

export interface ExplainBlockResult {
  /** "ai" when the engine tutor answered; "example" for the deterministic path. */
  source: "ai" | "example";
  text: string;
  safe: boolean;
}

/** Deterministic, offline explanation — the guaranteed fallback. Scaffolds a
 * next thought rather than handing over an answer (AI-assists-never-replaces). */
function localExplain(kind: CanvasBlockKind, text: string): string {
  const t = text.trim();
  switch (kind) {
    case "equation":
      return t.includes("=")
        ? "This equation says the two sides are worth the same. Try working out each side on its own, then check they match."
        : "This is an expression to evaluate. Do what's inside brackets first, then work left to right.";
    case "code":
      return "Read your code one line at a time and say out loud what each line does. Where does the data start, and where does it end up?";
    case "flowchart":
      return "This is one step in a plan. Ask: what has to happen just before it, and what comes right after? Link them with “leads to”.";
    case "label":
      return "A label names a part of your work. Does its name make it obvious what it points to?";
    default:
      return "Read your note back to a friend. Is there one idea you could make clearer or split into two?";
  }
}

export async function explainCanvasBlock(input: ExplainBlockInput): Promise<ExplainBlockResult> {
  const text = (input.text ?? "").trim();
  if (!text) {
    return { source: "example", text: "Add some content to this block first, then ask for a hint.", safe: true };
  }

  const question =
    `Explain this ${input.kind} to a young coder in one or two friendly sentences, ` +
    `as a hint and without giving a final answer: ${text}`.slice(0, 500);

  try {
    const reply = await engine.askTutor({ student_id: "canvas", question, hint_level: 1 });
    // Child-safety is enforced at the engine boundary; honour its verdict.
    if (reply.safe && reply.answer.trim()) {
      return { source: "ai", text: reply.answer.trim(), safe: true };
    }
  } catch (err) {
    console.error("[explainCanvasBlock] engine unavailable, using local explanation:", err instanceof Error ? err.message : String(err));
  }
  return { source: "example", text: localExplain(input.kind, text), safe: true };
}
