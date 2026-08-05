import { describe, expect, it } from "vitest";
import {
  PROOF_TEMPLATES,
  proofFromCanvasGraph,
  proofToGraph,
  proofTemplateById,
  validateProof,
  type ImportGraph,
  type Proof,
} from "./proof";

describe("validateProof", () => {
  it("accepts the worked templates as valid, goal-reaching proofs", () => {
    for (const p of PROOF_TEMPLATES) {
      const v = validateProof(p);
      expect(v.valid, p.id).toBe(true);
      expect(v.reachedGoal).toBe(true);
    }
  });

  it("flags a non-assumption step with no references", () => {
    const p: Proof = {
      id: "t",
      title: "t",
      goal: "g",
      steps: [
        { id: "a", kind: "assumption", statement: "Given x.", rule: "given", refs: [] },
        { id: "b", kind: "goal", statement: "So y.", rule: "therefore", refs: [] },
      ],
    };
    const v = validateProof(p);
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.message.includes("earlier step"))).toBe(true);
  });

  it("rejects forward/self references", () => {
    const p: Proof = {
      id: "t",
      title: "t",
      goal: "g",
      steps: [
        { id: "a", kind: "assumption", statement: "Given.", rule: "given", refs: [] },
        { id: "b", kind: "step", statement: "Mid.", rule: "algebra", refs: ["c"] },
        { id: "c", kind: "goal", statement: "End.", rule: "therefore", refs: ["b"] },
      ],
    };
    const v = validateProof(p);
    expect(v.valid).toBe(false);
    expect(v.issues.some((i) => i.message.includes("only build on earlier"))).toBe(true);
  });

  it("requires an assumption and a final goal", () => {
    const noGoal: Proof = {
      id: "t",
      title: "t",
      goal: "g",
      steps: [{ id: "a", kind: "assumption", statement: "Given.", rule: "given", refs: [] }],
    };
    const v = validateProof(noGoal);
    expect(v.reachedGoal).toBe(false);
    expect(v.issues.some((i) => i.message.includes("goal step"))).toBe(true);
  });

  it("proofTemplateById resolves", () => {
    expect(proofTemplateById("even-sum")?.steps.length).toBeGreaterThan(2);
    expect(proofTemplateById("nope")).toBeUndefined();
  });

  it("worked templates raise no warnings", () => {
    for (const p of PROOF_TEMPLATES) {
      expect(validateProof(p).warnings, p.id).toHaveLength(0);
    }
  });
});

describe("proof warnings (non-fatal, ADR-025)", () => {
  it("warns about a dangling step nothing later uses, without failing validity", () => {
    const p: Proof = {
      id: "t",
      title: "t",
      goal: "g",
      steps: [
        { id: "a", kind: "assumption", statement: "Given x.", rule: "given", refs: [] },
        { id: "b", kind: "step", statement: "A side note.", rule: "algebra", refs: ["a"] },
        { id: "c", kind: "goal", statement: "So x holds.", rule: "therefore", refs: ["a"] },
      ],
    };
    const v = validateProof(p);
    expect(v.valid).toBe(true); // structurally complete
    expect(v.warnings.some((w) => w.stepId === "b" && /Nothing later uses/.test(w.message))).toBe(true);
  });

  it("warns on rule/kind mismatches", () => {
    const p: Proof = {
      id: "t",
      title: "t",
      goal: "g",
      steps: [
        { id: "a", kind: "assumption", statement: "Given.", rule: "algebra", refs: [] }, // odd rule
        { id: "b", kind: "goal", statement: "Done.", rule: "given", refs: ["a"] }, // given on non-assumption
      ],
    };
    const v = validateProof(p);
    expect(v.warnings.some((w) => /Given.*assumption/i.test(w.message) || /usually.*Given/i.test(w.message))).toBe(true);
  });
});

describe("proofToGraph + proofFromCanvasGraph (Project Graph / Canvas seam)", () => {
  it("projects a proof to a depends-on graph", () => {
    const g = proofToGraph(PROOF_TEMPLATES[0]);
    expect(g.nodes.length).toBe(PROOF_TEMPLATES[0].steps.length);
    expect(g.edges.every((e) => e.relation === "depends-on")).toBe(true);
    // s2 follows from s1 → edge s2 -> s1
    expect(g.edges.some((e) => e.from === "s2" && e.to === "s1")).toBe(true);
  });

  it("imports a canvas graph into an ordered, valid-shaped proof draft", () => {
    // n1 (basic) ← n2 depends-on n1 ← n3 depends-on n2. n3 is the conclusion.
    const graph: ImportGraph = {
      nodes: [
        { id: "n3", kind: "equation", label: "so a+b = 2(m+n)" },
        { id: "n1", kind: "note", label: "a, b even" },
        { id: "n2", kind: "equation", label: "a=2m, b=2n" },
      ],
      edges: [
        { id: "e1", from: "n2", to: "n1", relation: "depends-on" },
        { id: "e2", from: "n3", to: "n2", relation: "depends-on" },
      ],
    };
    const proof = proofFromCanvasGraph(graph, "Even sum");
    const order = proof.steps.map((s) => s.id);
    // dependencies precede dependents regardless of input order
    expect(order.indexOf("n1")).toBeLessThan(order.indexOf("n2"));
    expect(order.indexOf("n2")).toBeLessThan(order.indexOf("n3"));
    // root is an assumption, last is the goal
    expect(proof.steps.find((s) => s.id === "n1")!.kind).toBe("assumption");
    expect(proof.steps[proof.steps.length - 1].kind).toBe("goal");
    // refs only point to earlier steps → structurally sound skeleton
    const v = validateProof(proof);
    expect(v.issues.filter((i) => /only build on earlier/.test(i.message))).toHaveLength(0);
  });

  it("normalises leads-to / explains into follows-from refs", () => {
    const graph: ImportGraph = {
      nodes: [
        { id: "a", kind: "flowchart", label: "start" },
        { id: "b", kind: "flowchart", label: "finish" },
      ],
      edges: [{ id: "e", from: "a", to: "b", relation: "leads-to" }], // a leads to b ⇒ b follows from a
    };
    const proof = proofFromCanvasGraph(graph);
    const b = proof.steps.find((s) => s.id === "b")!;
    expect(b.refs).toContain("a");
    expect(proof.steps[0].id).toBe("a"); // a comes first
  });

  it("falls back to input order on a cycle (validation then flags it)", () => {
    const graph: ImportGraph = {
      nodes: [
        { id: "a", kind: "note", label: "A" },
        { id: "b", kind: "note", label: "B" },
      ],
      edges: [
        { id: "e1", from: "a", to: "b", relation: "depends-on" },
        { id: "e2", from: "b", to: "a", relation: "depends-on" },
      ],
    };
    const proof = proofFromCanvasGraph(graph);
    expect(proof.steps).toHaveLength(2); // does not hang or drop nodes
  });
});
