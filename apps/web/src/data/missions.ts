// Per-mission game data (maze layouts, typing sequences, and tap-game content),
// keyed by mission slug. Config-driven so new missions are added here without
// touching engine or UI code. Grids are row-major: grid[y][x], y=0 is the top row.
import type {
  CellKind,
  MissionGameData,
  PatternBuilderData,
  ShapeMatchData,
  MemoryData,
} from "@/types/game";
import { KEYBOARD_GAME_DATA } from "./keyboard";
import { studioDataFor } from "./studio";

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

/** Mission 2 — Shape Match: a 7-level ladder of visual discrimination, the root
 *  of pattern recognition. Difficulty grows via more options, closer
 *  distractors, and more rounds — never just "more of the same". */
const SHAPE_MATCH: ShapeMatchData = {
  kind: "shape-match",
  levels: [
    {
      id: "sm-1",
      title: "Discovery",
      objective: "Find the shape that matches — just two to pick from.",
      content: {
        prompt: "Tap the shape that matches!",
        rounds: [
          { target: "🔴", options: ["🔴", "🔵"] },
          { target: "🟡", options: ["🟢", "🟡"] },
          { target: "⭐", options: ["⭐", "🔵"] },
        ],
      },
    },
    {
      id: "sm-2",
      title: "Guided Practice",
      objective: "Now pick from three shapes.",
      content: {
        prompt: "Which one is the same?",
        rounds: [
          { target: "🔺", options: ["🔵", "🔺", "🟩"] },
          { target: "🟨", options: ["🟨", "🔶", "🔴"] },
          { target: "🔵", options: ["🟩", "🔵", "🔺"] },
        ],
      },
    },
    {
      id: "sm-3",
      title: "Independent",
      objective: "Four shapes now — look closely!",
      content: {
        prompt: "Find the match!",
        rounds: [
          { target: "🔵", options: ["🟩", "🔶", "🔵", "🔺"] },
          { target: "⭐", options: ["🔶", "⭐", "🟨", "🔵"] },
          { target: "🟩", options: ["🔺", "🔵", "🟨", "🟩"] },
          { target: "🔴", options: ["🔴", "🟠", "🟣", "🔵"] },
        ],
      },
    },
    {
      id: "sm-4",
      title: "Combination",
      objective: "Some colors look alike — pick carefully.",
      content: {
        prompt: "Careful — which is exactly right?",
        rounds: [
          { target: "🟠", options: ["🔴", "🟠", "🟡", "🟣"] },
          { target: "🟣", options: ["🔵", "🟣", "🟠", "🔴"] },
          { target: "🟢", options: ["🟢", "🟩", "🔵", "🟡"] },
          { target: "🔶", options: ["🔶", "🔺", "⭐", "🟨"] },
        ],
      },
    },
    {
      id: "sm-5",
      title: "Problem Solving",
      objective: "Five choices — trust your eyes.",
      content: {
        prompt: "Find the one that matches!",
        rounds: [
          { target: "🔺", options: ["🔵", "🔺", "🟩", "🟨", "🔶"] },
          { target: "🟪", options: ["🟪", "🟦", "🟩", "🟨", "🟧"] },
          { target: "🔴", options: ["🟠", "🔴", "🟣", "🔵", "🟢"] },
          { target: "⭐", options: ["🔶", "⭐", "🟨", "🔵", "🔺"] },
          { target: "🟢", options: ["🔵", "🟢", "🟡", "🔴", "🟣"] },
        ],
      },
    },
    {
      id: "sm-6",
      title: "Accuracy",
      objective: "Six choices — go for no misses!",
      content: {
        prompt: "Match it — no misses for a star!",
        rounds: [
          { target: "🔵", options: ["🔵", "🟢", "🟣", "🔴", "🟠", "🟡"] },
          { target: "🟩", options: ["🟩", "🟦", "🟨", "🟧", "🟪", "🟥"] },
          { target: "⭐", options: ["⭐", "🔶", "🔵", "🟩", "🔺", "🟨"] },
          { target: "🔴", options: ["🟠", "🟡", "🔴", "🟢", "🔵", "🟣"] },
          { target: "🔶", options: ["🔷", "🔶", "🔺", "🟨", "🟩", "🔵"] },
          { target: "🟠", options: ["🔴", "🟠", "🟡", "🟣", "🟢", "🔵"] },
        ],
      },
    },
    {
      id: "sm-7",
      title: "Mastery",
      objective: "The final challenge — every kind of shape!",
      content: {
        prompt: "Master matcher — find them all!",
        rounds: [
          { target: "🟣", options: ["🟤", "🟣", "🔵", "🟪", "🔴", "🟢"] },
          { target: "🔶", options: ["🔶", "🟨", "🔷", "⭐", "🔺", "🟧"] },
          { target: "🟦", options: ["🟦", "🟩", "🟪", "🟫", "⬜", "🟨"] },
          { target: "❤️", options: ["🧡", "❤️", "💛", "💙", "💜", "💚"] },
          { target: "⭐", options: ["🌙", "⭐", "☀️", "⚡", "🌈", "❄️"] },
          { target: "🟠", options: ["🔴", "🟠", "🟡", "🟣", "🔵", "🟢"] },
        ],
      },
    },
  ],
};

