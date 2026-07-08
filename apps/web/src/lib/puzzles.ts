// Robo Coding Lab — puzzle definitions + a safe block interpreter.
//
// Each mission can carry a grid puzzle the child solves by assembling blocks
// (move / turn / repeat / if-path). The interpreter walks the block tree (no
// eval) and produces animation frames plus a solved flag. Blocks available per
// puzzle escalate with the curriculum's skill (loops -> repeat, conditions ->
// if-path), so the coding surface teaches the same concept as the story.

export type BlockType = "move" | "left" | "right" | "repeat" | "if_path";

export interface Block {
  id: string;
  type: BlockType;
  times?: number; // repeat only
  children?: Block[]; // repeat / if_path only
}

export interface Cell {
  x: number;
  y: number;
}

export interface Puzzle {
  slug: string;
  cols: number;
  rows: number;
  start: Cell;
  startDir: number; // 0=N,1=E,2=S,3=W
  goal?: Cell; // must end here (if set)
  stars: Cell[]; // must collect all
  walls: Cell[];
  palette: BlockType[];
  instruction: string;
}

export interface Frame {
  x: number;
  y: number;
  dir: number;
  collected: string[];
  bumped: boolean;
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const MAX_ACTIONS = 400;
const key = (x: number, y: number) => `${x},${y}`;

/** Run a block program against a puzzle, returning animation frames + solved. */
export function runProgram(
  program: Block[],
  puzzle: Puzzle,
): { frames: Frame[]; solved: boolean } {
  const wallSet = new Set(puzzle.walls.map((c) => key(c.x, c.y)));
  const starSet = new Set(puzzle.stars.map((c) => key(c.x, c.y)));
  const collected = new Set<string>();

  let x = puzzle.start.x;
  let y = puzzle.start.y;
  let dir = puzzle.startDir;
  let actions = 0;

  const frames: Frame[] = [];
  const snapshot = (bumped = false) =>
    frames.push({ x, y, dir, collected: [...collected], bumped });

  // collect a star we start on
  if (starSet.has(key(x, y))) collected.add(key(x, y));
  snapshot();

  const passable = (nx: number, ny: number) =>
    nx >= 0 &&
    ny >= 0 &&
    nx < puzzle.cols &&
    ny < puzzle.rows &&
    !wallSet.has(key(nx, ny));

  const exec = (blocks: Block[]): void => {
    for (const b of blocks) {
      if (actions >= MAX_ACTIONS) return;
      actions++;
      if (b.type === "move") {
        const nx = x + DX[dir];
        const ny = y + DY[dir];
        if (passable(nx, ny)) {
          x = nx;
          y = ny;
          if (starSet.has(key(x, y))) collected.add(key(x, y));
          snapshot();
        } else {
          snapshot(true); // bump — stay put
        }
      } else if (b.type === "left") {
        dir = (dir + 3) % 4;
        snapshot();
      } else if (b.type === "right") {
        dir = (dir + 1) % 4;
        snapshot();
      } else if (b.type === "repeat") {
        const n = Math.max(0, Math.min(20, b.times ?? 1));
        for (let i = 0; i < n; i++) {
          if (actions >= MAX_ACTIONS) return;
          exec(b.children ?? []);
        }
      } else if (b.type === "if_path") {
        if (passable(x + DX[dir], y + DY[dir])) exec(b.children ?? []);
      }
    }
  };

  exec(program);

  const allStars = puzzle.stars.every((c) => collected.has(key(c.x, c.y)));
  const atGoal = !puzzle.goal || (x === puzzle.goal.x && y === puzzle.goal.y);
  return { frames, solved: allStars && atGoal };
}

/** Count total blocks (including nested) — used for the block budget display. */
export function countBlocks(program: Block[]): number {
  return program.reduce(
    (n, b) => n + 1 + countBlocks(b.children ?? []),
    0,
  );
}

// --- Puzzle catalog, keyed by mission slug. -------------------------------
// Grids are small and hand-checked solvable. Skills escalate the palette.
const S = (x: number, y: number): Cell => ({ x, y });

export const PUZZLES: Record<string, Puzzle> = {
  "robo-hello": {
    slug: "robo-hello",
    cols: 5,
    rows: 1,
    start: S(0, 0),
    startDir: 1,
    goal: S(4, 0),
    stars: [S(4, 0)],
    walls: [],
    palette: ["move"],
    instruction: "Robo just woke up! Walk him across to meet his new friend ⭐.",
  },
  "robo-directions": {
    slug: "robo-directions",
    cols: 4,
    rows: 4,
    start: S(0, 3),
    startDir: 0,
    goal: S(3, 0),
    stars: [S(3, 0)],
    walls: [],
    palette: ["move", "left", "right"],
    instruction: "Robo is lost. Turn and move him home to the ⭐ in the corner.",
  },
  "pattern-forest": {
    slug: "pattern-forest",
    cols: 5,
    rows: 1,
    start: S(0, 0),
    startDir: 1,
    stars: [S(1, 0), S(3, 0)],
    walls: [],
    palette: ["move", "left", "right"],
    instruction: "The glowing trees follow a pattern. Collect the ⭐ ⭐ in order.",
  },
  "collect-stars": {
    slug: "collect-stars",
    cols: 6,
    rows: 1,
    start: S(0, 0),
    startDir: 1,
    stars: [S(1, 0), S(2, 0), S(3, 0), S(4, 0), S(5, 0)],
    walls: [],
    palette: ["move", "left", "right", "repeat"],
    instruction:
      "So many stars! Instead of many Moves, use a Repeat loop to grab them all.",
  },
  "button-kingdom": {
    slug: "button-kingdom",
    cols: 5,
    rows: 5,
    start: S(0, 4),
    startDir: 0,
    stars: [S(0, 0), S(4, 0)],
    walls: [],
    palette: ["move", "left", "right", "repeat"],
    instruction: "Press every button ⭐ in the kingdom. Loops make it quick!",
  },
  "avoid-obstacles": {
    slug: "avoid-obstacles",
    cols: 6,
    rows: 1,
    start: S(0, 0),
    startDir: 1,
    goal: S(5, 0),
    stars: [S(5, 0)],
    walls: [S(2, 0), S(4, 0)],
    palette: ["move", "left", "right", "repeat", "if_path"],
    instruction:
      "Rocks block the path! Use If-Path so Robo only steps when it's clear.",
  },
  "glitch-cave": {
    slug: "glitch-cave",
    cols: 4,
    rows: 4,
    start: S(0, 0),
    startDir: 2,
    goal: S(3, 3),
    stars: [S(3, 3)],
    walls: [S(1, 1), S(2, 2)],
    palette: ["move", "left", "right", "repeat", "if_path"],
    instruction: "Something's glitchy! Debug a path down to the ⭐ exit.",
  },
  "dancing-robot": {
    slug: "dancing-robot",
    cols: 3,
    rows: 3,
    start: S(1, 1),
    startDir: 1,
    goal: S(1, 1),
    stars: [S(1, 0), S(2, 1), S(1, 2), S(0, 1)],
    walls: [],
    palette: ["move", "left", "right", "repeat"],
    instruction:
      "Make Robo dance! Spin and step to touch all four ⭐, then return home.",
  },
  "robo-storybook": {
    slug: "robo-storybook",
    cols: 5,
    rows: 5,
    start: S(0, 0),
    startDir: 2,
    goal: S(4, 4),
    stars: [S(0, 4), S(4, 4)],
    walls: [S(2, 1), S(2, 2), S(2, 3)],
    palette: ["move", "left", "right", "repeat", "if_path"],
    instruction: "Guide the hero through the story to collect both ⭐ endings.",
  },
  "star-chase": {
    slug: "star-chase",
    cols: 6,
    rows: 6,
    start: S(0, 5),
    startDir: 0,
    stars: [S(0, 0), S(5, 0), S(5, 5)],
    walls: [S(2, 2), S(3, 2), S(2, 3), S(3, 3)],
    palette: ["move", "left", "right", "repeat", "if_path"],
    instruction: "Your mini-game! Chase down all three ⭐ around the arena.",
  },
  "big-idea": {
    slug: "big-idea",
    cols: 6,
    rows: 6,
    start: S(0, 0),
    startDir: 1,
    stars: [S(5, 0), S(5, 5), S(0, 5)],
    walls: [],
    palette: ["move", "left", "right", "repeat", "if_path"],
    instruction: "Your big idea, your rules. Collect all three ⭐ any way you like.",
  },
  showcase: {
    slug: "showcase",
    cols: 5,
    rows: 5,
    start: S(2, 2),
    startDir: 0,
    stars: [S(2, 0), S(4, 2), S(2, 4), S(0, 2)],
    walls: [],
    palette: ["move", "left", "right", "repeat", "if_path"],
    instruction: "Graduation lap! Show off every skill and light up all four ⭐.",
  },
};

export function puzzleFor(slug: string): Puzzle | null {
  return PUZZLES[slug] ?? null;
}
