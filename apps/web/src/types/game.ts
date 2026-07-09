// Shared contracts for the game engines (command parsing, robot maze, typing).
// Pure data types — no React, no side effects — so the engines stay testable
// and reusable across worlds.

// --- Commands -------------------------------------------------------------
export type CommandId =
  | "GO"
  | "LEFT"
  | "RIGHT"
  | "UP"
  | "DOWN"
  | "STOP"
  | "TURN"
  | "JUMP"
  | "RUN";

export interface CommandDef {
  id: CommandId;
  label: string;
  /** Lowercased spellings the parser accepts (typos included on purpose). */
  aliases: string[];
  /** Emoji shown on the command chip (kept as data, not hardcoded in UI). */
  icon: string;
  /** Kid-friendly one-liner: what this command does. */
  hint: string;
}

export type CommandGrammar = CommandDef[];

// --- Parsing --------------------------------------------------------------
export interface ParseIssue {
  word: string;
  /** Nearest known command, when we can guess one (for a friendly hint). */
  suggestion: CommandId | null;
}

export interface ParseResult {
  tokens: CommandId[];
  issues: ParseIssue[];
  ok: boolean;
}

// --- Maze -----------------------------------------------------------------
export type Direction = "N" | "E" | "S" | "W";

export type CellKind =
  | "empty"
  | "tree"
  | "rock"
  | "water"
  | "star"
  | "treasure";

export interface RobotState {
  x: number;
  y: number;
  facing: Direction;
}

export interface MazeConfig {
  cols: number;
  rows: number;
  start: RobotState;
  /** Row-major grid: grid[y][x]. */
  grid: CellKind[][];
  hint?: string;
}

// --- Robot engine output --------------------------------------------------
export type FrameEvent =
  | "start"
  | "move"
  | "turn"
  | "jump"
  | "blocked"
  | "star"
  | "treasure"
  | "stop"
  | "fall";

export interface Frame {
  /** Index into the command list that produced this frame (-1 = initial). */
  step: number;
  command: CommandId | null;
  robot: RobotState;
  event: FrameEvent;
  collectedStars: number;
  reachedTreasure: boolean;
  /** Friendly note for blocked/edge cases ("Bonk! A tree is there"). */
  message?: string;
}

export interface RunResult {
  frames: Frame[];
  success: boolean;
  starsCollected: number;
  totalStars: number;
}

// --- Per-mission game data ------------------------------------------------
export interface RobotMazeData {
  kind: "robot-maze";
  maze: MazeConfig;
  /** Commands offered on the palette for this mission. */
  palette: CommandId[];
}

export interface TypingQuestData {
  kind: "typing-quest";
  maze: MazeConfig;
  /** The command sequence the explorer types, in order, to guide Robo. */
  sequence: CommandId[];
  palette: CommandId[];
}

export type MissionGameData = RobotMazeData | TypingQuestData;