/** Mission 3 — Memory Game: a 7-level ladder growing from 3 pairs to 8, with
 *  tighter no-miss star thresholds along the way. Forest faces on a 4-wide board. */
const MEMORY_GAME: MemoryData = {
  kind: "memory",
  levels: [
    {
      id: "mem-1",
      title: "Discovery",
      objective: "Find three matching pairs.",
      content: { faces: ["🌲", "🍄", "🦊"], starThreshold: 3 },
    },
    {
      id: "mem-2",
      title: "Guided Practice",
      objective: "Four pairs to remember.",
      content: { faces: ["🌲", "🍄", "🦊", "🐰"], starThreshold: 4 },
    },
    {
      id: "mem-3",
      title: "Independent",
      objective: "New forest friends — four pairs.",
      content: { faces: ["🐻", "🦉", "🐿️", "🍁"], starThreshold: 3 },
    },
    {
      id: "mem-4",
      title: "Combination",
      objective: "Five pairs now!",
      content: { faces: ["🌲", "🍄", "🦊", "🐰", "⭐"], starThreshold: 4 },
    },
    {
      id: "mem-5",
      title: "Problem Solving",
      objective: "Six pairs — keep them in mind.",
      content: { faces: ["🌲", "🍄", "🦊", "🐰", "⭐", "🍎"], starThreshold: 5 },
    },
    {
      id: "mem-6",
      title: "Accuracy",
      objective: "Six pairs — few misses for a star!",
      content: { faces: ["🐝", "🦋", "🐞", "🐌", "🐛", "🌻"], starThreshold: 3 },
    },
    {
      id: "mem-7",
      title: "Mastery",
      objective: "Eight pairs — the memory master challenge!",
      content: {
        faces: ["🌲", "🍄", "🦊", "🐰", "⭐", "🍎", "🦉", "🐻"],
        starThreshold: 5,
      },
    },
  ],
};

/** Mission 4 — Pattern Builder: fill the missing piece to complete the pattern —
 *  the gentle on-ramp to loops. Seven levels grow the pattern length, symbol
 *  count, and palette size. */
