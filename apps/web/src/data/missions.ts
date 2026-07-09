// Per-mission game data (maze layouts + typing sequences), keyed by mission
// slug. Config-driven so new missions are added here without touching engine or
// UI code. Grids are row-major: grid[y][x], y=0 is the top row.
import type { CellKind, MissionGameData } from "@/types/game";

// Compact helpers so the grids below stay readable.
const _ = "empty" as CellKind;
const T = "tree" as CellKind;
const R = "rock" as CellKind;
const S = "star" as CellKind;
const X = "treasure" as CellKind;

/** Mission 1 — Robot Path: an open maze the explorer solves by composing a
 *  sequence. Absolute-direction palette is the gentlest entry for age ~6. */
const ROBOT_PATH: MissionGameData = {
  kind: "robot-maze",
  palette: ["UP", "DOWN", "LEFT", "RIGHT"],
  maze: {
    cols: 5,
    rows: 5,
    start: { x: 0, y: 4, facing: "N" },
    hint: "Go UP to the star, then find the treasure!",
    grid: [
      [_, _, _, _, X],
      [_, T, _, T, _],
      [_, _, S, _, _],
      [_, T, _, T, _],
      [_, _, _, _, _],
    ],
  },
};

/** Mission 5 — Typing Quest: a guided path. The explorer types each command in
 *  order; every correct entry steps Robo along. Reuses the same maze engine. */
const TYPING_QUEST: MissionGameData = {
  kind: "typing-quest",
  palette: ["RIGHT", "LEFT", "UP", "DOWN"],
  sequence: ["RIGHT", "RIGHT", "UP", "RIGHT", "RIGHT", "UP"],
  maze: {
    cols: 5,
    rows: 3,
    start: { x: 0, y: 2, facing: "E" },
    hint: "Type each command to send Robo to the treasure!",
    grid: [
      [_, _, _, _, X],
      [_, _, S, _, _],
      [_, _, _, _, _],
    ],
  },
};

const MISSION_GAME_DATA: Record<string, MissionGameData> = {
  "robot-path": ROBOT_PATH,
  "typing-quest": TYPING_QUEST,
};

/** Game data for a mission slug, or null if the mission isn't playable yet. */
export function gameDataFor(slug: string): MissionGameData | null {
  return MISSION_GAME_DATA[slug] ?? null;
}
