// Boundary between the engine's wire format (snake_case) and the app's typed
// world models (camelCase). Keeping this mapper in one place means components
// never touch raw API shapes, and the app types can evolve independently.
import { engine, type LandWorldSummary, type WorldMissionSummary } from "./engine";
import { KEYBOARD_KINGDOM_WORLD } from "@/data/keyboard";
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

/** Merge the frontend-owned Keyboard Kingdom into the engine catalog. The engine
 *  remains the source of truth: if it already ships this slug, its version wins;
 *  otherwise we augment so the world is playable now (before an engine redeploy).
 *  If the engine is unreachable we still return Keyboard Kingdom so typing isn't
 *  lost behind an offline catalog. */
function withKeyboardKingdom(worlds: LandWorld[]): LandWorld[] {
  if (worlds.some((w) => w.slug === KEYBOARD_KINGDOM_WORLD.slug)) return worlds;
  return [...worlds, KEYBOARD_KINGDOM_WORLD].sort((a, b) => a.order - b.order);
}

/** Fetch the World Map, mapped to app types. Falls back to the built-in worlds
 *  (currently Keyboard Kingdom) if the engine is unreachable, so the map is
 *  never empty. */
export async function getWorlds(): Promise<LandWorld[]> {
  try {
    const worlds = await engine.getWorlds();
    return withKeyboardKingdom(worlds.map(mapWorld));
  } catch {
    return withKeyboardKingdom([]);
  }
}