const PATTERN_BUILDER: PatternBuilderData = {
  kind: "pattern-builder",
  levels: [
    {
      id: "pat-1",
      title: "Discovery",
      objective: "Finish a simple A-B-A-B pattern.",
      content: {
        rounds: [
          { sequence: ["🔴", "🔵", "🔴", "?"], options: ["🔴", "🔵"], answer: "🔵" },
          { sequence: ["🟡", "🟢", "🟡", "?"], options: ["🟡", "🟢"], answer: "🟢" },
        ],
      },
    },
    {
      id: "pat-2",
      title: "Guided Practice",
      objective: "Patterns that repeat in groups.",
      content: {
        rounds: [
          { sequence: ["🔵", "🔵", "🔴", "🔵", "🔵", "?"], options: ["🔵", "🔴"], answer: "🔴" },
          { sequence: ["⭐", "🌙", "⭐", "🌙", "?"], options: ["⭐", "🌙"], answer: "⭐" },
          { sequence: ["🟢", "🟢", "🟡", "?"], options: ["🟢", "🟡"], answer: "🟡" },
        ],
      },
    },
    {
      id: "pat-3",
      title: "Independent",
      objective: "Three-symbol patterns now.",
      content: {
        rounds: [
          { sequence: ["🔴", "🔵", "🟡", "🔴", "🔵", "?"], options: ["🔴", "🔵", "🟡"], answer: "🟡" },
          { sequence: ["🔺", "🔵", "🟩", "🔺", "🔵", "?"], options: ["🔺", "🔵", "🟩"], answer: "🟩" },
          { sequence: ["🍎", "🍌", "🍇", "🍎", "🍌", "?"], options: ["🍎", "🍌", "🍇"], answer: "🍇" },
        ],
      },
    },
    {
      id: "pat-4",
      title: "Combination",
      objective: "Longer patterns — watch the whole strip.",
      content: {
        rounds: [
          { sequence: ["🔴", "🔵", "🔴", "🔵", "🔴", "?"], options: ["🔴", "🔵", "🟡"], answer: "🔵" },
          { sequence: ["🟢", "🟡", "🟡", "🟢", "🟡", "?"], options: ["🟢", "🟡", "🔴"], answer: "🟡" },
          { sequence: ["⭐", "⭐", "🌙", "⭐", "⭐", "?"], options: ["⭐", "🌙", "☀️"], answer: "🌙" },
        ],
      },
    },
    {
      id: "pat-5",
      title: "Problem Solving",
      objective: "Trickier repeats — think it through.",
      content: {
        rounds: [
          { sequence: ["🔺", "🔵", "🔺", "🔵", "🔺", "?"], options: ["🔺", "🔵", "🟩"], answer: "🔵" },
          { sequence: ["🟥", "🟧", "🟨", "🟥", "🟧", "?"], options: ["🟥", "🟧", "🟨"], answer: "🟨" },
          { sequence: ["🐶", "🐱", "🐭", "🐶", "🐱", "?"], options: ["🐶", "🐱", "🐭"], answer: "🐭" },
          { sequence: ["🔵", "🔴", "🔴", "🔵", "🔴", "🔴", "🔵", "?"], options: ["🔵", "🔴"], answer: "🔴" },
        ],
      },
    },
    {
      id: "pat-6",
      title: "Accuracy",
      objective: "Four choices — go for no misses!",
      content: {
        rounds: [
          { sequence: ["🟠", "🟣", "🟢", "🟠", "🟣", "?"], options: ["🟠", "🟣", "🟢", "🔵"], answer: "🟢" },
          { sequence: ["1️⃣", "2️⃣", "3️⃣", "1️⃣", "2️⃣", "?"], options: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"], answer: "3️⃣" },
          { sequence: ["🔴", "🟡", "🔵", "🟢", "🔴", "🟡", "🔵", "?"], options: ["🔴", "🟡", "🔵", "🟢"], answer: "🟢" },
          { sequence: ["⬆️", "➡️", "⬇️", "⬆️", "➡️", "?"], options: ["⬆️", "➡️", "⬇️", "⬅️"], answer: "⬇️" },
          { sequence: ["🌸", "🌼", "🌸", "🌼", "🌸", "?"], options: ["🌸", "🌼", "🌷", "🌹"], answer: "🌼" },
        ],
      },
    },
    {
      id: "pat-7",
      title: "Mastery",
      objective: "The longest patterns — pattern master!",
      content: {
        rounds: [
          { sequence: ["🔴", "🔵", "🟡", "🟢", "🔴", "🔵", "🟡", "?"], options: ["🔴", "🔵", "🟡", "🟢"], answer: "🟢" },
          { sequence: ["🐶", "🐶", "🐱", "🐶", "🐶", "🐱", "🐶", "?"], options: ["🐶", "🐱", "🐭", "🐰"], answer: "🐶" },
          { sequence: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟥", "🟧", "?"], options: ["🟨", "🟩", "🟦", "🟥"], answer: "🟨" },
          { sequence: ["🌙", "⭐", "⭐", "🌙", "⭐", "⭐", "🌙", "?"], options: ["🌙", "⭐", "☀️", "🌈"], answer: "⭐" },
          { sequence: ["🚗", "🚕", "🚙", "🚗", "🚕", "🚙", "🚗", "?"], options: ["🚗", "🚕", "🚙", "🚌"], answer: "🚕" },
        ],
      },
    },
  ],
};

const MISSION_GAME_DATA: Record<string, MissionGameData> = {
  "robot-path": ROBOT_PATH,
  "typing-quest": TYPING_QUEST,
  "shape-match": SHAPE_MATCH,
  "memory-game": MEMORY_GAME,
  "pattern-builder": PATTERN_BUILDER,
  ...KEYBOARD_GAME_DATA,
};

/** Game data for a mission slug, or null if the mission isn't playable yet.
 *  HTML Studio content lives in its own module (it's richer than a tap game). */
export function gameDataFor(slug: string): MissionGameData | null {
  return MISSION_GAME_DATA[slug] ?? studioDataFor(slug) ?? null;
}
