// Server-side mission metadata lookup. Student progress is stored as mission
// *slugs*; dashboards need human titles. The curriculum lives in the engine
// (single source of truth), so we read the journey once and index it by slug.
// Degrades gracefully: if the engine is unreachable, callers fall back to a
// prettified slug — dashboards still render.
import { engine } from "./engine";

export interface MissionMeta {
  title: string;
  skill: string;
  world: string;
}

export type MissionIndex = Record<string, MissionMeta>;

/** Turn "the-lost-robot" into "The Lost Robot" for a readable fallback. */
export function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Fetch + index the curriculum by mission slug. Returns {} if the engine is
 *  unreachable so the page never crashes on a cold/offline engine. */
export async function getMissionIndex(): Promise<MissionIndex> {
  try {
    const journey = await engine.getJourney();
    const index: MissionIndex = {};
    for (const world of journey.worlds) {
      for (const m of world.missions) {
        index[m.slug] = { title: m.title, skill: m.skill, world: world.title };
      }
    }
    return index;
  } catch {
    return {};
  }
}

/** Resolve a slug to its title, falling back to a prettified slug. */
export function titleFor(index: MissionIndex, slug: string): string {
  return index[slug]?.title ?? prettifySlug(slug);
}
