// Boundary between the engine's wire format (snake_case) and the app's typed
// world models (camelCase). Keeping this mapper in one place means components
// never touch raw API shapes, and the app types can evolve independently.
import { engine, type LandWorldSummary, type WorldMissionSummary } from "./engine";
import type {
  GameKind,
  LandMission,
  LandWorld,
  MissionStatus,
  WorldTheme,
} from "@/types/world";

function mapMission(m: WorldMissionSummary): LandMission {
  return {
    slug: m.slug,
    title: m.title,
    skill: m.skill,
    badge: m.badge,
    game: m.game as GameKind,
    order: m.order,
    story: m.story,
    objective: m.objective,
    status: m.status as MissionStatus,
    estimatedMinutes: m.estimated_minutes,
  };
}

export function mapWorld(w: LandWorldSummary): LandWorld {
  return {
    slug: w.slug,
    title: w.title,
    subtitle: w.subtitle,
    theme: w.theme as WorldTheme,
    order: w.order,
    locked: w.locked,
    skills: w.skills,
    missions: w.missions.map(mapMission),
  };
}

/** Fetch the World Map, mapped to app types. Returns [] if the engine is
 *  unreachable so callers can render a friendly retry state. */
export async function getWorlds(): Promise<LandWorld[]> {
  try {
    const worlds = await engine.getWorlds();
    return worlds.map(mapWorld);
  } catch {
    return [];
  }
}
