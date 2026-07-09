"use client";
// Robot Maze — the flagship Logic Forest game. The explorer composes a sequence
// of commands from the palette, runs it, and watches Robo travel. Blocked moves
// are friendly ("Bonk! A tree is there"), never failures. Winning fires onWin so
// the MissionRunner can award progress.
import { Button, RoboAvatar } from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw, Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { RobotMazeData } from "@/types/game";
import { SpeakerButton } from "@/features/voice/SpeakerButton";
import { CommandChip } from "./CommandChip";
import { MazeBoard } from "./MazeBoard";
import { useMazeRun } from "./useMazeRun";

interface RobotMazeProps {
  slug: string;
  data: RobotMazeData;
  onWin: (starsCollected: number) => void;
}

export function RobotMaze({ slug, data, onWin }: RobotMazeProps) {
  const run = useMazeRun(slug, data.maze);
  const notified = useRef(false);

  // Announce a win exactly once per attempt.
  useEffect(() => {
    if (run.phase === "won" && !notified.current) {
      notified.current = true;
      onWin(run.result?.starsCollected ?? 0);
    }
    if (run.phase === "building") notified.current = false;
  }, [run.phase, run.result, onWin]);

  const building = run.phase === "building";
  const speech =
    run.message ??
    (run.phase === "won"
      ? "You did it! 🎉"
      : run.phase === "failed"
        ? "So close! Let's tweak the plan and try again."
        : data.maze.hint ?? "Tap commands, then press Run!");

  return (
    <div className="space-y-4">
      <MazeBoard
        maze={data.maze}
        robot={run.robot}
        visitedStars={run.visitedStars}
        won={run.phase === "won"}
      />

      {/* Robo speech */}
      <div className="flex items-center gap-3 rounded-2xl bg-brand/5 p-3">
        <RoboAvatar
          mood={run.phase === "won" ? "happy" : run.phase === "playing" ? "thinking" : "idle"}
          size={44}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={speech}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex-1 text-sm font-semibold"
          >
            {speech}
          </motion.p>
        </AnimatePresence>
        <SpeakerButton text={speech} label="Hear Robo" size="sm" />
      </div>

      {/* Program row */}
      <div className="min-h-[3rem] rounded-2xl border-2 border-dashed border-brand/25 p-2">
        {run.program.length === 0 ? (
          <p className="grid h-10 place-items-center text-sm opacity-50">
            Your plan appears here…
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {run.program.map((cmd, i) => (
                <CommandChip
                  key={`${cmd}-${i}`}
                  id={cmd}
                  variant="token"
                  onRemove={building ? () => removeAt(run, i) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Palette */}
      {building && (
        <div className="flex flex-wrap justify-center gap-2">
          {data.palette.map((id, i) => (
            <CommandChip key={id} id={id} index={i} onClick={() => run.push(id)} />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {building ? (
          <>
            <Button
              variant="ghost"
              onClick={run.pop}
              disabled={run.program.length === 0}
            >
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
            <Button
              variant="ghost"
              onClick={run.clearProgram}
              disabled={run.program.length === 0}
            >
              <RotateCcw className="h-4 w-4" /> Clear
            </Button>
            <Button
              size="lg"
              onClick={() => run.run(run.program)}
              disabled={run.program.length === 0}
            >
              <Play className="h-5 w-5 fill-white" /> Run
            </Button>
          </>
        ) : run.phase === "playing" ? (
          <p className="py-2 text-sm font-semibold opacity-60">Robo is moving…</p>
        ) : run.phase === "failed" ? (
          <Button size="lg" onClick={run.edit}>
            <RotateCcw className="h-5 w-5" /> Try Again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// Removing a chip mid-build: rebuild the program without index i.
function removeAt(
  run: ReturnType<typeof useMazeRun>,
  i: number,
): void {
  run.setProgram(run.program.filter((_, idx) => idx !== i));
}
