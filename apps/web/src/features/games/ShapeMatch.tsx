"use client";
// Shape Match — tap the shape that matches the target. Pure pattern recognition,
// the gentlest first "thinking" game. Wrong taps wobble kindly and never end the
// game; the child keeps trying. Finishing all rounds fires onWin.
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { shapeMatchCorrect, starForMistakes } from "@/lib/engines/minigames";
import type { ShapeMatchData } from "@/types/game";
import { GameSpeech, ProgressDots } from "./GameSpeech";

interface ShapeMatchProps {
  slug: string;
  data: ShapeMatchData;
  onWin: (stars: number) => void;
}

export function ShapeMatch({ data, onWin }: ShapeMatchProps) {
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mistakesRef = useRef(0);

  const current = data.rounds[round];
  const speech = done
    ? "You matched them all! 🎉"
    : wrong
      ? "Not quite — try another!"
      : data.prompt;

  function choose(option: string) {
    if (done) return;
    if (shapeMatchCorrect(current, option)) {
      setWrong(null);
      if (round + 1 >= data.rounds.length) {
        setDone(true);
        onWin(starForMistakes(mistakesRef.current, 1));
      } else {
        setRound((r) => r + 1);
      }
    } else {
      mistakesRef.current += 1;
      setMistakes((m) => m + 1);
      setWrong(option);
    }
  }

  return (
    <div className="space-y-5">
      <ProgressDots total={data.rounds.length} current={done ? data.rounds.length : round} />
      <GameSpeech text={speech} mood={done ? "happy" : wrong ? "thinking" : "idle"} />

      {/* Target */}
      <div className="grid place-items-center">
        <div className="grid h-28 w-28 place-items-center rounded-3xl bg-brand/10 text-7xl shadow-inner">
          <motion.span key={round} initial={{ scale: 0.6 }} animate={{ scale: 1 }} aria-hidden>
            {done ? "🏆" : current.target}
          </motion.span>
        </div>
      </div>

      {/* Options */}
      {!done && (
        <div className="flex flex-wrap justify-center gap-3">
          {current.options.map((option, i) => (
            <motion.button
              key={`${round}-${i}`}
              type="button"
              onClick={() => choose(option)}
              aria-label={`Choose ${option}`}
              whileTap={{ scale: 0.9 }}
              animate={wrong === option ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-brand/20 bg-white text-5xl shadow-sm hover:border-brand/50 dark:bg-white/10"
            >
              <span aria-hidden>{option}</span>
            </motion.button>
          ))}
        </div>
      )}

      {mistakes === 0 && !done && (
        <p className="text-center text-xs font-semibold text-meadow">
          Match them all with no misses for a bonus star! ⭐
        </p>
      )}
    </div>
  );
}
