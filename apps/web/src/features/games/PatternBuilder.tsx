"use client";
// Pattern Builder — complete the pattern by filling the missing piece. This is
// the seed of loops: seeing that "🔴🔵🔴🔵…" repeats with structure. Wrong picks
// wobble and invite another try. A 7-level ladder (LeveledGame); this file plays
// ONE level and reports its stars when every pattern is solved.
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  PATTERN_BLANK,
  patternBlankIndex,
  patternCorrect,
  starForMistakes,
} from "@/lib/engines/minigames";
import type { PatternBuilderData, PatternLevel } from "@/types/game";
import { GameSpeech, ProgressDots } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

interface PatternBuilderProps {
  slug: string;
  data: PatternBuilderData;
  onWin: (stars: number) => void;
}

export function PatternBuilder({ slug, data, onWin }: PatternBuilderProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <PatternLevelBoard content={content} onComplete={onComplete} />
      )}
    />
  );
}

function PatternLevelBoard({
  content,
  onComplete,
}: {
  content: PatternLevel;
  onComplete: (stars: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [filled, setFilled] = useState(false);
  const mistakes = useRef(0);
  const finished = useRef(false);

  const current = content.rounds[round];
  const blank = patternBlankIndex(current);

  const speech = wrong
    ? "Hmm, look at the pattern again!"
    : "What comes next in the pattern?";

  function choose(option: string) {
    if (finished.current || filled) return;
    if (patternCorrect(current, option)) {
      setWrong(null);
      setFilled(true);
      // Let the filled pattern show for a beat, then advance.
      window.setTimeout(() => {
        if (round + 1 >= content.rounds.length) {
          finished.current = true;
          onComplete(starForMistakes(mistakes.current, 1));
        } else {
          setRound((r) => r + 1);
          setFilled(false);
        }
      }, 650);
    } else {
      mistakes.current += 1;
      setWrong(option);
    }
  }

  return (
    <div className="space-y-5">
      <ProgressDots total={content.rounds.length} current={round} />
      <GameSpeech text={speech} mood={wrong ? "thinking" : "idle"} />

      {/* The pattern strip */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {current.sequence.map((item, i) => {
          const isBlank = i === blank;
          return (
            <div
              key={i}
              className={`grid h-16 w-16 place-items-center rounded-2xl text-4xl ${
                isBlank
                  ? filled
                    ? "bg-meadow/20"
                    : "border-2 border-dashed border-brand/40 bg-brand/5"
                  : "bg-black/5 dark:bg-white/10"
              }`}
            >
              <span aria-hidden>
                {isBlank ? (filled ? current.answer : PATTERN_BLANK) : item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Palette */}
      <div className="flex flex-wrap justify-center gap-3">
        {current.options.map((option, i) => (
          <motion.button
            key={`${round}-${i}`}
            type="button"
            onClick={() => choose(option)}
            disabled={filled}
            aria-label={`Choose ${option}`}
            whileTap={{ scale: 0.9 }}
            animate={wrong === option ? { x: [0, -8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-brand/20 bg-white text-4xl shadow-sm hover:border-brand/50 disabled:opacity-50 dark:bg-white/10"
          >
            <span aria-hidden>{option}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
