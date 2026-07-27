import { describe, expect, it } from "vitest";
import { SKILLS, mathEvidenceKey } from "./skills";
import {
  masteredIdsFromEvidence,
  skillDepth,
  skillStatus,
  topologicalLayers,
  validateGraph,
  type Skill,
} from "@/lib/engines/skill-graph";

describe("skill graph engine", () => {
  const line: Skill[] = [
    { id: "a", name: "A", foundation: "programming", blurb: "", prereqs: [] },
    { id: "b", name: "B", foundation: "programming", blurb: "", prereqs: ["a"] },
    { id: "c", name: "C", foundation: "programming", blurb: "", prereqs: ["b"] },
  ];

  it("computes status: mastered / unlocked / locked", () => {
    const mastered = new Set(["a"]);
    expect(skillStatus(line[0], mastered)).toBe("mastered");
    expect(skillStatus(line[1], mastered)).toBe("unlocked"); // prereq a is mastered
    expect(skillStatus(line[2], mastered)).toBe("locked"); // prereq b not mastered
  });

  it("lays skills out in dependency tiers", () => {
    expect(skillDepth(line, "a")).toBe(0);
    expect(skillDepth(line, "c")).toBe(2);
    const layers = topologicalLayers(line);
    expect(layers.map((t) => t.map((s) => s.id))).toEqual([["a"], ["b"], ["c"]]);
  });

  it("maps evidence to mastered skills", () => {
    const skills: Skill[] = [
      { id: "x", name: "X", foundation: "mathematics", blurb: "", prereqs: [], evidence: ["math:t1"] },
      { id: "y", name: "Y", foundation: "mathematics", blurb: "", prereqs: [] },
    ];
    const mastered = masteredIdsFromEvidence(skills, new Set(["math:t1"]));
    expect(mastered.has("x")).toBe(true);
    expect(mastered.has("y")).toBe(false);
  });

  it("flags cycles and unknown prereqs", () => {
    const bad: Skill[] = [
      { id: "a", name: "A", foundation: "programming", blurb: "", prereqs: ["b"] },
      { id: "b", name: "B", foundation: "programming", blurb: "", prereqs: ["a"] },
      { id: "c", name: "C", foundation: "programming", blurb: "", prereqs: ["ghost"] },
    ];
    const problems = validateGraph(bad);
    expect(problems.some((p) => p.includes("cycle"))).toBe(true);
    expect(problems.some((p) => p.includes("unknown prerequisite ghost"))).toBe(true);
  });
});

describe("SKILLS catalog", () => {
  it("is a healthy graph (no dup ids, unknown prereqs or cycles)", () => {
    expect(validateGraph(SKILLS)).toEqual([]);
  });

  it("covers all three foundations", () => {
    const foundations = new Set(SKILLS.map((s) => s.foundation));
    expect(foundations).toEqual(new Set(["programming", "mathematics", "ai"]));
  });

  it("wires every live Math Fix topic to a skill via evidence", () => {
    const evidence = new Set(SKILLS.flatMap((s) => s.evidence ?? []));
    for (const topicId of [
      "linear-equations",
      "order-of-operations",
      "fractions-of-amount",
      "percentages-of-amount",
    ]) {
      expect(evidence.has(mathEvidenceKey(topicId)), topicId).toBe(true);
    }
  });

  it("mastering the four Math Fix topics masters their skills and unlocks the next", () => {
    const achieved = new Set(
      ["linear-equations", "order-of-operations", "fractions-of-amount", "percentages-of-amount"].map(
        mathEvidenceKey,
      ),
    );
    const mastered = masteredIdsFromEvidence(SKILLS, achieved);
    expect(mastered.has("percentages")).toBe(true);
    expect(mastered.has("linear-equations")).toBe(true);
  });
});
