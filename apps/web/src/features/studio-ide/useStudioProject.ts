"use client";
// State for the real Studio (ADR-013) — a genuine multi-file project with open
// editor tabs, kept in a Zustand store and cached to localStorage so a learner's
// project survives a refresh. Distinct from features/studio (the guided,
// young-learner HTML lesson); this is the "what can I build?" environment.
import { create } from "zustand";
import type { FsNode } from "@/types/studio";
import { defaultStudioProject } from "@/lib/engines/studio-project";

const STORAGE_KEY = "logicland:studio-ide:v1";

let counter = 0;
const nextId = () => `f-${Date.now().toString(36)}-${++counter}`;

interface Persisted {
  files: FsNode[];
  openTabs: string[];
  activeId: string | null;
  /** The template this workspace was started from (drives the active brief). */
  templateId: string | null;
}

function seedFiles(): FsNode[] {
  return defaultStudioProject().map((f) => ({ id: nextId(), parentId: null, ...f }));
}

function load(): Persisted {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        if (Array.isArray(p.files) && p.files.length > 0) {
          return { ...p, templateId: p.templateId ?? null };
        }
      }
    } catch {
      /* fall through to a fresh project */
    }
  }
  const files = seedFiles();
  const first = files[0]?.id ?? null;
  return { files, openTabs: first ? [first] : [], activeId: first, templateId: null };
}

function persist(p: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* best-effort */
  }
}

interface StudioProjectState extends Persisted {
  hydrated: boolean;
  /** Load from storage (or seed the starter). Call once on mount. */
  hydrate: () => void;
  /** Replace the workspace with files loaded from the server (cross-device). */
  hydrateFromServer: (files: Array<{ name: string; content: string }>) => void;
  open: (id: string) => void;
  closeTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  addFile: (name: string) => string | null;
  deleteFile: (id: string) => void;
  reset: () => void;
  /** Replace the workspace with a project template's starter files. */
  loadTemplate: (files: Array<{ name: string; content: string }>, templateId: string) => void;
}

function save(state: Persisted) {
  persist({
    files: state.files,
    openTabs: state.openTabs,
    activeId: state.activeId,
    templateId: state.templateId,
  });
}

export const useStudioProject = create<StudioProjectState>((set, get) => ({
  files: [],
  openTabs: [],
  activeId: null,
  templateId: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ ...load(), hydrated: true });
  },

  hydrateFromServer: (incoming) =>
    set(() => {
      const files: FsNode[] = incoming.map((f) => ({
        id: nextId(),
        parentId: null,
        name: f.name,
        kind: "file",
        content: f.content,
      }));
      const first = files[0]?.id ?? null;
      const next = {
        files,
        openTabs: first ? [first] : [],
        activeId: first,
        templateId: null,
        hydrated: true,
      };
      save(next);
      return next;
    }),

  open: (id) =>
    set((s) => {
      if (!s.files.some((f) => f.id === id)) return s;
      const openTabs = s.openTabs.includes(id) ? s.openTabs : [...s.openTabs, id];
      const next = { ...s, openTabs, activeId: id };
      save(next);
      return next;
    }),

  closeTab: (id) =>
    set((s) => {
      const idx = s.openTabs.indexOf(id);
      const openTabs = s.openTabs.filter((t) => t !== id);
      let activeId = s.activeId;
      if (activeId === id) {
        activeId = openTabs[Math.min(idx, openTabs.length - 1)] ?? null;
      }
      const next = { ...s, openTabs, activeId };
      save(next);
      return next;
    }),

  updateContent: (id, content) =>
    set((s) => {
      const files = s.files.map((f) => (f.id === id ? { ...f, content } : f));
      const next = { ...s, files };
      save(next);
      return next;
    }),

  addFile: (rawName) => {
    const name = rawName.trim();
    if (!name) return null;
    const state = get();
    if (state.files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      return null; // no duplicate names at the root
    }
    const node: FsNode = { id: nextId(), name, kind: "file", parentId: null, content: "" };
    const next = {
      ...state,
      files: [...state.files, node],
      openTabs: [...state.openTabs, node.id],
      activeId: node.id,
    };
    set(next);
    save(next);
    return node.id;
  },

  deleteFile: (id) =>
    set((s) => {
      const files = s.files.filter((f) => f.id !== id);
      const openTabs = s.openTabs.filter((t) => t !== id);
      const activeId =
        s.activeId === id ? (openTabs[openTabs.length - 1] ?? null) : s.activeId;
      const next = { ...s, files, openTabs, activeId };
      save(next);
      return next;
    }),

  reset: () =>
    set(() => {
      const files = seedFiles();
      const first = files[0]?.id ?? null;
      const next = {
        files,
        openTabs: first ? [first] : [],
        activeId: first,
        templateId: null,
        hydrated: true,
      };
      save(next);
      return next;
    }),

  loadTemplate: (incoming, templateId) =>
    set(() => {
      const files: FsNode[] = incoming.map((f) => ({
        id: nextId(),
        parentId: null,
        name: f.name,
        kind: "file",
        content: f.content,
      }));
      const first = files[0]?.id ?? null;
      const next = {
        files,
        openTabs: first ? [first] : [],
        activeId: first,
        templateId,
        hydrated: true,
      };
      save(next);
      return next;
    }),
}));
