"use client";
// Code Racer — the culminating Keyboard Kingdom game that bridges into Coding
// City. The child types coding keywords; each completed word sends Robo dashing
// further along the track toward the finish flag. Misses wobble kindly but never
// end the run, and stars reward accuracy (few misses), never raw speed. A
// tap-able on-screen keyboard keeps it tablet-friendly. Wrapped by LeveledGame
// for the 12-level ladder + stars + resume, and it feeds the typing dashboards.
import { RoboAvatar } from "@logicland/ui";
import { motion } from "framer-motion";
import { Delete, Flag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { recordTyping } from "@/app/actions/typing";
import { classifyKey, expectedChar, starForTyping } from "@/lib/engines/typing";
import type { CodeRacerData, CodeRacerLevel } from "@/types/game";
import type { TypingRun } from "./KeyboardQuest";
import { GameSpeech, ProgressDots } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

interface CodeRacerProps {
  slug: string;
  data: CodeRacerData;
  onWin: (stars: number) => void;
}

export function CodeRacer({ slug, data, onWin }: CodeRacerProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <CodeRacerLevelBoard
          content={content}
          onComplete={(stars, run) => {
            // Fire-and-forget: never block progression on telemetry.
            void recordTyping(run);
            onComplete(stars);
          }}
        />
      )}
    />
  );
}

// Alphabetical on-screen rows — friendlier for 5–10s than QWERTY.
const KEY_ROWS = [
  ["a", "b", "c", "d", "e", "f", "g"],
  ["h", "i", "j", "k", "l", "m", "n"],
  ["o", "p", "q", "r", "s", "t", "u"],
  ["v", "w", "x", "y", "z"],
];

function CodeRacerLevelBoard({
  content,
  onComplete,
}: {
  content: CodeRacerLevel;
  onComplete: (stars: number, run: TypingRun) => void;
}) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState(false);
  const mistakesRef = useRef(0);
  const correctRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const finished = useRef(false);

  const total = content.words.length;
  const word = content.words[targetIdx] ?? "";
  const want = expectedChar(word, pos); // next character (or null)
  // Robo's position: how many whole words are done (0 → total).
  const progress = targetIdx / total;

  const press = useCallback(
    (key: string) => {
      if (finished.current) return;
      if (key === "Backspace") {
        setPos((p) => Math.max(0, p - 1));
        return;
      }
      const outcome = classifyKey(word, pos, key);
      if (outcome === "ignore") return;
      if (startRef.current === null) startRef.current = Date.now();
      if (outcome === "miss") {
        mistakesRef.current += 1;
        setMistakes((m) => m + 1);
        setWrong(true);
        window.setTimeout(() => setWrong(false), 200);
        return;
      }
      setWrong(false);
      correctRef.current += 1;
      if (outcome === "advance") {
        setPos((p) => p + 1);
        return;
      }
      // "complete": this word is done — Robo dashes forward.
      if (targetIdx + 1 >= total) {
        finished.current = true;
        const minutes = Math.max(
          (Date.now() - (startRef.current ?? Date.now())) / 60000,
          1 / 60000, // guard against divide-by-zero on an instant clear
        );
        const wpm = correctRef.current / 5 / minutes;
        onComplete(starForTyping(mistakesRef.current, content.starThreshold), {
          keysTyped: correctRef.current + mistakesRef.current,
          correctKeys: correctRef.current,
          mistakes: mistakesRef.current,
          wpm,
        });
      } else {
        setTargetIdx((t) => t + 1);
        setPos(0);
      }
    },
    [word, pos, targetIdx, total, content, onComplete],
  );

  // Physical keyboard. Rebinds per keystroke so the closure stays fresh; light.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Backspace") e.preventDefault();
      press(e.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press]);

  const speech = wrong
    ? "Oops — try that key again!"
    : finished.current
      ? "You crossed the finish line!"
      : content.prompt;

  return (
    <div className="space-y-5">
      <ProgressDots total={total} current={targetIdx} />
      <GameSpeech text={speech} mood={wrong ? "thinking" : "idle"} />

      {/* Race track — Robo dashes right one hop per completed word. */}
      <div className="relative mx-auto h-20 w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100 to-emerald-100 dark:from-sky-900/40 dark:to-emerald-900/40">
        {/* dashed lane line */}
        <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-black/15 dark:border-white/15" />
        {/* finish flag */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400">
          <Flag className="h-7 w-7 fill-current" aria-hidden />
        </div>
        {/* Robo racer */}
        <motion.div
          className="absolute top-1/2"
          style={{ left: `calc(6% + ${progress * 78}%)` }}
          animate={{ left: `calc(6% + ${progress * 78}%)` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <div className="-translate-y-1/2">
            <RoboAvatar mood={finished.current ? "happy" : "idle"} size={40} />
          </div>
        </motion.div>
      </div>

      {/* The word to type: typed part green, next key glowing, rest faded. */}
      <div
        className="grid min-h-[4.5rem] place-items-center rounded-3xl bg-brand/5 p-4"
        role="status"
        aria-live="polite"
      >
        <p className="flex flex-wrap items-center justify-center gap-0.5 font-mono text-3xl font-extrabold sm:text-4xl">
          {word.split("").map((ch, i) => {
            const done = i < pos;
            const next = i === pos;
            return (
              <span
                key={i}
                className={`grid min-w-[1ch] place-items-center rounded-lg px-1 ${
                  done
                    ? "text-meadow"
                    : next
                      ? "bg-brand text-white shadow-sm"
                      : "opacity-30"
                }`}
              >
                {ch === " " ? (done || next ? "␣" : "·") : ch}
              </span>
            );
          })}
        </p>
      </div>

      <p className="sr-only">
        {want
          ? `Word ${word}. Next key: ${want === " " ? "space" : want}.`
          : "Word complete!"}
      </p>

      {/* On-screen keyboard (works on touch; highlights the next key). */}
      <div className="mx-auto flex max-w-md flex-col items-center gap-1.5">
        {KEY_ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-1.5">
            {row.map((k) => (
              <Key key={k} label={k} glow={want === k} onPress={() => press(k)} />
            ))}
          </div>
        ))}
        <div className="mt-0.5 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => press(" ")}
            aria-label="Space"
            className={`h-10 w-40 rounded-xl border-2 text-sm font-bold transition-colors ${
              want === " "
                ? "animate-pulse border-brand bg-brand text-white"
                : "border-brand/20 bg-white hover:border-brand/50 dark:bg-white/10"
            }`}
          >
            space
          </button>
          <button
            type="button"
            onClick={() => press("Backspace")}
            aria-label="Backspace"
            className="grid h-10 w-12 place-items-center rounded-xl border-2 border-black/10 bg-white hover:border-black/25 dark:bg-white/10 dark:border-white/15"
          >
            <Delete className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <p className="text-center text-xs font-semibold opacity-60">
        {mistakes === 0
          ? "Race to the finish with no misses for a bonus star!"
          : `Misses: ${mistakes}`}
      </p>
    </div>
  );
}

function Key({
  label,
  glow,
  onPress,
}: {
  label: string;
  glow: boolean;
  onPress: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      aria-label={`Key ${label}`}
      whileTap={{ scale: 0.88 }}
      className={`grid h-9 w-9 place-items-center rounded-xl border-2 text-base font-bold uppercase transition-colors ${
        glow
          ? "animate-pulse border-brand bg-brand text-white shadow-md"
          : "border-brand/20 bg-white text-brand hover:border-brand/50 dark:bg-white/10"
      }`}
    >
      {label}
    </motion.button>
  );
}
