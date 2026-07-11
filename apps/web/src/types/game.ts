// Shared contracts for the game engines (command parsing, robot maze, typing).
// Pure data types — no React, no side effects — so the engines stay testable
// and reusable across worlds.
import type { HtmlStudioData } from "./studio";

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

// --- Leveling ------------------------------------------------------------
// Every tap game is a ladder of levels of increasing difficulty (spec: ≥7).
// A level bundles its playable content with kid-facing framing. Progress across
// levels (unlock, best stars, resume) is handled generically — see
// lib/engines/level-progress.ts and features/games/LeveledGame.tsx.
export interface GameLevel<C> {
  /** Stable id used as the progress key — never reuse across levels. */
  id: string;
  /** Short difficulty name shown on the ladder, e.g. "Discovery", "Mastery". */
  title: string;
  /** Kid-friendly goal for this level, read aloud. */
  objective: string;
  content: C;
}

// --- Shape Match (pattern recognition) ------------------------------------
export interface ShapeMatchRound {
  /** The shape to find (emoji). */
  target: string;
  /** Choices shown to the child — includes the target plus distractors. */
  options: string[];
}

export interface ShapeMatchLevel {
  prompt: string;
  rounds: ShapeMatchRound[];
}

export interface ShapeMatchData {
  kind: "shape-match";
  levels: GameLevel<ShapeMatchLevel>[];
}

// --- Memory (matching hidden pairs) ---------------------------------------
export interface MemoryLevel {
  /** Distinct faces; each appears twice on the board. Grows 3→8 with level. */
  faces: string[];
  /** Mistakes allowed while still earning the bonus star. */
  starThreshold: number;
}

export interface MemoryData {
  kind: "memory";
  levels: GameLevel<MemoryLevel>[];
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

export interface PatternLevel {
  rounds: PatternRound[];
}

export interface PatternBuilderData {
  kind: "pattern-builder";
  levels: GameLevel<PatternLevel>[];
}

// --- Keyboard Kingdom / Typing Town (keyboard fluency) --------------------
export interface KeyQuestLevel {
  /** Kid-friendly instruction, read aloud (e.g. "Find and press each letter!"). */
  prompt: string;
  /** Tokens to type in order — a single key, a letter, a word, or a short
   *  sentence each. Matching is case-insensitive; a space is a real target. */
  targets: string[];
  /** Max total mistakes still allowed to earn the mastery star for the level. */
  starThreshold: number;
}

export interface KeyQuestData {
  kind: "key-quest";
  levels: GameLevel<KeyQuestLevel>[];
}

// --- Balloon Pop (arcade typing mini-game) --------------------------------
export interface BalloonPopLevel {
  prompt: string;
  /** Letters that float up, one balloon at a time; press each before it escapes. */
  letters: string[];
  /** Seconds each balloon takes to float off-screen (smaller = harder). */
  secondsPerBalloon: number;
  /** Max balloons that may escape and still earn the mastery star. */
  starThreshold: number;
}

export interface BalloonPopData {
  kind: "balloon-pop";
  levels: GameLevel<BalloonPopLevel>[];
}

export type MissionGameData =
  | RobotMazeData
  | TypingQuestData
  | ShapeMatchData
  | MemoryData
  | PatternBuilderData
  | KeyQuestData
  | BalloonPopData
  | HtmlStudioData;
