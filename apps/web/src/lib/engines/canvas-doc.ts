// LogicLand Canvas document engine (ADR-021, extended by ADR-025) — pure and
// testable. A canvas is a set of SEMANTIC blocks (the LogicLand-native layer)
// plus an Excalidraw scene (freehand). V2 makes the semantic layer a *graph*:
// blocks can be linked with typed edges, so Proof Workshop, AI tools and the
// Project Graph can reason over structure — not just a flat list. This module
// owns the document model, block + edge CRUD, ordering, bounded version history
// with restore, deterministic block insight, a graph projection and safe
// export — all without touching the DOM or the network (the UI does storage).
import { type AgeMode, atLeast } from "@/lib/age-mode";

export type CanvasBlockKind = "note" | "label" | "flowchart" | "code" | "equation";

export interface CanvasBlock {
  id: string;
  kind: CanvasBlockKind;
  text: string;
  /** Position for future free placement; ordering is used in the list UI. */
  x: number;
  y: number;
}

/** Typed semantic relation between two blocks (ADR-025). Directed from → to. */
export type CanvasRelation = "depends-on" | "explains" | "leads-to";

export interface CanvasEdge {
  id: string;
  from: string; // block id
  to: string; // block id
  relation: CanvasRelation;
}

export interface CanvasLink {
  type: "lesson" | "project" | "proof";
  id: string;
}

export interface CanvasDoc {
  id: string;
  title: string;
  blocks: CanvasBlock[];
  /** Directed, typed links between blocks — the graph layer (ADR-025). */
  edges: CanvasEdge[];
  /** Excalidraw elements (opaque here); null until the learner draws. */
  scene: unknown | null;
  /** Integration seam: what this canvas is attached to (ADR-021). */
  linkedTo: CanvasLink | null;
  updatedAt: number;
}

export interface CanvasSnapshot {
  at: number;
  label: string;
  doc: CanvasDoc;
}

export const MAX_HISTORY = 10;

export const RELATION_META: { relation: CanvasRelation; label: string; arrow: string }[] = [
  { relation: "depends-on", label: "depends on", arrow: "→" },
  { relation: "explains", label: "explains", arrow: "⇒" },
  { relation: "leads-to", label: "leads to", arrow: "↦" },
];

let counter = 0;
export function newBlockId(): string {
  counter += 1;
  return `b-${Date.now().toString(36)}-${counter}`;
}
export function newEdgeId(): string {
  counter += 1;
  return `e-${Date.now().toString(36)}-${counter}`;
}

export function createDoc(title = "Untitled canvas"): CanvasDoc {
  return {
    id: `c-${Date.now().toString(36)}`,
    title,
    blocks: [],
    edges: [],
    scene: null,
    linkedTo: null,
    updatedAt: Date.now(),
  };
}

/**
 * Normalise a loaded (possibly v1) document to the current shape. v1 docs have
 * no `edges`; older exports may omit `scene`/`linkedTo`. Pure — safe to run on
 * any parsed JSON before use (ADR-025 migration).
 */
export function migrateDoc(raw: Partial<CanvasDoc> | null | undefined): CanvasDoc {
  const base = createDoc(raw?.title ?? "My canvas");
  const blocks = Array.isArray(raw?.blocks) ? (raw!.blocks as CanvasBlock[]) : [];
  const ids = new Set(blocks.map((b) => b.id));
  // Only keep edges whose endpoints still exist (defends against corruption).
  const edges = Array.isArray(raw?.edges)
    ? (raw!.edges as CanvasEdge[]).filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to)
    : [];
  return {
    ...base,
    id: raw?.id ?? base.id,
    blocks,
    edges,
    scene: raw?.scene ?? null,
    linkedTo: raw?.linkedTo ?? null,
    updatedAt: raw?.updatedAt ?? Date.now(),
  };
}

const touch = (doc: CanvasDoc): CanvasDoc => ({ ...doc, updatedAt: Date.now() });

// --- Block CRUD ------------------------------------------------------------
export function addBlock(doc: CanvasDoc, kind: CanvasBlockKind, text = ""): CanvasDoc {
  const n = doc.blocks.length;
  const block: CanvasBlock = { id: newBlockId(), kind, text, x: 24 + (n % 4) * 16, y: 24 + n * 12 };
  return touch({ ...doc, blocks: [...doc.blocks, block] });
}

