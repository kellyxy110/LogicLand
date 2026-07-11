"use client";
// Keyboard Kingdom — the typing game. The child types each token (a key, word,
// or sentence); correct keys light up green, the next key glows, and misses
// wobble kindly but never end the run. A tap-able on-screen keyboard means it
// plays on a tablet with no physical keyboard, while physical keys work too.
// One level at a time, wrapped by LeveledGame for the 8-level ladder + stars.
import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { recordTyping } from "@/app/actions/typing";
import { classifyKey, expectedChar, starForTyping } from "@/lib/engines/typing";
import type { KeyQuestData, KeyQuestLevel } from "@/types/game";
import { GameSpeech, ProgressDots } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

/** What a single cleared level reports for the typing dashboards. */
export interface TypingRun {
  keysTyped: number;
  correctKeys: number;
  mistakes: number;
  wpm: number;
}

interface KeyboardQuestProps {
  slug: string;
  data: KeyQuestData;
  onWin: (stars: number) => void;
}

export function KeyboardQuest({ slug, data, onWin }: KeyboardQuestProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <KeyboardQuestLevel
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
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["a", "b", "c", "d", "e", "f", "g"],
  ["h", "i", "j", "k", "l", "m", "n"],
  ["o", "p", "q", "r", "s", "t", "u"],
  ["v", "w", "x", "y", "z"],
];

function KeyboardQuestLevel({
  content,
  onComplete,
}: {
  content: KeyQuestLevel;
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

  const target = content.targets[targetIdx] ?? "";
  const want = expectedChar(target, pos); // next character (or null)

  const press = useCallback(
    (key: string) => {
      if (finished.current) return;
      if (key === "Backspace") {
        setPos((p) => Math.max(0, p - 1));
        return;
      }
      const outcome = classifyKey(target, pos, key);
      if (outcome === "ignore") return;
      // Start the clock on the first real keystroke of the level.
      if (startRef.current === null) startRef.current = Date.now();
      if (outcome === "miss") {
        mistakesRef.current += 1;
        setMistakes((m) => m + 1);
        setWrong(true);
        window.setTimeout(() => setWrong(false), 220);
        return;
      }
      setWrong(false);
      correctRef.current += 1;
      if (outcome === "advance") {
        setPos((p) => p + 1);
        return;
      }
      // "complete": this token is done.
      if (targetIdx + 1 >= content.targets.length) {
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
    [target, pos, targetIdx, content, onComplete],
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

  const typed = target.slice(0, pos);
  const speech = wrong ? "Oops — try that key again!" : content.prompt;

  return (
    <div className="space-y-5">
      <ProgressDots total={content.targets.length} current={targetIdx} />
      <GameSpeech text={speech} mood={wrong ? "thinking" : "idle"} />

      {/* The token to type: typed part green, next key glowing, rest faded. */}
      <div
        className="grid min-h-[4.5rem] place-items-center rounded-3xl bg-brand/5 p-4"
        role="status"
        aria-live="polite"
      >
        <p className="flex flex-wrap items-center justify-center gap-0.5 font-mono text-3xl font-extrabold sm:text-4xl">
          {target.split("").map((ch, i) => {
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
          ? `Next key: ${want === " " ? "space" : want}. You have typed ${typed}.`
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
          ? "Type it all with no misses for a bonus star!"
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
