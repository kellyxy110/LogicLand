"use client";
// LeveledGame — the shared engine that turns any single-level tap game into a
// 7-level learning ladder. It owns level state, unlock/resume/replay logic,
// per-level persistence, and mission mastery. Each game just supplies a
// `renderLevel(content, onComplete)` that plays ONE level and reports its stars.
//
// Flow: resume at the last unfinished level → play → record stars → advance.
// Finishing the final level (so every level is cleared) fires the mission
// `onWin`, which is where the server-authoritative reward + mastery badge come
// from. Revisiting an already-mastered game never re-fires it.
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  allLevelsComplete,
  currentLevelIndex,
  totalStars,
} from "@/lib/engines/level-progress";
import type { GameLevel } from "@/types/game";
import { GameSpeech } from "./GameSpeech";
import { LevelMap } from "./LevelMap";
import { useLevelProgress } from "./useLevelProgress";

interface LeveledGameProps<C> {
  slug: string;
  levels: GameLevel<C>[];
  onWin: (stars: number) => void;
  /** Render one level's board. Call `onComplete(stars)` when it's cleared. */
  renderLevel: (content: C, onComplete: (stars: number) => void) => ReactNode;
}

export function LeveledGame<C>({
  slug,
  levels,
  onWin,
  renderLevel,
}: LeveledGameProps<C>) {
  const { progress, ready, record } = useLevelProgress(slug);
  const [active, setActive] = useState(0);
  const [justCleared, setJustCleared] = useState<{ stars: number } | null>(null);

  // Resume at the last unfinished level once the saved progress is known. Guard
  // so we only auto-jump on first hydration, never after the learner navigates.
  const resumed = useRef(false);
  // If the whole game is already mastered on entry, don't re-celebrate it.
  const firedMastery = useRef(false);
  useEffect(() => {
    if (!ready || resumed.current) return;
    resumed.current = true;
    const start = currentLevelIndex(levels, progress);
    setActive(Math.min(start, levels.length - 1));
    if (allLevelsComplete(levels, progress)) firedMastery.current = true;
  }, [ready, progress, levels]);

  const level = levels[active];

  function handleLevelComplete(stars: number) {
    if (justCleared) return; // ignore double-fires within a level
    record(level.id, stars);
    setJustCleared({ stars });
  }

  // "Next level" advances to the first still-unfinished level. By the time this
  // button is visible, `progress` has re-rendered with the just-saved record, so
  // currentLevelIndex points past the level we just cleared.
  function handleContinue() {
    setJustCleared(null);
    const nextIndex = currentLevelIndex(levels, progress);
    if (nextIndex >= levels.length) return; // mastery handled by the effect
    setActive(Math.min(nextIndex, levels.length - 1));
  }

  // Fire mission mastery exactly once, when the last level gets cleared.
  useEffect(() => {
    if (!ready) return;
    if (allLevelsComplete(levels, progress) && !firedMastery.current) {
      firedMastery.current = true;
      onWin(totalStars(levels, progress));
    }
  }, [ready, progress, levels, onWin]);

  if (!ready || !level) {
    return (
      <div className="grid h-40 place-items-center text-sm opacity-50">
        Loading your levels…
      </div>
    );
  }

  const mastered = allLevelsComplete(levels, progress);

  return (
    <div className="space-y-4">
      <LevelMap
        levels={levels}
        progress={progress}
        activeIndex={active}
        onSelect={(i) => {
          setJustCleared(null);
          setActive(i);
        }}
      />

      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">
          Level {active + 1} · {level.title}
        </p>
        <p className="text-sm font-semibold opacity-70">{level.objective}</p>
      </div>

      {/* Remount the board per level (and per replay) with a fresh key. */}
      <div key={`${level.id}-${progress[level.id]?.attempts ?? 0}`}>
        {renderLevel(level.content, handleLevelComplete)}
      </div>

      <AnimatePresence>
        {justCleared && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl bg-meadow/10 p-4 text-center"
          >
            <p className="font-display text-lg font-extrabold text-meadow">
              Level {active + 1} complete!
              {justCleared.stars > 0 && (
                <Star className="ml-1 inline h-5 w-5 fill-sunburst text-sunburst" aria-hidden />
              )}
            </p>
            {mastered ? (
              <GameSpeech text="You mastered every level! You're amazing!" mood="happy" />
            ) : (
              <button
                type="button"
                onClick={handleContinue}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand px-5 py-2 font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
              >
                Next level <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