export function updateBlock(doc: CanvasDoc, id: string, patch: Partial<Omit<CanvasBlock, "id">>): CanvasDoc {
  return touch({ ...doc, blocks: doc.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
}

/** Remove a block AND prune every edge that touched it (no dangling edges). */
export function removeBlock(doc: CanvasDoc, id: string): CanvasDoc {
  return touch({
    ...doc,
    blocks: doc.blocks.filter((b) => b.id !== id),
    edges: doc.edges.filter((e) => e.from !== id && e.to !== id),
  });
}

/** Insert a copy of a block directly after it, with a fresh id. Edges are not
 * copied (a duplicate is new work, not a new node in an existing relation). */
export function duplicateBlock(doc: CanvasDoc, id: string): CanvasDoc {
  const i = doc.blocks.findIndex((b) => b.id === id);
  if (i < 0) return doc;
  const src = doc.blocks[i];
  const copy: CanvasBlock = { ...src, id: newBlockId(), x: src.x + 8, y: src.y + 8 };
  const blocks = [...doc.blocks.slice(0, i + 1), copy, ...doc.blocks.slice(i + 1)];
  return touch({ ...doc, blocks });
}

/** Move a block one place up or down in reading order. Pure, bounds-safe. */
export function moveBlock(doc: CanvasDoc, id: string, dir: "up" | "down"): CanvasDoc {
  const i = doc.blocks.findIndex((b) => b.id === id);
  if (i < 0) return doc;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= doc.blocks.length) return doc;
  const blocks = [...doc.blocks];
  [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
  return touch({ ...doc, blocks });
}

export function setScene(doc: CanvasDoc, scene: unknown): CanvasDoc {
  return touch({ ...doc, scene });
}

// --- Edges (the graph layer, ADR-025) --------------------------------------
/** Whether a from→to edge with this relation may be added right now. */
export function canLink(doc: CanvasDoc, from: string, to: string, relation: CanvasRelation): boolean {
  if (from === to) return false; // no self-loops
  const ids = new Set(doc.blocks.map((b) => b.id));
  if (!ids.has(from) || !ids.has(to)) return false; // both endpoints must exist
  return !doc.edges.some((e) => e.from === from && e.to === to && e.relation === relation);
}

/** Add a typed directed edge. Returns the doc unchanged when the link is
 * invalid (missing block, self-loop or exact duplicate) — callers stay simple. */
export function linkBlocks(doc: CanvasDoc, from: string, to: string, relation: CanvasRelation): CanvasDoc {
  if (!canLink(doc, from, to, relation)) return doc;
  const edge: CanvasEdge = { id: newEdgeId(), from, to, relation };
  return touch({ ...doc, edges: [...doc.edges, edge] });
}

export function unlinkBlocks(doc: CanvasDoc, edgeId: string): CanvasDoc {
  return touch({ ...doc, edges: doc.edges.filter((e) => e.id !== edgeId) });
}

// --- Graph projection (Project Graph ingest contract, ADR-025) -------------
export interface CanvasGraphNode {
  id: string;
  kind: CanvasBlockKind;
  /** First non-empty line, trimmed — a stable human label for the node. */
  label: string;
}
export interface CanvasGraph {
  nodes: CanvasGraphNode[];
  edges: CanvasEdge[];
}

/** A block's short label: its first non-empty line, else its kind. */
export function blockLabel(block: CanvasBlock): string {
  const line = block.text.split("\n").map((l) => l.trim()).find(Boolean);
  const label = (line ?? "").slice(0, 60);
  return label || block.kind;
}

/** Project the semantic layer to a {nodes, edges} graph. This is the stable
 * contract the Project Graph consumes; it never includes the freehand scene. */
export function toGraph(doc: CanvasDoc): CanvasGraph {
  return {
    nodes: doc.blocks.map((b) => ({ id: b.id, kind: b.kind, label: blockLabel(b) })),
    edges: doc.edges.map((e) => ({ ...e })),
  };
}

// --- Deterministic block insight (offline, never an LLM) -------------------
/** A short, deterministic observation about a block — a cheap local analysis
 * the UI can show before (or instead of) asking the engine. Never guesses an
 * answer; only reports structure. */
export function blockInsight(block: CanvasBlock): string {
  const text = block.text.trim();
  if (!text) return "Empty — add some content.";
  switch (block.kind) {
    case "equation": {
      const opens = (text.match(/[([{]/g) ?? []).length;
      const closes = (text.match(/[)\]}]/g) ?? []).length;
      const brackets = opens === closes ? "brackets balanced" : "brackets look unbalanced";
      const sides = text.split("=").length - 1;
      if (sides === 0) return `An expression (no “=”); ${brackets}.`;
      if (sides === 1) return `An equation with two sides; ${brackets}.`;
      return `A chain of ${sides + 1} equal parts; ${brackets}.`;
    }
    case "code": {
      const lines = text.split("\n").filter((l) => l.trim()).length;
      const comments = text.split("\n").filter((l) => /^\s*(\/\/|#)/.test(l)).length;
      return `${lines} line${lines === 1 ? "" : "s"} of code, ${comments} comment${comments === 1 ? "" : "s"}.`;
    }
    case "flowchart":
      return "A step in a sequence — connect it with “leads to”.";
    default: {
      const words = text.split(/\s+/).filter(Boolean).length;
      return `${words} word${words === 1 ? "" : "s"}.`;
    }
  }
}

// --- Version history -------------------------------------------------------
const copyDoc = (doc: CanvasDoc): CanvasDoc => ({
  ...doc,
  blocks: doc.blocks.map((b) => ({ ...b })),
  edges: doc.edges.map((e) => ({ ...e })),
});

/** Push a snapshot, newest first, bounded to MAX_HISTORY. Pure. */
export function pushSnapshot(history: CanvasSnapshot[], doc: CanvasDoc, label?: string): CanvasSnapshot[] {
  const snap: CanvasSnapshot = {
    at: Date.now(),
    label: label || new Date().toLocaleTimeString(),
    doc: copyDoc(doc),
  };
  return [snap, ...history].slice(0, MAX_HISTORY);
}

export function restoreSnapshot(snapshot: CanvasSnapshot): CanvasDoc {
  return touch(copyDoc(snapshot.doc));
}

// --- Safe export -----------------------------------------------------------
/** A self-contained JSON export (no external refs). Includes the graph edges. */
export function exportJson(doc: CanvasDoc): string {
  return JSON.stringify({ title: doc.title, blocks: doc.blocks, edges: doc.edges, scene: doc.scene }, null, 2);
}

/** A readable plain-text export of the semantic blocks. */
export function exportText(doc: CanvasDoc): string {
  const lines = [doc.title, "=".repeat(doc.title.length), ""];
  for (const b of doc.blocks) {
    lines.push(`[${b.kind}] ${b.text}`.trimEnd());
  }
  return lines.join("\n");
}

/** A Markdown export: headings per block, fenced code for code/equation, and a
 * Connections list for the graph edges. Self-contained; no external calls. */
export function exportMarkdown(doc: CanvasDoc): string {
  const out: string[] = [`# ${doc.title || "Canvas"}`, ""];
  const labelOf = (id: string) => {
    const b = doc.blocks.find((x) => x.id === id);
    return b ? blockLabel(b) : id;
  };
  doc.blocks.forEach((b, i) => {
    const meta = blockMeta(b.kind);
    out.push(`## ${i + 1}. ${meta?.label ?? b.kind}`);
    if (b.kind === "code") {
      out.push("```", b.text, "```");
    } else if (b.kind === "equation") {
      out.push("`" + b.text.replace(/`/g, "'") + "`");
    } else {
      out.push(b.text.trim() || "_(empty)_");
    }
    out.push("");
  });
  if (doc.edges.length) {
    out.push("## Connections", "");
    for (const e of doc.edges) {
      const rel = RELATION_META.find((r) => r.relation === e.relation);
      out.push(`- ${labelOf(e.from)} **${rel?.label ?? e.relation}** ${labelOf(e.to)}`);
    }
    out.push("");
  }
  return out.join("\n");
}

// --- Age-adaptive toolbar (ADR-012) ---------------------------------------
interface BlockMeta {
  kind: CanvasBlockKind;
  label: string;
  minMode: AgeMode;
  placeholder: string;
}

export const BLOCK_META: BlockMeta[] = [
  { kind: "note", label: "Note", minMode: "sprout", placeholder: "Write a note…" },
  { kind: "label", label: "Label", minMode: "sprout", placeholder: "A short label" },
  { kind: "flowchart", label: "Flow step", minMode: "explorer", placeholder: "Then… (a step)" },
  { kind: "code", label: "Code", minMode: "builder", placeholder: "// code snippet" },
  { kind: "equation", label: "Equation", minMode: "builder", placeholder: "e.g. a^2 + b^2 = c^2" },
];

/** The block kinds available in a given age-mode (progressive disclosure). */
export function availableBlockKinds(mode: AgeMode): BlockMeta[] {
  return BLOCK_META.filter((m) => atLeast(mode, m.minMode));
}

export function blockMeta(kind: CanvasBlockKind): BlockMeta | undefined {
  return BLOCK_META.find((m) => m.kind === kind);
}

/** Linking (the graph layer) is a Builder+ capability, like code/equation. */
export function canUseGraph(mode: AgeMode): boolean {
  return atLeast(mode, "builder");
}
