import { describe, expect, it } from "vitest";
import { gameDataFor } from "@/data/missions";
import type { CellKind, MazeConfig, RobotState } from "@/types/game";
import { runProgram } from "./robot-engine";

// Tiny maze builder for focused unit cases.
function maze(
  grid: CellKind[][],
  start: RobotState,
): MazeConfig {
  return { cols: grid[0].length, rows: grid.length, start, grid };
}

const E = "empty" as CellKind;
const T = "tree" as CellKind;
const S = "star" as CellKind;
const X = "treasure" as CellKind;

describe("runProgram — movement", () => {
  it("emits an initial start frame at the robot's start", () => {
    const r = runProgram([], maze([[E, E]], { x: 0, y: 0, facing: "E" }));
    expect(r.frames[0].event).toBe("start");
    expect(r.frames[0].robot).toEqual({ x: 0, y: 0, facing: "E" });
  });

  it("moves with absolute directions and updates facing", () => {
    const r = runProgram(
      ["RIGHT", "DOWN"],
      maze(
        [
          [E, E],
          [E, E],
        ],
        { x: 0, y: 0, facing: "N" },
      ),
    );
    expect(r.frames.at(-1)!.robot).toEqual({ x: 1, y: 1, facing: "S" });
  });

  it("TURN rotates clockwise without moving; GO then follows the new facing", () => {
    const r = runProgram(
      ["TURN", "GO"],
      maze(
        [
          [E, E],
          [E, E],
        ],
        { x: 0, y: 0, facing: "N" },
      ),
    );
    expect(r.frames[1].event).toBe("turn");
    expect(r.frames[1].robot).toEqual({ x: 0, y: 0, facing: "E" });
    expect(r.frames.at(-1)!.robot).toEqual({ x: 1, y: 0, facing: "E" });
  });
});

describe("runProgram — obstacles (friendly, never fatal)", () => {
  it("is blocked by a tree and stays put with a kind message", () => {
    const r = runProgram(["GO"], maze([[E, T, X]], { x: 0, y: 0, facing: "E" }));
    const f = r.frames.at(-1)!;
    expect(f.event).toBe("blocked");
    expect(f.robot).toEqual({ x: 0, y: 0, facing: "E" });
    expect(f.message).toBeTruthy();
    expect(r.success).toBe(false);
  });

  it("is blocked at the edge of the grid", () => {
    const r = runProgram(["UP"], maze([[E]], { x: 0, y: 0, facing: "N" }));
    expect(r.frames.at(-1)!.event).toBe("blocked");
  });

  it("JUMP hops over a blocking cell to land beyond it", () => {
    const r = runProgram(["JUMP"], maze([[E, T, X]], { x: 0, y: 0, facing: "E" }));
    const f = r.frames.at(-1)!;
    expect(f.robot).toEqual({ x: 2, y: 0, facing: "E" });
    expect(f.reachedTreasure).toBe(true);
  });
});

describe("runProgram — stars & treasure", () => {
  it("RUN walks two cells and collects a star it passes through", () => {
    const r = runProgram(["RUN"], maze([[E, S, E, X]], { x: 0, y: 0, facing: "E" }));
    expect(r.frames.at(-1)!.robot.x).toBe(2);
    expect(r.starsCollected).toBe(1);
  });

  it("never counts the same star twice", () => {
    const r = runProgram(
      ["RIGHT", "LEFT", "RIGHT"],
      maze([[E, S, E]], { x: 0, y: 0, facing: "E" }),
    );
    expect(r.starsCollected).toBe(1);
  });

  it("marks success only when the treasure is reached", () => {
    const m = maze([[E, E, X]], { x: 0, y: 0, facing: "E" });
    expect(runProgram(["RIGHT"], m).success).toBe(false);
    expect(runProgram(["RIGHT", "RIGHT"], m).success).toBe(true);
  });
});

describe("runProgram — mission data is solvable", () => {
  it("Robot Path is completable and yields its star", () => {
    const data = gameDataFor("robot-path")!;
    if (data.kind !== "robot-maze") throw new Error("expected robot-maze");
    const solution = ["UP", "UP", "RIGHT", "RIGHT", "UP", "UP", "RIGHT", "RIGHT"] as const;
    const r = runProgram([...solution], data.maze);
    expect(r.success).toBe(true);
    expect(r.starsCollected).toBe(r.totalStars);
    expect(r.totalStars).toBe(1);
  });

  it("Typing Quest's built-in sequence reaches the treasure", () => {
    const data = gameDataFor("typing-quest")!;
    if (data.kind !== "typing-quest") throw new Error("expected typing-quest");
    const r = runProgram(data.sequence, data.maze);
    expect(r.success).toBe(true);
    expect(r.starsCollected).toBe(1);
  });
});
