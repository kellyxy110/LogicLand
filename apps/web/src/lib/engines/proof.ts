// Proof Workshop engine (Phase 1 #4) — pure and deterministic. A proof is an
// ordered chain of steps; the system validates the STRUCTURE of the reasoning
// (assumptions, references to earlier steps, a reached goal) — ADR-015: rules
// decide validity, never an LLM. Extensible toward formal proofs: each step
// names a `rule`, and per-rule symbolic checkers can plug into validateProof
// later without changing callers or the UI.

export type StepKind = "assumption" | "step" | "goal";

export interface ProofStep {
  id: string;
  kind: StepKind;
  statement: string;
  /** Justification rule id (see RULES). */
  rule?: string;
  /** Ids of earlier steps this one follows from. */
  refs: string[];
}

export interface Proof {
  id: string;
  title: string;
  /** What we're proving. */
  goal: string;
  steps: ProofStep[];
}

export interface Rule {
  id: string;
  label: string;
  category: "logic" | "algebra" | "geometry";
}

export const RULES: Rule[] = [
  { id: "given", label: "Given / assumption", category: "logic" },
  { id: "definition", label: "By definition", category: "logic" },
  { id: "substitution", label: "By substitution", category: "algebra" },
  { id: "algebra", label: "By algebra", category: "algebra" },
  { id: "arithmetic", label: "By arithmetic", category: "algebra" },
  { id: "angle-fact", label: "By an angle fact", category: "geometry" },
  { id: "congruence", label: "By congruent triangles", category: "geometry" },
  { id: "therefore", label: "Therefore (conclusion)", category: "logic" },
];

export function ruleById(id?: string): Rule | undefined {
  return id ? RULES.find((r) => r.id === id) : undefined;
}

export interface ProofIssue {
  stepId?: string;
  message: string;
}

export interface ProofValidation {
  valid: boolean;
  reachedGoal: boolean;
  issues: ProofIssue[];
}

/**
 * Validate the structure of a proof deterministically:
 *   • assumptions cite nothing; other steps must cite ≥1 earlier step
 *   • references must exist and precede the step (no self/forward refs)
 *   • every step needs a statement
 *   • the proof must start from at least one assumption and END on a goal step
 */
export function validateProof(proof: Proof): ProofValidation {
  const issues: ProofIssue[] = [];
  const pos = new Map<string, number>();
  proof.steps.forEach((s, i) => pos.set(s.id, i));

  let hasAssumption = false;
  proof.steps.forEach((step, i) => {
    if (!step.statement.trim()) {
      issues.push({ stepId: step.id, message: "This step needs a statement." });
    }
    if (step.kind === "assumption") {
      hasAssumption = true;
      if (step.refs.length > 0) {
        issues.push({ stepId: step.id, message: "An assumption doesn't follow from earlier steps." });
      }
    } else {
      if (step.refs.length === 0) {
        issues.push({ stepId: step.id, message: "Say which earlier step(s) this follows from." });
      }
      for (const ref of step.refs) {
        const p = pos.get(ref);
        if (p === undefined) {
          issues.push({ stepId: step.id, message: "References an unknown step." });
        } else if (p >= i) {
          issues.push({ stepId: step.id, message: "You can only build on earlier steps." });
        }
      }
    }
  });

  const last = proof.steps[proof.steps.length - 1];
  const reachedGoal = !!last && last.kind === "goal";
  if (!hasAssumption) {
    issues.push({ message: "Start from at least one assumption (a “Given”)." });
  }
  if (!reachedGoal) {
    issues.push({ message: "End with a goal step — your conclusion." });
  }

  return { valid: issues.length === 0, reachedGoal, issues };
}

const step = (id: string, kind: StepKind, statement: string, rule: string, refs: string[] = []): ProofStep => ({
  id,
  kind,
  statement,
  rule,
  refs,
});

/** Worked, valid starter proofs — editable in the workshop. */
export const PROOF_TEMPLATES: Proof[] = [
  {
    id: "even-sum",
    title: "The sum of two even numbers is even",
    goal: "If a and b are even, then a + b is even.",
    steps: [
      step("s1", "assumption", "Let a and b be even numbers.", "given"),
      step("s2", "step", "Then a = 2m and b = 2n for whole numbers m and n.", "definition", ["s1"]),
      step("s3", "step", "So a + b = 2m + 2n = 2(m + n).", "algebra", ["s2"]),
      step("s4", "goal", "2(m + n) is even, so a + b is even.", "therefore", ["s3"]),
    ],
  },
  {
    id: "straight-line",
    title: "Angles on a straight line add to 180°",
    goal: "If x and y are angles on a straight line, then x + y = 180°.",
    steps: [
      step("s1", "assumption", "Let angles x and y sit on a straight line.", "given"),
      step("s2", "step", "A straight line is a half turn, which is 180°.", "angle-fact", ["s1"]),
      step("s3", "goal", "So x + y = 180°.", "therefore", ["s2"]),
    ],
  },
];

export function proofTemplateById(id: string): Proof | undefined {
  return PROOF_TEMPLATES.find((p) => p.id === id);
}
