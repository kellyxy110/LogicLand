"use client";
// Pattern Builder — complete the pattern by filling the missing piece. This is
// the seed of loops: seeing that "🔴🔵🔴🔵…" repeats with structure. Wrong picks
// wobble and invite another try; finishing all rounds fires onWin.
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  PATTERN_BLANK,
  patternBlankIndex,
  patternCorrect,
  starForMistakes,
} from "@/lib/engines/minigames";
import type { PatternBuilderData } from "@/types/game";
import { GameSpeech, ProgressDots } from "./GameSpeech";

interface PatternBuilderProps {
  slug: string;
  data: PatternBuilderData;
  onWin: (stars: number) => void;
}

export function PatternBuilder({ data, onWin }: PatternBuilderProps) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [filled, setFilled] = useState(false);
  const [done, setDone] = useState(false);
  const mistakes = useRef(0);

  const current = data.rounds[round];
  const blank = patternBlankIndex(current);

  const speech = done
    ? "You finished every pattern! 🎉"
    : wrong
      ? "Hmm, look at the pattern again!"
      : "What comes next in the pattern?";

  function choose(option: string) {
    if (done || filled) return;
    if (patternCorrect(current, option)) {
      setWrong(null);
      setFilled(true);
      // Let the filled pattern show for a beat, then advance.
      window.setTimeout(() => {
        if (round + 1 >= data.rounds.length) {
          setDone(true);
          onWin(starForMistakes(mistakes.current, 1));
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
      <ProgressDots total={data.rounds.length} current={done ? data.rounds.length : round} />
      <GameSpeech text={speech} mood={done ? "happy" : wrong ? "thinking" : "idle"} />

      {/* The pattern strip */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {current.sequence.map((item, i) => {
          const isBlank = i === blank;
          return (
            <div
              key={i}
              className={`grid h-16 w-16 place-items-center rounded-2xl text-4xl ${
                isBlank
                  ? filled || done
                    ? "bg-meadow/20"
                    : "border-2 border-dashed border-brand/40 bg-brand/5"
                  : "bg-black/5 dark:bg-white/10"
              }`}
            >
              <span aria-hidden>
                {isBlank ? (filled || done ? current.answer : PATTERN_BLANK) : item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Palette */}
      {!done && (
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
      )}
    </div>
  );
}
