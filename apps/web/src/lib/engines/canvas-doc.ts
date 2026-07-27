// LogicLand Canvas document engine (ADR-021) — pure and testable. A canvas is a
// set of SEMANTIC blocks (the LogicLand-native layer) plus an Excalidraw scene
// (freehand). This module owns the document model, block CRUD, bounded version
// history with restore, safe export, and which block kinds a given age-mode may
// use — all without touching the DOM or the network (the UI does storage).
import { type AgeMode, atLeast } from "@/lib/age-mode";

export type CanvasBlockKind = "note" | "label" | "flowchart" | "code" | "equation";

export interface CanvasBlock {
  id: string;
  kind: CanvasBlockKind;
  text: string;
  /** Position for future free placement; ordering is used in the v1 list UI. */
  x: number;
  y: number;
}

export interface CanvasLink {
  type: "lesson" | "project" | "proof";
  id: string;
}

export interface CanvasDoc {
  id: string;
  title: string;
  blocks: CanvasBlock[];
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

let counter = 0;
export function newBlockId(): string {
  counter += 1;
  return `b-${Date.now().toString(36)}-${counter}`;
}

export function createDoc(title = "Untitled canvas"): CanvasDoc {
  return { id: `c-${Date.now().toString(36)}`, title, blocks: [], scene: null, linkedTo: null, updatedAt: Date.now() };
}

const touch = (doc: CanvasDoc): CanvasDoc => ({ ...doc, updatedAt: Date.now() });

export function addBlock(doc: CanvasDoc, kind: CanvasBlockKind, text = ""): CanvasDoc {
  const n = doc.blocks.length;
  const block: CanvasBlock = { id: newBlockId(), kind, text, x: 24 + (n % 4) * 16, y: 24 + n * 12 };
  return touch({ ...doc, blocks: [...doc.blocks, block] });
}

export function updateBlock(doc: CanvasDoc, id: string, patch: Partial<Omit<CanvasBlock, "id">>): CanvasDoc {
  return touch({ ...doc, blocks: doc.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
}

export function removeBlock(doc: CanvasDoc, id: string): CanvasDoc {
  return touch({ ...doc, blocks: doc.blocks.filter((b) => b.id !== id) });
}

export function setScene(doc: CanvasDoc, scene: unknown): CanvasDoc {
  return touch({ ...doc, scene });
}

// --- Version history -------------------------------------------------------
/** Push a snapshot, newest first, bounded to MAX_HISTORY. Pure. */
export function pushSnapshot(history: CanvasSnapshot[], doc: CanvasDoc, label?: string): CanvasSnapshot[] {
  const snap: CanvasSnapshot = {
    at: Date.now(),
    label: label || new Date().toLocaleTimeString(),
    // deep-ish copy so later edits don't mutate the snapshot
    doc: { ...doc, blocks: doc.blocks.map((b) => ({ ...b })) },
  };
  return [snap, ...history].slice(0, MAX_HISTORY);
}

export function restoreSnapshot(snapshot: CanvasSnapshot): CanvasDoc {
  return touch({ ...snapshot.doc, blocks: snapshot.doc.blocks.map((b) => ({ ...b })) });
}

// --- Safe export -----------------------------------------------------------
/** A self-contained JSON export (no external refs). */
export function exportJson(doc: CanvasDoc): string {
  return JSON.stringify({ title: doc.title, blocks: doc.blocks, scene: doc.scene }, null, 2);
}

/** A readable plain-text export of the semantic blocks. */
export function exportText(doc: CanvasDoc): string {
  const lines = [doc.title, "=".repeat(doc.title.length), ""];
  for (const b of doc.blocks) {
    lines.push(`[${b.kind}] ${b.text}`.trimEnd());
  }
  return lines.join("\n");
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
