// The LogicLand skill graph catalog (ADR-011/017) — the concept dependency map
// under the three foundations. Kept as plain data (like the academy catalog);
// the pure engine in lib/engines/skill-graph.ts reads it. Evidence keys tie a
// skill to a real signal that proves it: today, mastered Math Fix topics
// ("math:<topicId>"). More sources (missions, Studio projects, quizzes) plug in
// here as each environment learns to report evidence — no engine change needed.
import type { Skill } from "@/lib/engines/skill-graph";

export const SKILLS: Skill[] = [
  // ── Programming & Software Engineering ──────────────────────────────────
  {
    id: "sequence",
    name: "Sequence",
    foundation: "programming",
    blurb: "Putting steps in the right order.",
    prereqs: [],
    evidence: ["code:sequence"],
  },
  {
    id: "variables",
    name: "Variables",
    foundation: "programming",
    blurb: "Storing and naming a value.",
    prereqs: [],
    evidence: ["code:variables"],
  },
  {
    id: "loops",
    name: "Loops",
    foundation: "programming",
    blurb: "Repeating steps without rewriting them.",
    prereqs: ["sequence"],
    evidence: ["code:loops"],
  },
  {
    id: "conditions",
    name: "Conditions",
    foundation: "programming",
    blurb: "Making choices with if / else.",
    prereqs: ["sequence"],
    evidence: ["code:conditions"],
  },
  {
    id: "functions",
    name: "Functions",
    foundation: "programming",
    blurb: "Naming a block of steps to reuse it.",
    prereqs: ["variables", "loops"],
    evidence: ["code:functions"],
  },
  {
    id: "events",
    name: "Events",
    foundation: "programming",
    blurb: "Making things happen on a click or key.",
    prereqs: ["conditions"],
    evidence: ["code:events"],
  },
  {
    id: "debugging",
    name: "Debugging",
    foundation: "programming",
    blurb: "Finding and fixing what went wrong.",
    prereqs: ["sequence"],
  },
  {
    id: "data-structures",
    name: "Lists & Data",
    foundation: "programming",
    blurb: "Holding many values together.",
    prereqs: ["variables", "loops"],
    evidence: ["code:data-structures"],
  },

  // ── Mathematics & Computational Reasoning ───────────────────────────────
  {
    id: "number-sense",
    name: "Number Sense",
    foundation: "mathematics",
    blurb: "Understanding how numbers work together.",
    prereqs: [],
  },
  {
    id: "order-of-operations",
    name: "Order of Operations",
    foundation: "mathematics",
    blurb: "Doing the right step first (BIDMAS).",
    prereqs: ["number-sense"],
    evidence: ["math:order-of-operations"],
  },
  {
    id: "fractions",
    name: "Fractions of an Amount",
    foundation: "mathematics",
    blurb: "Finding a fraction of a number.",
    prereqs: ["number-sense"],
    evidence: ["math:fractions-of-amount"],
  },
  {
    id: "percentages",
    name: "Percentages of an Amount",
    foundation: "mathematics",
    blurb: "Finding a percentage of a number.",
    prereqs: ["fractions"],
    evidence: ["math:percentages-of-amount"],
  },
  {
    id: "linear-equations",
    name: "Linear Equations",
    foundation: "mathematics",
    blurb: "Solving for an unknown x.",
    prereqs: ["order-of-operations"],
    evidence: ["math:linear-equations"],
  },

  // ── Artificial Intelligence ─────────────────────────────────────────────
  {
    id: "what-is-ai",
    name: "What is AI?",
    foundation: "ai",
    blurb: "How machines can seem to learn.",
    prereqs: [],
  },
];

/** Evidence key for a mastered Math Fix topic — the format skill.evidence uses. */
export function mathEvidenceKey(topicId: string): string {
  return `math:${topicId}`;
}
