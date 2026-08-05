import { describe, expect, it } from "vitest";
import {
  emptyGraph,
  fromCanvasGraph,
  fromProofGraph,
  graphStats,
  leaves,
  longestChainLength,
  mergeGraphs,
  nodeDepth,
  orphans,
  roots,
  topologicalLayers,
  validateGraph,
  type InGraph,
} from "./project-graph";

const canvas: InGraph = {
  nodes: [
    { id: "b1", kind: "note", label: "a, b even" },
    { id: "b2", kind: "equation", label: "a=2m, b=2n" },
    { id: "b3", kind: "equation", label: "a+b = 2(m+n)" },
    { id: "loose", kind: "note", label: "unlinked idea" },
  ],
  edges: [
    { id: "e1", from: "b2", to: "b1", relation: "depends-on" },
    { id: "e2", from: "b3", to: "b2", relation: "depends-on" },
  ],
};

const proof: InGraph = {
  nodes: [
    { id: "s1", kind: "assumption", label: "Given x." },
    { id: "s2", kind: "goal", label: "So y." },
  ],
  edges: [{ id: "p1", from: "s2", to: "s1", relation: "depends-on" }],
};

describe("project-graph engine (ADR-026)", () => {
  it("namespaces nodes by source and drops dangling edges", () => {
    const g = fromCanvasGraph({
      nodes: [{ id: "b1", kind: "note", label: "x" }],
      edges: [{ id: "e", from: "b1", to: "ghost", relation: "depends-on" }],
    });
    expect(g.nodes[0].id).toBe("canvas:b1");
    expect(g.edges).toHaveLength(0); // dangling edge dropped
  });

  it("merges canvas + proof into one graph without id collisions", () => {
    const g = mergeGraphs(fromCanvasGraph(canvas), fromProofGraph(proof));
    expect(g.nodes).toHaveLength(6);
    expect(g.edges).toHaveLength(3);
    // ids are namespaced, so a canvas "s1" and proof "s1" would never clash
    expect(g.nodes.map((n) => n.id)).toContain("canvas:b1");
    expect(g.nodes.map((n) => n.id)).toContain("proof:s1");
  });

  it("mergeGraphs de-duplicates by id (first wins)", () => {
    const a = fromCanvasGraph(canvas);
    const g = mergeGraphs(a, a);
    expect(g.nodes).toHaveLength(canvas.nodes.length);
    expect(g.edges).toHaveLength(canvas.edges.length);
  });

  it("computes stats by source and kind", () => {
    const g = mergeGraphs(fromCanvasGraph(canvas), fromProofGraph(proof));
    const s = graphStats(g);
    expect(s.nodeCount).toBe(6);
    expect(s.bySource.canvas).toBe(4);
    expect(s.bySource.proof).toBe(2);
    expect(s.byKind.equation).toBe(2);
  });

  it("identifies roots, leaves and orphans", () => {
    const g = fromCanvasGraph(canvas);
    expect(roots(g).map((n) => n.id)).toContain("canvas:b1"); // depends on nothing
    expect(leaves(g).map((n) => n.id)).toContain("canvas:b3"); // nothing depends on it
    expect(orphans(g).map((n) => n.id)).toEqual(["canvas:loose"]);
  });

  it("computes dependency depth and layers foundational→derived", () => {
    const g = fromCanvasGraph(canvas);
    expect(nodeDepth(g, "canvas:b1")).toBe(0); // root
    expect(nodeDepth(g, "canvas:b2")).toBe(1);
    expect(nodeDepth(g, "canvas:b3")).toBe(2);
    const layers = topologicalLayers(g);
    expect(layers[0].map((n) => n.id)).toEqual(expect.arrayContaining(["canvas:b1", "canvas:loose"]));
    expect(longestChainLength(g)).toBe(3);
  });

  it("is cycle-safe in depth and flags cycles in validation", () => {
    const cyclic = fromCanvasGraph({
      nodes: [
        { id: "a", kind: "note", label: "A" },
        { id: "b", kind: "note", label: "B" },
      ],
      edges: [
        { id: "e1", from: "a", to: "b", relation: "depends-on" },
        { id: "e2", from: "b", to: "a", relation: "depends-on" },
      ],
    });
    expect(() => nodeDepth(cyclic, "canvas:a")).not.toThrow();
    expect(validateGraph(cyclic).some((p) => p.startsWith("cycle:"))).toBe(true);
  });

  it("a healthy merged graph validates clean", () => {
    const g = mergeGraphs(fromCanvasGraph(canvas), fromProofGraph(proof));
    expect(validateGraph(g)).toEqual([]);
  });

  it("handles the empty graph", () => {
    const g = emptyGraph();
    expect(graphStats(g).nodeCount).toBe(0);
    expect(longestChainLength(g)).toBe(0);
    expect(topologicalLayers(g)).toEqual([]);
    expect(validateGraph(g)).toEqual([]);
  });
});
