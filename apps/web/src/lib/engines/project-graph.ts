// Project Graph engine (ADR-026) — pure, deterministic, testable. The Canvas and
// the Proof Workshop each project their work to a `{nodes, edges}` graph (ADR-025);
// this engine AGGREGATES those graphs into one cross-artifact map of a learner's
// thinking, namespaced so ids never collide, with structure analytics (roots,
// leaves, orphans, depth tiers, cycle/dangling checks) for layout and feedback.
// No LLM, no DOM, no network — the UI renders what this returns.

export type NodeSource = "canvas" | "proof" | "skill";
export type PGRelation = "depends-on" | "explains" | "leads-to";

export interface PGNode {
  /** Namespaced id: `${source}:${originalId}` — unique across artifacts. */
  id: string;
  label: string;
  /** The originating block/step kind (equation, note, assumption, goal, …). */
  kind: string;
  source: NodeSource;
}

export interface PGEdge {
  id: string;
  from: string; // namespaced node id
  to: string; // namespaced node id
  relation: PGRelation;
  source: NodeSource;
}

export interface ProjectGraph {
  nodes: PGNode[];
  edges: PGEdge[];
}

// Minimal input shapes — structurally match canvas-doc's `toGraph()` and proof's
// `proofToGraph()` outputs. Declared locally so engines stay decoupled.
export interface InGraphNode {
  id: string;
  kind: string;
  label: string;
}
export interface InGraphEdge {
  id: string;
  from: string;
  to: string;
  relation: PGRelation;
}
export interface InGraph {
  nodes: InGraphNode[];
  edges: InGraphEdge[];
}

export function emptyGraph(): ProjectGraph {
  return { nodes: [], edges: [] };
}

const nsId = (source: NodeSource, id: string): string => `${source}:${id}`;

/** Ingest one artifact graph under a source namespace. Dangling edges (an
 * endpoint with no node) are dropped so downstream analytics stay sound. */
export function fromGraph(source: NodeSource, graph: InGraph): ProjectGraph {
  const nodes: PGNode[] = graph.nodes.map((n) => ({
    id: nsId(source, n.id),
    label: n.label,
    kind: n.kind,
    source,
  }));
  const present = new Set(nodes.map((n) => n.id));
  const edges: PGEdge[] = [];
  for (const e of graph.edges) {
    const from = nsId(source, e.from);
    const to = nsId(source, e.to);
    if (present.has(from) && present.has(to)) {
      edges.push({ id: nsId(source, e.id), from, to, relation: e.relation, source });
    }
  }
  return { nodes, edges };
}

export const fromCanvasGraph = (graph: InGraph): ProjectGraph => fromGraph("canvas", graph);
export const fromProofGraph = (graph: InGraph): ProjectGraph => fromGraph("proof", graph);

/** Merge artifact graphs into one, de-duplicating by node/edge id (first wins). */
export function mergeGraphs(...graphs: ProjectGraph[]): ProjectGraph {
  const nodes: PGNode[] = [];
  const edges: PGEdge[] = [];
  const seenN = new Set<string>();
  const seenE = new Set<string>();
  for (const g of graphs) {
    for (const n of g.nodes) if (!seenN.has(n.id)) (seenN.add(n.id), nodes.push(n));
    for (const e of g.edges) if (!seenE.has(e.id)) (seenE.add(e.id), edges.push(e));
  }
  return { nodes, edges };
}

// --- Structure analytics ---------------------------------------------------
export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  bySource: Record<string, number>;
  byKind: Record<string, number>;
}

export function graphStats(g: ProjectGraph): GraphStats {
  const bySource: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  for (const n of g.nodes) {
    bySource[n.source] = (bySource[n.source] ?? 0) + 1;
    byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
  }
  return { nodeCount: g.nodes.length, edgeCount: g.edges.length, bySource, byKind };
}

/** Foundational nodes — depend on nothing (no outgoing edge). */
export function roots(g: ProjectGraph): PGNode[] {
  const hasOut = new Set(g.edges.map((e) => e.from));
  return g.nodes.filter((n) => !hasOut.has(n.id));
}

/** Terminal nodes — nothing depends on them (no incoming edge). */
export function leaves(g: ProjectGraph): PGNode[] {
  const hasIn = new Set(g.edges.map((e) => e.to));
  return g.nodes.filter((n) => !hasIn.has(n.id));
}

/** Nodes with no connections at all — stray work not linked into anything. */
export function orphans(g: ProjectGraph): PGNode[] {
  const touched = new Set<string>();
  for (const e of g.edges) (touched.add(e.from), touched.add(e.to));
  return g.nodes.filter((n) => !touched.has(n.id));
}

/**
 * Depth of a node = its longest dependency chain to a root (roots are depth 0).
 * Follows outgoing (depends-on) edges. Cycle-safe via the visit path.
 */
export function nodeDepth(g: ProjectGraph, id: string, path: ReadonlySet<string> = new Set()): number {
  if (path.has(id)) return 0; // cycle guard
  const outs = g.edges.filter((e) => e.from === id);
  if (outs.length === 0) return 0;
  const next = new Set(path).add(id);
  return 1 + Math.max(...outs.map((e) => nodeDepth(g, e.to, next)));
}

/** Nodes grouped into dependency tiers (tier 0 = foundational). For layout. */
export function topologicalLayers(g: ProjectGraph): PGNode[][] {
  const layers: PGNode[][] = [];
  for (const n of g.nodes) {
    const d = nodeDepth(g, n.id);
    (layers[d] ??= []).push(n);
  }
  return layers.filter(Boolean);
}

/** Nodes on the deepest dependency chain (the longest line of reasoning). */
export function longestChainLength(g: ProjectGraph): number {
  if (g.nodes.length === 0) return 0;
  return 1 + Math.max(...g.nodes.map((n) => nodeDepth(g, n.id)));
}

/**
 * Health checks over the merged graph (run in the UI to warn, and in tests):
 * duplicate node ids, edges to unknown nodes, self-loops, and cycles. Returns
 * human-readable problems ([] when healthy).
 */
export function validateGraph(g: ProjectGraph): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const n of g.nodes) {
    if (ids.has(n.id)) problems.push(`duplicate node id: ${n.id}`);
    ids.add(n.id);
  }
  for (const e of g.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) problems.push(`edge ${e.id} points at an unknown node`);
    if (e.from === e.to) problems.push(`edge ${e.id} is a self-loop`);
  }
  // Cycle detection via DFS colouring over outgoing edges.
  const WHITE = 0,
    GREY = 1,
    BLACK = 2;
  const colour = new Map<string, number>(g.nodes.map((n) => [n.id, WHITE]));
  const outsOf = new Map<string, string[]>();
  for (const e of g.edges) outsOf.set(e.from, [...(outsOf.get(e.from) ?? []), e.to]);
  const visit = (id: string, stack: string[]): void => {
    colour.set(id, GREY);
    for (const to of outsOf.get(id) ?? []) {
      if (!colour.has(to)) continue;
      const c = colour.get(to);
      if (c === GREY) problems.push(`cycle: ${[...stack, id, to].join(" → ")}`);
      else if (c === WHITE) visit(to, [...stack, id]);
    }
    colour.set(id, BLACK);
  };
  for (const n of g.nodes) if (colour.get(n.id) === WHITE) visit(n.id, []);

  return problems;
}
