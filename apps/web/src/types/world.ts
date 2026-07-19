// World Map contracts. Mirrors the engine's six-realm catalog
// (logicland-engine/curriculum/worlds.py) — the server is the source of truth;
// these types describe what the frontend reads.

/** The interactive engine a mission is played through. Extend as the platform
 *  grows (blockly, scratch, python, robotics…) — the MissionRunner switches on
 *  this value, so new games never touch existing missions. */
export type GameKind =
  | "robot-maze"
  | "typing-quest"
  | "shape-match"
  | "memory"
  | "pattern-builder"
  | "key-quest"
  | "balloon-pop"
  | "falling-words"
  | "code-racer"
  | "html-studio";

/** "live" is playable now; "soon" appears on the map to preserve the roadmap
 *  but is not yet playable (honest — never a fake button). */
export type MissionStatus = "live" | "soon";

export interface LandMission {
  slug: string;
  title: string;
  skill: string;
  badge: string;
  game: GameKind;
  order: number;
  story: string;
  objective: string;
  status: MissionStatus;
  estimatedMinutes: number;
}

/** Theme key the frontend maps to art + palette. Colors are never sent by the
 *  server — only this key. */
export type WorldTheme =
  | "forest"
  | "kingdom"
  | "city"
  | "factory"
  | "mountain"
  | "space"
  | "keyboard";

export interface LandWorld {
  slug: string;
  title: string;
  subtitle: string;
  theme: WorldTheme;
  order: number;
  locked: boolean;
  skills: string[];
  missions: LandMission[];
}
