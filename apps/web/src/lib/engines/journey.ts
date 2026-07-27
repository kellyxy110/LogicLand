// Learning-journey engine (Phase 1 #6) — pure and testable. Given the world
// catalog (server-owned, incl. lock state) and the learner's completed missions,
// it computes the next step to resume, per-world progress, and an overall
// summary. Prerequisite enforcement is respected here by only ever recommending
// LIVE missions inside UNLOCKED worlds (the engine owns lock state; we never
// route a learner into locked content). Degrades safely on empty/missing data.
import type { LandMission, LandWorld } from "@/types/world";

export interface NextStep {
  world: LandWorld;
  mission: LandMission;
}

/** The next live, not-yet-completed mission in the earliest unlocked world. */
export function nextStep(worlds: LandWorld[], done: ReadonlySet<string>): NextStep | null {
  const open = [...worlds].filter((w) => !w.locked).sort((a, b) => a.order - b.order);
  for (const world of open) {
    const mission = [...world.missions]
      .sort((a, b) => a.order - b.order)
      .find((m) => m.status === "live" && !done.has(m.slug));
    if (mission) return { world, mission };
  }
  return null;
}

export interface WorldProgress {
  slug: string;
  title: string;
  order: number;
  locked: boolean;
  /** Completed live missions in this world. */
  completed: number;
  /** Total live (playable) missions in this world. */
  total: number;
}

export function worldProgress(worlds: LandWorld[], done: ReadonlySet<string>): WorldProgress[] {
  return [...worlds]
    .sort((a, b) => a.order - b.order)
    .map((w) => {
      const live = w.missions.filter((m) => m.status === "live");
      return {
        slug: w.slug,
        title: w.title,
        order: w.order,
        locked: w.locked,
        completed: live.filter((m) => done.has(m.slug)).length,
        total: live.length,
      };
    });
}

export interface JourneySummary {
  worldsUnlocked: number;
  worldsTotal: number;
  missionsDone: number;
  missionsLive: number;
  /** Percent of live missions completed (0 when none exist). */
  percent: number;
  /** True once every live mission across unlocked worlds is done. */
  allComplete: boolean;
}

export function journeySummary(worlds: LandWorld[], done: ReadonlySet<string>): JourneySummary {
  const live = worlds.flatMap((w) => w.missions.filter((m) => m.status === "live"));
  const missionsDone = live.filter((m) => done.has(m.slug)).length;
  const missionsLive = live.length;
  return {
    worldsUnlocked: worlds.filter((w) => !w.locked).length,
    worldsTotal: worlds.length,
    missionsDone,
    missionsLive,
    percent: missionsLive === 0 ? 0 : Math.round((missionsDone / missionsLive) * 100),
    allComplete: missionsLive > 0 && missionsDone === missionsLive,
  };
}
