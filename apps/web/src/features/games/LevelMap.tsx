"use client";
// The level ladder: a row of tappable tiles showing each level's status
// (locked / available / completed / mastered). Learners see how far they've come
// and can replay any unlocked level. Locked levels explain what to do first.
import { Lock, Star } from "lucide-react";
import type { GameLevel } from "@/types/game";
import {
  isLevelUnlocked,
  levelStatus,
  type LevelProgress,
} from "@/lib/engines/level-progress";

interface LevelMapProps<C> {
  levels: GameLevel<C>[];
  progress: LevelProgress;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function LevelMap<C>({
  levels,
  progress,
  activeIndex,
  onSelect,
}: LevelMapProps<C>) {
  return (
    <div>
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide opacity-50">
        Levels
      </p>
      <ol className="flex flex-wrap justify-center gap-2">
        {levels.map((level, i) => {
          const status = levelStatus(levels, progress, i);
          const unlocked = isLevelUnlocked(levels, progress, i);
          const active = i === activeIndex;
          const done = status === "completed" || status === "mastered";
          return (
            <li key={level.id}>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onSelect(i)}
                aria-current={active}
                aria-label={
                  unlocked
                    ? `Level ${i + 1}: ${level.title} (${status})`
                    : `Level ${i + 1} locked — finish level ${i} first`
                }
                title={
                  unlocked ? level.title : `Finish level ${i} to unlock this`
                }
                className={[
                  "relative grid h-11 w-11 place-items-center rounded-2xl text-sm font-extrabold transition-transform",
                  active ? "ring-2 ring-brand ring-offset-2 ring-offset-transparent" : "",
                  status === "mastered"
                    ? "bg-meadow text-white"
                    : status === "completed"
                      ? "bg-meadow/30 text-meadow"
                      : status === "available"
                        ? "bg-brand/15 text-brand hover:scale-105"
                        : "cursor-not-allowed bg-black/5 text-black/30 dark:bg-white/10 dark:text-white/30",
                ].join(" ")}
              >
                {status === "locked" ? (
                  <Lock className="h-4 w-4" aria-hidden />
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
                {status === "mastered" && (
                  <Star
                    className="absolute -right-1 -top-1 h-4 w-4 fill-sunburst text-sunburst"
                    aria-hidden
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
