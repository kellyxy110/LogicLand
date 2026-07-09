"use client";
// The HTML Studio's in-memory file system (Zustand). Ephemeral session state —
// the child's folders, files, edits, and which file is open — mirroring how the
// game session store works. Persisting a project to the server is a future step;
// the shape here (flat nodes + parentId) is ready for it.
import { create } from "zustand";
import type { FsNode } from "@/types/studio";

let counter = 0;
const nextId = () => `node-${++counter}`;

interface StudioState {
  slug: string | null;
  nodes: FsNode[];
  selectedId: string | null;

  /** Reset the workspace for a mission (called on mount). */
  load: (slug: string) => void;
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

  load: (slug) =>
    set((s) => (s.slug === slug ? s : { slug, nodes: [], selectedId: null })),

  addFolder: (parentId, name) =>
    set((s) => {
      const node = makeNode("folder", name, parentId);
      return { nodes: [...s.nodes, node], selectedId: node.id };
    }),

  addFile: (parentId, name) =>
    set((s) => {
      const node = makeNode("file", name, parentId);
      return { nodes: [...s.nodes, node], selectedId: node.id };
    }),

  select: (id) => set({ selectedId: id }),

  updateContent: (id, content) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, content } : n)),
    })),
}));
