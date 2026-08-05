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
  /** Hard structural errors — these make the proof invalid. */
  issues: ProofIssue[];
  /** Non-fatal hints: dangling reasoning, rule/kind mismatches. `valid` ignores
   * these, so a warned proof can still be complete (ADR-025). */
  warnings: ProofIssue[];
}

/**
 * Validate the structure of a proof deterministically:
 *   • assumptions cite nothing; other steps must cite ≥1 earlier step
 *   • references must exist and precede the step (no self/forward refs)
 *   • every step needs a statement
 *   • the proof must start from at least one assumption and END on a goal step
 * Plus non-fatal `warnings` (unused steps, rule↔kind mismatches) that guide
 * without blocking. Rules decide, never an LLM (ADR-015).
 */
export function validateProof(proof: Proof): ProofValidation {
  const issues: ProofIssue[] = [];
  const warnings: ProofIssue[] = [];
  const pos = new Map<string, number>();
  proof.steps.forEach((s, i) => pos.set(s.id, i));

  // Which steps are cited by some later step (for dangling-reasoning warnings).
  const referenced = new Set<string>();
  for (const s of proof.steps) for (const r of s.refs) referenced.add(r);

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
      if (step.rule && step.rule !== "given") {
        warnings.push({ stepId: step.id, message: "Assumptions are usually justified “Given”." });
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
      if (step.rule === "given") {
        warnings.push({ stepId: step.id, message: "“Given” is for assumptions — pick the rule you used." });
      }
    }

    // Dangling reasoning: a non-goal step nothing later builds on.
    if (step.kind !== "goal" && !referenced.has(step.id) && step.statement.trim()) {
      warnings.push({ stepId: step.id, message: "Nothing later uses this step — is it needed?" });
    }
  });

  const last = proof.steps[proof.steps.length - 1];
  const reachedGoal = !!last && last.kind === "goal";
  if (last && last.kind === "goal" && last.rule && last.rule !== "therefore") {
    warnings.push({ stepId: last.id, message: "A goal usually concludes with “Therefore”." });
  }
  if (!hasAssumption) {
    issues.push({ message: "Start from at least one assumption (a “Given”)." });
  }
  if (!reachedGoal) {
    issues.push({ message: "End with a goal step — your conclusion." });
  }

  return { valid: issues.length === 0, reachedGoal, issues, warnings };
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

// --- Project Graph contract (ADR-025) --------------------------------------
// A proof projects to the SAME {nodes, edges} shape the Canvas produces, so the
// Project Graph can ingest either. A ref "A follows from B" is a directed edge
// A --depends-on--> B.
export interface ProofGraphNode {
  id: string;
  kind: StepKind;
  label: string;
}
export interface ProofGraph {
  nodes: ProofGraphNode[];
  edges: { id: string; from: string; to: string; relation: "depends-on" }[];
}

const firstLine = (s: string): string => s.split("\n").map((l) => l.trim()).find(Boolean)?.slice(0, 60) ?? "";

export function proofToGraph(proof: Proof): ProofGraph {
  const nodes: ProofGraphNode[] = proof.steps.map((s) => ({
    id: s.id,
    kind: s.kind,
    label: firstLine(s.statement) || s.kind,
  }));
  const edges: ProofGraph["edges"] = [];
  for (const s of proof.steps) {
    for (const r of s.refs) {
      edges.push({ id: `${s.id}->${r}`, from: s.id, to: r, relation: "depends-on" });
    }
  }
  return { nodes, edges };
}

// --- Import from a Canvas graph (the ADR-021/025 seam) ----------------------
// A minimal shape matching canvas-doc's `toGraph()` output — declared locally so
// the two engines stay decoupled (no import cycle).
export interface ImportGraphNode {
  id: string;
  kind: string;
  label: string;
}
export interface ImportGraphEdge {
  id: string;
  from: string;
  to: string;
  relation: "depends-on" | "explains" | "leads-to";
}
export interface ImportGraph {
  nodes: ImportGraphNode[];
  edges: ImportGraphEdge[];
}

/**
 * Build a proof DRAFT from a Canvas graph, deterministically:
 *   • an edge's meaning is normalised to "X follows from Y" (X.refs += Y):
 *       depends-on  from→to      ⇒ from follows from to
 *       leads-to    from→to      ⇒ to follows from from
 *       explains    from→to      ⇒ to follows from from
 *   • nodes are ordered so each step's references come before it (topological;
 *     a cycle falls back to input order, which validateProof will then flag);
 *   • roots (follow from nothing) become assumptions, the last node the goal.
 * The result is editable in the workshop — a starting scaffold, not a verdict.
 */
export function proofFromCanvasGraph(graph: ImportGraph, title = "Imported from Canvas"): Proof {
  const ids = graph.nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const deps = new Map<string, Set<string>>(ids.map((id) => [id, new Set<string>()]));
  const addDep = (of: string, on: string) => {
    if (of !== on && idSet.has(of) && idSet.has(on)) deps.get(of)!.add(on);
  };
  for (const e of graph.edges) {
    if (e.relation === "depends-on") addDep(e.from, e.to);
    else addDep(e.to, e.from); // leads-to / explains
  }

  // Kahn topological sort: a node emits only after all nodes it depends on.
  const order: string[] = [];
  const remaining = new Set(ids);
  const emitted = new Set<string>();
  let progress = true;
  while (remaining.size && progress) {
    progress = false;
    for (const id of ids) {
      if (!remaining.has(id)) continue;
      const ready = [...deps.get(id)!].every((d) => emitted.has(d) || !idSet.has(d));
      if (ready) {
        order.push(id);
        emitted.add(id);
        remaining.delete(id);
        progress = true;
      }
    }
  }
  // Any leftovers (a cycle) keep their original order; validation will flag them.
  for (const id of ids) if (remaining.has(id)) order.push(id);

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const steps: ProofStep[] = order.map((id, i) => {
    const node = nodeById.get(id)!;
    const refs = [...deps.get(id)!];
    const isLast = i === order.length - 1;
    const kind: StepKind = isLast ? "goal" : refs.length === 0 ? "assumption" : "step";
    const rule = kind === "assumption" ? "given" : kind === "goal" ? "therefore" : "definition";
    return { id, kind, statement: node.label, rule, refs };
  });

  const goalStatement = steps[steps.length - 1]?.statement ?? "";
  return { id: `from-canvas-${Date.now().toString(36)}`, title, goal: goalStatement, steps };
}
