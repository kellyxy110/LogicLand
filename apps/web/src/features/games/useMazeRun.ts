"use client";
// Glue between the pure robot engine and the session store: loads the session
// for a mission, drives frame-by-frame playback on a timer, and derives what the
// board needs (current robot, friendly message, collected stars). Games stay
// declarative — they call `run(program)` and render what this returns.
import { useCallback, useEffect } from "react";
import { runProgram } from "@/lib/engines/robot-engine";
import type { CommandId, MazeConfig } from "@/types/game";
import { visitedStarKeys } from "./MazeBoard";
import { useGameSession } from "./useGameSession";

const FRAME_MS = 620;

export function useMazeRun(slug: string, maze: MazeConfig) {
  const {
    program,
    phase,
    result,
    frame,
    load,
    play,
    tick,
    edit,
    push,
    pop,
    clearProgram,
    setProgram,
  } = useGameSession();

  // Reset the session whenever the mission changes.
  useEffect(() => {
    load(slug);
  }, [slug, load]);

  // Advance playback one frame at a time until the run finalizes.
  useEffect(() => {
    if (phase !== "playing" || !result) return;
    if (frame >= result.frames.length - 1) return;
    const t = setTimeout(tick, FRAME_MS);
    return () => clearTimeout(t);
  }, [phase, frame, result, tick]);

  const run = useCallback(
    (commands: CommandId[]) => {
      if (commands.length === 0) return;
      play(runProgram(commands, maze));
    },
    [maze, play],
  );

  const current = result?.frames[frame];
  const robot = current?.robot ?? maze.start;
  const message = current?.message ?? null;
  const visitedStars = result
    ? visitedStarKeys(maze, result.frames, frame)
    : new Set<string>();

  return {
    // state
    program,
    phase,
    result,
    robot,
    message,
    visitedStars,
    starsCollected: current?.collectedStars ?? 0,
    // actions
    run,
    edit,
    push,
    pop,
    clearProgram,
    setProgram,
  };
}
