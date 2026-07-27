import { describe, expect, it } from "vitest";
import { journeySummary, nextStep, worldProgress } from "./journey";
import type { LandMission, LandWorld } from "@/types/world";

const mission = (slug: string, order: number, status: "live" | "soon"): LandMission =>
  ({
    slug,
    title: slug,
    skill: "skill",
    badge: "b",
    game: "key-quest",
    order,
    story: "",
    objective: "",
    status,
    estimatedMinutes: 5,
  }) as LandMission;

const world = (
  slug: string,
  order: number,
  locked: boolean,
  missions: LandMission[],
): LandWorld =>
  ({ slug, title: slug, subtitle: "", theme: "forest", order, locked, skills: [], missions }) as LandWorld;

const worlds: LandWorld[] = [
  world("w1", 1, false, [mission("m1", 1, "live"), mission("m2", 2, "live")]),
  world("w2", 2, false, [mission("m3", 1, "live"), mission("m4", 2, "soon")]),
  world("w3", 3, true, [mission("m5", 1, "live")]),
];

describe("journey engine", () => {
  it("nextStep returns the earliest unlocked, live, undone mission", () => {
    const step = nextStep(worlds, new Set(["m1"]));
    expect(step?.mission.slug).toBe("m2");
  });

  it("nextStep never routes into locked worlds and skips 'soon' missions", () => {
    // m1,m2 (w1) and m3 (w2 live) done; m4 is soon, m5 is in a locked world.
    const step = nextStep(worlds, new Set(["m1", "m2", "m3"]));
    expect(step).toBeNull();
  });

  it("worldProgress counts only live missions", () => {
    const wp = worldProgress(worlds, new Set(["m1"]));
    expect(wp.find((w) => w.slug === "w1")).toMatchObject({ completed: 1, total: 2 });
    expect(wp.find((w) => w.slug === "w2")).toMatchObject({ completed: 0, total: 1 });
  });

  it("summary reports unlocked worlds and live-mission percent", () => {
    const s = journeySummary(worlds, new Set(["m1", "m2"]));
    expect(s.worldsUnlocked).toBe(2);
    expect(s.worldsTotal).toBe(3);
    expect(s.missionsLive).toBe(4); // m1,m2,m3,m5 (m4 is soon)
    expect(s.missionsDone).toBe(2);
    expect(s.percent).toBe(50);
    expect(s.allComplete).toBe(false);
  });

  it("degrades safely on empty data", () => {
    expect(nextStep([], new Set())).toBeNull();
    expect(journeySummary([], new Set())).toMatchObject({ percent: 0, allComplete: false });
    expect(worldProgress([], new Set())).toEqual([]);
  });
});
