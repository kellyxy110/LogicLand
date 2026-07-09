"use client";
// The maze board — a themed grid with Robo gliding across it. Pure presentation:
// it draws whatever RobotState you give it and animates position changes with
// Framer Motion. The engine decides *where* Robo is; the board only shows it.
import { motion } from "framer-motion";
import type { CellKind, MazeConfig, RobotState } from "@/types/game";

const TERRAIN: Record<CellKind, string> = {
  empty: "",
  tree: "🌲",
  rock: "🪨",
  water: "💧",
  star: "⭐",
  treasure: "🎁",
};

const FACING_ARROW: Record<RobotState["facing"], string> = {
  N: "⬆️",
  E: "➡️",
  S: "⬇️",
  W: "⬅️",
};

interface MazeBoardProps {
  maze: MazeConfig;
  robot: RobotState;
  /** "x,y" keys of stars Robo has already collected (drawn as sparkles). */
  visitedStars: ReadonlySet<string>;
  /** Pulse the treasure when the mission is won. */
  won?: boolean;
}

export function MazeBoard({ maze, robot, visitedStars, won }: MazeBoardProps) {
  const cellPct = 100 / maze.cols;
  const rowPct = 100 / maze.rows;

  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border-4 border-emerald-200 bg-gradient-to-br from-emerald-100 to-lime-100 p-2 shadow-inner dark:border-emerald-500/30 dark:from-emerald-900/40 dark:to-green-900/30"
      style={{ aspectRatio: `${maze.cols} / ${maze.rows}` }}
      role="img"
      aria-label="Robot maze board"
    >
      {/* Terrain grid */}
      <div
        className="grid h-full w-full gap-1"
        style={{
          gridTemplateColumns: `repeat(${maze.cols}, 1fr)`,
          gridTemplateRows: `repeat(${maze.rows}, 1fr)`,
        }}
      >
        {maze.grid.flatMap((row, y) =>
          row.map((cell, x) => {
            const key = `${x},${y}`;
            const collected = cell === "star" && visitedStars.has(key);
            return (
              <div
                key={key}
                className="grid place-items-center rounded-xl bg-white/40 text-[clamp(1rem,6vw,2rem)] dark:bg-white/5"
              >
                {cell === "star" ? (
                  <span className={collected ? "opacity-25 grayscale" : "animate-pulse"}>
                    {collected ? "✨" : "⭐"}
                  </span>
                ) : cell === "treasure" ? (
                  <motion.span
                    animate={won ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : {}}
                    transition={{ repeat: won ? Infinity : 0, duration: 0.9 }}
                  >
                    {won ? "🏆" : TERRAIN.treasure}
                  </motion.span>
                ) : (
                  <span aria-hidden>{TERRAIN[cell]}</span>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Robo — absolutely positioned, glides between cells */}
      <motion.div
        className="pointer-events-none absolute grid place-items-center"
        style={{ width: `${cellPct}%`, height: `${rowPct}%` }}
        initial={false}
        animate={{ left: `${robot.x * cellPct}%`, top: `${robot.y * rowPct}%` }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="relative grid place-items-center text-[clamp(1.2rem,7vw,2.4rem)]">
          <span aria-hidden>🤖</span>
          <span
            className="absolute -right-0.5 -top-1 text-[0.6em]"
            aria-label={`facing ${robot.facing}`}
          >
            {FACING_ARROW[robot.facing]}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/** Derive which stars Robo has stepped on across frames 0..upTo (inclusive). */
export function visitedStarKeys(
  maze: MazeConfig,
  path: ReadonlyArray<{ robot: RobotState }>,
  upTo: number,
): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i <= upTo && i < path.length; i++) {
    const { x, y } = path[i].robot;
    if (maze.grid[y]?.[x] === "star") keys.add(`${x},${y}`);
  }
  return keys;
}
