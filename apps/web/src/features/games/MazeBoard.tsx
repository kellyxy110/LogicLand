"use client";
// The maze board — a themed grid with Robo gliding across it. Pure presentation:
// it draws whatever RobotState you give it and animates position changes with
// Framer Motion. The engine decides *where* Robo is; the board only shows it.
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Droplet,
  Gift,
  Mountain,
  Sparkles,
  Star,
  TreePine,
  Trophy,
} from "lucide-react";
import type { CellKind, MazeConfig, RobotState } from "@/types/game";

/** Icon + tint for each terrain cell. `empty` renders nothing. */
const TERRAIN: Record<CellKind, { icon: LucideIcon; className: string } | null> = {
  empty: null,
  tree: { icon: TreePine, className: "text-emerald-600" },
  rock: { icon: Mountain, className: "text-slate-500" },
  water: { icon: Droplet, className: "text-sky-500" },
  star: { icon: Star, className: "text-sunburst" },
  treasure: { icon: Gift, className: "text-brand" },
};

const FACING_ARROW: Record<RobotState["facing"], LucideIcon> = {
  N: ArrowUp,
  E: ArrowRight,
  S: ArrowDown,
  W: ArrowLeft,
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
            const terrain = TERRAIN[cell];
            return (
              <div
                key={key}
                className="grid place-items-center rounded-xl bg-white/40 dark:bg-white/5"
              >
                {cell === "star" ? (
                  collected ? (
                    <Sparkles className="h-[clamp(1rem,6vw,2rem)] w-[clamp(1rem,6vw,2rem)] text-slate-400 opacity-40" aria-hidden />
                  ) : (
                    <Star className="h-[clamp(1rem,6vw,2rem)] w-[clamp(1rem,6vw,2rem)] animate-pulse fill-sunburst text-sunburst" aria-hidden />
                  )
                ) : cell === "treasure" ? (
                  <motion.span
                    animate={won ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : {}}
                    transition={{ repeat: won ? Infinity : 0, duration: 0.9 }}
                    aria-hidden
                  >
                    {won ? (
                      <Trophy className="h-[clamp(1rem,6vw,2rem)] w-[clamp(1rem,6vw,2rem)] fill-sunburst/30 text-sunburst" />
                    ) : (
                      <Gift className="h-[clamp(1rem,6vw,2rem)] w-[clamp(1rem,6vw,2rem)] text-brand" />
                    )}
                  </motion.span>
                ) : terrain ? (
                  <terrain.icon
                    className={`h-[clamp(1rem,6vw,2rem)] w-[clamp(1rem,6vw,2rem)] ${terrain.className}`}
                    aria-hidden
                  />
                ) : null}
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
        <div className="relative grid place-items-center">
          <Bot
            className="h-[clamp(1.2rem,7vw,2.4rem)] w-[clamp(1.2rem,7vw,2.4rem)] text-brand"
            aria-hidden
          />
          {(() => {
            const Arrow = FACING_ARROW[robot.facing];
            return (
              <Arrow
                className="absolute -right-1 -top-1 h-3 w-3 text-brand"
                aria-label={`facing ${robot.facing}`}
              />
            );
          })()}
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
