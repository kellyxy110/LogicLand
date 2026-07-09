"use client";
// Ephemeral in-game session state (Zustand). This holds ONLY what lives for the
// duration of a single play attempt — the program being built, the run result,
// and the playback cursor. Persistent progress (XP, completed missions, badges)
// never touches this store; that stays server-authoritative via server actions.
import { create } from "zustand";
import type { CommandId, RunResult } from "@/types/game";

export type GamePhase = "building" | "playing" | "won" | "failed";

interface GameSession {
  /** Mission this session belongs to; guards against stale state on remount. */
  slug: string | null;
  /** The command program the explorer is assembling. */
  program: CommandId[];
  phase: GamePhase;
  result: RunResult | null;
  /** Index into result.frames currently shown during playback. */
  frame: number;

  /** Reset the session for a mission (called on game mount). */
  load: (slug: string) => void;
  /** Palette actions (building phase). */
  push: (cmd: CommandId) => void;
  pop: () => void;
  clearProgram: () => void;
  setProgram: (cmds: CommandId[]) => void;
  /** Begin animating a computed run. */
  play: (result: RunResult) => void;
  /** Advance playback one frame; finalizes to won/failed on the last frame. */
  tick: () => void;
  /** Return to building to fix the program (keeps what was typed/tapped). */
  edit: () => void;
  /** Full reset for a fresh replay of the same mission. */
  restart: () => void;
}

const fresh = {
  program: [] as CommandId[],
  phase: "building" as GamePhase,
  result: null as RunResult | null,
  frame: 0,
};

export const useGameSession = create<GameSession>((set) => ({
  slug: null,
  ...fresh,

  load: (slug) =>
    set((s) => (s.slug === slug ? s : { slug, ...fresh })),

  push: (cmd) =>
    set((s) =>
      s.phase === "building" ? { program: [...s.program, cmd] } : s,
    ),

  pop: () =>
    set((s) =>
      s.phase === "building" ? { program: s.program.slice(0, -1) } : s,
    ),

  clearProgram: () => set((s) => (s.phase === "building" ? { program: [] } : s)),

  setProgram: (cmds) =>
    set((s) => (s.phase === "building" ? { program: cmds } : s)),

  play: (result) => set({ result, phase: "playing", frame: 0 }),

  tick: () =>
    set((s) => {
      if (!s.result || s.phase !== "playing") return s;
      const last = s.result.frames.length - 1;
      const next = s.frame + 1;
      if (next >= last) {
        return { frame: last, phase: s.result.success ? "won" : "failed" };
      }
      return { frame: next };
    }),

  edit: () => set({ phase: "building", result: null, frame: 0 }),

  restart: () => set({ ...fresh }),
}));
