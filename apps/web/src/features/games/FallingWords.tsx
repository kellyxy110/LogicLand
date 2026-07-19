"use client";
// Falling Words (Word Rain) — a typing mini-game for Keyboard Kingdom. One word
// drifts down at a time; type it fully (letter by letter) before it lands to
// catch it. Landing is gentle — the word just touches the ground and the next
// one falls; nobody "loses". A tap-able on-screen keyboard means it plays on a
// tablet too. Wrapped by LeveledGame for the 12-level ladder, stars, resume and
// persistence, and it reports each cleared level to the typing dashboards.
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { recordTyping } from "@/app/actions/typing";
import { classifyKey, expectedChar, starForTyping } from "@/lib/engines/typing";
import type { FallingWordsData, FallingWordsLevel } from "@/types/game";
import type { TypingRun } from "./KeyboardQuest";
import { GameSpeech, ProgressDots } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

interface FallingWordsProps {
  slug: string;
  data: FallingWordsData;
  onWin: (stars: number) => void;
}

export function FallingWords({ slug, data, onWin }: FallingWordsProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <FallingWordsLevelBoard
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

const DROP_COLORS = [
  "from-sky-400 to-blue-600",
  "from-violet-400 to-fuchsia-600",
  "from-emerald-400 to-green-600",
  "from-amber-300 to-orange-500",
  "from-rose-400 to-pink-600",
];

function FallingWordsLevelBoard({
  content,
  onComplete,
}: {
  content: FallingWordsLevel;
  onComplete: (stars: number, run: TypingRun) => void;
}) {
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(0);
  const [landed, setLanded] = useState(0);
  const [caught, setCaught] = useState(false); // catch flash for the current word
  const [wrong, setWrong] = useState(false);

  const resolving = useRef(false);
  const finished = useRef(false);
  const landedRef = useRef(0);
  const correctRef = useRef(0);
  const mistakesRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const word = content.words[index] ?? "";
  const want = expectedChar(word, pos); // next character to type (or null)

  // Each new word is a fresh, unresolved round.
  useEffect(() => {
    resolving.current = false;
    setPos(0);
    setCaught(false);
    setWrong(false);
  }, [index]);

  const advance = useCallback(() => {
    if (index + 1 >= content.words.length) {
      finished.current = true;
      const minutes = Math.max(
        (Date.now() - (startRef.current ?? Date.now())) / 60000,
        1 / 60000, // guard against divide-by-zero on an instant clear
      );
      const wpm = correctRef.current / 5 / minutes;
      onComplete(starForTyping(landedRef.current, content.starThreshold), {
        keysTyped: correctRef.current + mistakesRef.current,
        correctKeys: correctRef.current,
        mistakes: mistakesRef.current,
        wpm,
      });
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, content, onComplete]);

  // Resolve the current word: caught (typed in time) or landed (fell past).
  const resolve = useCallback(
    (didCatch: boolean) => {
      if (resolving.current || finished.current) return;
      resolving.current = true;
      if (didCatch) {
        setCaught(true);
      } else {
        landedRef.current += 1;
        setLanded((n) => n + 1);
      }
      window.setTimeout(advance, didCatch ? 280 : 140);
    },
    [advance],
  );

  const press = useCallback(
    (key: string) => {
      if (resolving.current || finished.current) return;
      const outcome = classifyKey(word, pos, key);
      if (outcome === "ignore") return;
      // Start the clock on the first real keystroke of the level.
      if (startRef.current === null) startRef.current = Date.now();
      if (outcome === "miss") {
        mistakesRef.current += 1;
        setWrong(true);
        window.setTimeout(() => setWrong(false), 200);
        return;
      }
      setWrong(false);
      correctRef.current += 1;
      if (outcome === "advance") {
        setPos((p) => p + 1);
      } else {
        // "complete": the whole word is typed — caught before it landed.
        resolve(true);
      }
    },
    [word, pos, resolve],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.length === 1) press(e.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press]);

  const speech = caught
    ? "Caught it! Nice typing!"
    : wrong
      ? "Oops — try that key again!"
      : content.prompt;

  return (
    <div className="space-y-4">
      <ProgressDots total={content.words.length} current={index} />
      <GameSpeech
        text={speech}
        mood={caught ? "happy" : wrong ? "thinking" : "idle"}
      />

      {/* Sky where words rain down onto the ground line. */}
      <div className="relative mx-auto h-64 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-100 to-sky-100 dark:from-indigo-900/40 dark:to-sky-900/40">
        <AnimatePresence>
          {!finished.current && word && (
            <motion.div
              key={index}
              className="absolute left-1/2 -translate-x-1/2"
              initial={{ top: "-14%" }}
              animate={{ top: "84%" }}
              transition={{ duration: content.secondsToFall, ease: "linear" }}
              onAnimationComplete={() => {
                // Reached the ground without being fully typed → it landed.
                if (!caught) resolve(false);
              }}
            >
              <motion.div
                animate={
                  caught ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] } : {}
                }
                transition={{ duration: 0.28 }}
                className={`flex items-center gap-0.5 rounded-2xl bg-gradient-to-br ${
                  DROP_COLORS[index % DROP_COLORS.length]
                } px-3 py-2 font-mono text-2xl font-extrabold shadow-lg`}
              >
                {word.split("").map((ch, i) => {
                  const done = i < pos;
                  const next = i === pos;
                  return (
                    <span
                      key={i}
                      className={`grid min-w-[1ch] place-items-center rounded px-0.5 ${
                        done
                          ? "text-white"
                          : next
                            ? "bg-white/90 text-brand"
                            : "text-white/50"
                      }`}
                    >
                      {ch}
                    </span>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ground line */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-emerald-500/40 to-transparent" />
      </div>

      <p className="sr-only" aria-live="polite">
        {want
          ? `Word ${word}. Next key: ${want}.`
          : "Word caught!"}
      </p>

      {/* On-screen keyboard (touch) — highlights the next key to press. */}
      <div className="mx-auto flex max-w-md flex-col items-center gap-1.5">
        {KEY_ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-1.5">
            {row.map((k) => (
              <motion.button
                key={k}
                type="button"
                onClick={() => press(k)}
                aria-label={`Key ${k}`}
                whileTap={{ scale: 0.88 }}
                className={`grid h-9 w-9 place-items-center rounded-xl border-2 text-base font-bold uppercase transition-colors ${
                  k === (want ?? "").toLowerCase() && want
                    ? "animate-pulse border-brand bg-brand text-white shadow-md"
                    : "border-brand/20 bg-white text-brand hover:border-brand/50 dark:bg-white/10"
                }`}
              >
                {k}
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      <p className="text-center text-xs font-semibold opacity-60">
        {landed === 0
          ? "Catch every word before it lands for a star!"
          : `Landed: ${landed}`}
      </p>
    </div>
  );
}
