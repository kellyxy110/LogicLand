"use client";
// The HTML Studio's file system (Zustand). The child's folders, files, edits, and
// open file. Two behaviours keep the course from ever "starting over":
//   • Per-mission drafts are cached to localStorage, so a refresh (or coming back
//     later) resumes exactly where the learner left off. Mission *completion*
//     stays server-authoritative (Prisma) — this only caches in-progress work.
//   • Modules ship a `starter` template that's seeded on first open, so later
//     modules build on earlier work instead of a blank page.
import { create } from "zustand";
import type { FsNode, HtmlStudioData } from "@/types/studio";

// Time-based so ids never collide with hydrated ones after a page reload (the
// counter resets on reload; the timestamp does not).
let counter = 0;
const nextId = () => `node-${Date.now().toString(36)}-${++counter}`;

const draftKey = (slug: string) => `logicland:studio:${slug}`;

function loadDraft(slug: string): FsNode[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(slug));
    const parsed = raw ? (JSON.parse(raw) as FsNode[]) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraft(slug: string | null, nodes: FsNode[]) {
  if (typeof window === "undefined" || !slug) return;
  try {
    window.localStorage.setItem(draftKey(slug), JSON.stringify(nodes));
  } catch {
    /* storage full or unavailable — drafts are best-effort */
  }
}

/** Seed a module's starter files (root-level), or [] when it has none. */
function seed(data: HtmlStudioData): FsNode[] {
  return (data.starter ?? []).map((f) => ({
    id: nextId(),
    name: f.name,
    kind: "file" as const,
    parentId: null,
    content: f.content,
  }));
}

interface StudioState {
  slug: string | null;
  nodes: FsNode[];
  selectedId: string | null;

  /** Prepare the workspace for a mission: resume its saved draft if present,
   *  otherwise seed its starter template. Opens the preview file ready to edit. */
  load: (slug: string, data: HtmlStudioData) => void;
  /** Create a folder under a parent (null = root); auto-selects it so the next
   *  file lands inside — the natural "make a folder, then a file in it" flow. */
  addFolder: (parentId: string | null, name: string) => void;
  /** Create a file under a parent and open it in the editor. */
  addFile: (parentId: string | null, name: string) => void;
  select: (id: string) => void;
  updateContent: (id: string, content: string) => void;
}

function makeNode(
  kind: FsNode["kind"],
  name: string,
  parentId: string | null,
): FsNode {
  return { id: nextId(), name, kind, parentId, content: "" };
}

export const useStudio = create<StudioState>((set) => ({
  slug: null,
  nodes: [],
  selectedId: null,

  load: (slug, data) =>
    set((s) => {
      if (s.slug === slug) return s; // already loaded — don't wipe live edits
      const nodes = loadDraft(slug) ?? seed(data);
      const preview = nodes.find(
        (n) =>
          n.kind === "file" &&
          n.name.toLowerCase() === data.previewFile.toLowerCase(),
      );
      return { slug, nodes, selectedId: preview?.id ?? null };
    }),

  addFolder: (parentId, name) =>
    set((s) => {
      const node = makeNode("folder", name, parentId);
      const nodes = [...s.nodes, node];
      saveDraft(s.slug, nodes);
      return { nodes, selectedId: node.id };
    }),

  addFile: (parentId, name) =>
    set((s) => {
      const node = makeNode("file", name, parentId);
      const nodes = [...s.nodes, node];
      saveDraft(s.slug, nodes);
      return { nodes, selectedId: node.id };
    }),

  select: (id) => set({ selectedId: id }),

  updateContent: (id, content) =>
    set((s) => {
      const nodes = s.nodes.map((n) => (n.id === id ? { ...n, content } : n));
      saveDraft(s.slug, nodes);
      return { nodes };
    }),
}));
