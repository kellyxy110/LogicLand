"use client";
// The play area: a grid where Robo, stars, walls and the goal live. Given the
// current animation Frame, it draws the board and smoothly glides Robo to his
// spot, rotating him to face his heading. Purely presentational.
import { motion } from "framer-motion";
import { Bot, ChevronUp, Flag, Star } from "lucide-react";
import type { Frame, Puzzle } from "@/lib/puzzles";

const keyOf = (x: number, y: number) => `${x},${y}`;
// dir 0=N,1=E,2=S,3=W -> degrees for the facing chevron.
const DIR_DEG = [0, 90, 180, 270];

export function RoboStage({
  puzzle,
  frame,
}: {
  puzzle: Puzzle;
  frame: Frame;
}) {
  const { cols, rows } = puzzle;
  const wallSet = new Set(puzzle.walls.map((c) => keyOf(c.x, c.y)));
  const collected = new Set(frame.collected);
  const cellPct = 100 / cols;
  const rowPct = 100 / rows;

  return (
    <div
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-meadow/5 dark:border-white/10"
      style={{ aspectRatio: `${cols} / ${rows}` }}
    >
      {/* grid cells */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const k = keyOf(x, y);
            const isWall = wallSet.has(k);
            const isGoal =
              puzzle.goal && puzzle.goal.x === x && puzzle.goal.y === y;
            return (
              <div
                key={k}
                className={`flex items-center justify-center border border-black/[0.04] text-lg dark:border-white/[0.04] ${
                  isWall ? "bg-slate-400/70 dark:bg-slate-600/70" : ""
                }`}
              >
                {isGoal && !puzzle.stars.some((s) => s.x === x && s.y === y) && (
                  <Flag className="h-5 w-5 text-brand opacity-40" aria-hidden />
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* stars */}
      {puzzle.stars.map((s) => {
        const got = collected.has(keyOf(s.x, s.y));
        return (
          <div
            key={keyOf(s.x, s.y)}
            className="absolute flex items-center justify-center transition-transform"
            style={{
              left: `${s.x * cellPct}%`,
              top: `${s.y * rowPct}%`,
              width: `${cellPct}%`,
              height: `${rowPct}%`,
            }}
          >
            <Star
              className={`h-6 w-6 fill-sunburst text-sunburst transition-all duration-300 ${
                got ? "scale-50 opacity-20" : "animate-pulse"
              }`}
              aria-hidden
            />
          </div>
        );
      })}

      {/* Robo */}
      <motion.div
        className="absolute flex items-center justify-center p-1"
        style={{ width: `${cellPct}%`, height: `${rowPct}%` }}
        animate={{
          left: `${frame.x * cellPct}%`,
          top: `${frame.y * rowPct}%`,
          rotate: frame.bumped ? [0, -8, 8, 0] : 0,
        }}
        initial={false}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="relative grid h-full w-full place-items-center rounded-xl bg-brand text-white shadow-md">
          <Bot className="h-5 w-5" aria-hidden />
          <span
            className="absolute"
            style={{
              transform: `rotate(${DIR_DEG[frame.dir]}deg) translateY(-140%)`,
            }}
          >
            <ChevronUp className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </motion.div>
    </div>
  );
}
