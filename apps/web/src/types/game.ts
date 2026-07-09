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

// --- Shape Match (pattern recognition) ------------------------------------
export interface ShapeMatchRound {
  /** The shape to find (emoji). */
  target: string;
  /** Choices shown to the child — includes the target plus distractors. */
  options: string[];
}

export interface ShapeMatchData {
  kind: "shape-match";
  prompt: string;
  rounds: ShapeMatchRound[];
}

// --- Memory (matching hidden pairs) ---------------------------------------
export interface MemoryData {
  kind: "memory";
  /** Distinct faces; each appears twice on the board. Keep to 6–8 for age ~6. */
  faces: string[];
  /** Mistakes allowed while still earning the bonus star. */
  starThreshold: number;
}

// --- Pattern Builder (patterns & loops) -----------------------------------
export interface PatternRound {
  /** The visible pattern with exactly one blank marked by "?". */
  sequence: string[];
  /** Palette the child chooses from to fill the blank. */
  options: string[];
  /** The correct fill for the blank. */
  answer: string;
}

export interface PatternBuilderData {
  kind: "pattern-builder";
  rounds: PatternRound[];
}

export type MissionGameData =
  | RobotMazeData
  | TypingQuestData
  | ShapeMatchData
  | MemoryData
  | PatternBuilderData;
