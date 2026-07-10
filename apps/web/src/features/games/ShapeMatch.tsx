"use client";
// Shape Match — tap the shape that matches the target. Pure pattern recognition,
// the gentlest first "thinking" game. Wrong taps wobble kindly and never end the
// game; the child keeps trying. The game is a 7-level ladder (LeveledGame); this
// file plays ONE level and reports its stars when every round is matched.
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { shapeMatchCorrect, starForMistakes } from "@/lib/engines/minigames";
import type { ShapeMatchData, ShapeMatchLevel } from "@/types/game";
import { GameSpeech, ProgressDots } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

interface ShapeMatchProps {
  slug: string;
  data: ShapeMatchData;
  onWin: (stars: number) => void;
}

export function ShapeMatch({ slug, data, onWin }: ShapeMatchProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <ShapeMatchLevel content={content} onComplete={onComplete} />
      )}
    />
  );
}

function ShapeMatchLevel({
  content,
  onComplete,
}: {
  content: ShapeMatchLevel;
  onComplete: (stars: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const mistakesRef = useRef(0);
  const finished = useRef(false);

  const current = content.rounds[round];
  const speech = wrong ? "Not quite — try another!" : content.prompt;

  function choose(option: string) {
    if (finished.current) return;
    if (shapeMatchCorrect(current, option)) {
      setWrong(null);
      if (round + 1 >= content.rounds.length) {
        finished.current = true;
        onComplete(starForMistakes(mistakesRef.current, 1));
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
      <ProgressDots total={content.rounds.length} current={round} />
      <GameSpeech text={speech} mood={wrong ? "thinking" : "idle"} />

      {/* Target */}
      <div className="grid place-items-center">
        <div className="grid h-28 w-28 place-items-center rounded-3xl bg-brand/10 text-7xl shadow-inner">
          <motion.span key={round} initial={{ scale: 0.6 }} animate={{ scale: 1 }} aria-hidden>
            {current.target}
          </motion.span>
        </div>
      </div>

      {/* Options */}
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

      {mistakes === 0 && (
        <p className="text-center text-xs font-semibold text-meadow">
          Match them all with no misses for a bonus star!
        </p>
      )}
    </div>
  );
}
