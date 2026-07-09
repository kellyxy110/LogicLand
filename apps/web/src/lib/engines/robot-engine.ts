// Robot engine — a pure, deterministic grid state machine. Given a list of
// commands and a maze, it returns an ordered list of frames the UI animates.
// No React, no timers, no randomness: trivially testable and reusable by every
// grid-based game (Robot Maze, Typing Quest, future robotics missions).
import type {
  CellKind,
  CommandId,
  Direction,
  Frame,
  MazeConfig,
  RobotState,
  RunResult,
} from "@/types/game";

const DELTA: Record<Direction, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  S: { dx: 0, dy: 1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
};

// Clockwise turn order.
const CW: Record<Direction, Direction> = { N: "E", E: "S", S: "W", W: "N" };

// Absolute-direction commands set both position delta and facing.
const ABSOLUTE: Partial<Record<CommandId, Direction>> = {
  UP: "N",
  DOWN: "S",
  LEFT: "W",
  RIGHT: "E",
};

const BLOCKING: ReadonlySet<CellKind> = new Set<CellKind>(["tree", "rock", "water"]);

function cellAt(maze: MazeConfig, x: number, y: number): CellKind | null {
  if (x < 0 || y < 0 || x >= maze.cols || y >= maze.rows) return null;
  return maze.grid[y]?.[x] ?? null;
}

function blockedMessage(cell: CellKind | null): string {
  if (cell === null) return "Oops! That's the edge of the forest. Try another way.";
  if (cell === "water") return "Splash! Robo can't swim there. Go around!";
  if (cell === "tree") return "Bonk! A tree is in the way. Try another way!";
  return "There's a rock there. Let's go around it!";
}

function countStars(maze: MazeConfig): number {
  return maze.grid.reduce(
    (sum, row) => sum + row.filter((c) => c === "star").length,
    0,
  );
}

/** Run a command program against a maze. Pure — same inputs always yield the
 *  same frames. */
export function runProgram(commands: CommandId[], maze: MazeConfig): RunResult {
  const totalStars = countStars(maze);
  const collected = new Set<string>(); // "x,y" of stars already picked up
  let robot: RobotState = { ...maze.start };
  let reached = false;

  const frames: Frame[] = [
    {
      step: -1,
      command: null,
      robot: { ...robot },
      event: "start",
      collectedStars: 0,
      reachedTreasure: false,
    },
  ];

  const enter = (x: number, y: number): { star: boolean; treasure: boolean } => {
    const cell = cellAt(maze, x, y);
    let star = false;
    if (cell === "star") {
      const key = `${x},${y}`;
      if (!collected.has(key)) {
        collected.add(key);
        star = true;
      }
    }
    const treasure = cell === "treasure";
    if (treasure) reached = true;
    return { star, treasure };
  };

  commands.forEach((command, step) => {
    // TURN and STOP never move.
    if (command === "TURN") {
      robot = { ...robot, facing: CW[robot.facing] };
      frames.push(frame(step, command, robot, "turn", collected.size, reached));
      return;
    }
    if (command === "STOP") {
      frames.push(frame(step, command, robot, "stop", collected.size, reached));
      return;
    }

    // Resolve heading + how far this command travels.
    const facing = ABSOLUTE[command] ?? robot.facing;
    const distance = command === "RUN" ? 2 : command === "JUMP" ? 2 : 1;
    const hop = command === "JUMP"; // JUMP clears the cell it passes over
    const { dx, dy } = DELTA[facing];

    let cx = robot.x;
    let cy = robot.y;
    let event: Frame["event"] = "move";
    let message: string | undefined;

    for (let stepTaken = 1; stepTaken <= distance; stepTaken++) {
      const nx = cx + dx;
      const ny = cy + dy;
      const isLanding = stepTaken === distance;
      const cell = cellAt(maze, nx, ny);

      // Hopping flies over a non-landing blocked cell; walking is stopped by it.
      if (cell === null || BLOCKING.has(cell)) {
        if (hop && !isLanding) {
          cx = nx;
          cy = ny;
          continue;
        }
        event = "blocked";
        message = blockedMessage(cell);
        break;
      }

      cx = nx;
      cy = ny;
      // Walking collects a star it passes through; a hop only counts its landing.
      if (!hop || isLanding) {
        const { star, treasure } = enter(cx, cy);
        if (treasure) event = "treasure";
        else if (star && event !== "treasure") event = "star";
      }
    }

    robot = { x: cx, y: cy, facing };
    if (hop && event === "move") event = "jump";
    frames.push(
      frame(step, command, robot, event, collected.size, reached, message),
    );
  });

  return {
    frames,
    success: reached,
    starsCollected: collected.size,
    totalStars,
  };
}

function frame(
  step: number,
  command: CommandId,
  robot: RobotState,
  event: Frame["event"],
  collectedStars: number,
  reachedTreasure: boolean,
  message?: string,
): Frame {
  return {
    step,
    command,
    robot: { ...robot },
    event,
    collectedStars,
    reachedTreasure,
    message,
  };
}
