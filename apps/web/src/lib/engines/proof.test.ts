import { describe, expect, it } from "vitest";
import {
  PROOF_TEMPLATES,
  proofTemplateById,
  validateProof,
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
});
