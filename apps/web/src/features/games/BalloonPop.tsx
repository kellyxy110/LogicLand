"use client";
// Balloon Pop — an arcade typing mini-game for Keyboard Kingdom. One balloon
// floats up at a time carrying a letter; press that key (or tap it) to pop it
// before it drifts off the top. Missing is gentle — the balloon just floats away
// and the next one rises; nobody "loses". Wrapped by LeveledGame for the ladder,
// stars, resume, and persistence, exactly like the other games.
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { starForTyping, typedChar } from "@/lib/engines/typing";
import type { BalloonPopData, BalloonPopLevel } from "@/types/game";
import { GameSpeech, ProgressDots } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

interface BalloonPopProps {
  slug: string;
  data: BalloonPopData;
  onWin: (stars: number) => void;
}

export function BalloonPop({ slug, data, onWin }: BalloonPopProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <BalloonPopLevelBoard content={content} onComplete={onComplete} />
      )}
    />
  );
}

const KEY_ROWS = [
  ["a", "b", "c", "d", "e", "f", "g"],
  ["h", "i", "j", "k", "l", "m", "n"],
  ["o", "p", "q", "r", "s", "t", "u"],
  ["v", "w", "x", "y", "z"],
];

const BALLOON_COLORS = [
  "from-rose-400 to-pink-600",
  "from-sky-400 to-blue-600",
  "from-amber-300 to-orange-500",
  "from-violet-400 to-fuchsia-600",
  "from-emerald-400 to-green-600",
];

function BalloonPopLevelBoard({
  content,
  onComplete,
}: {
  content: BalloonPopLevel;
  onComplete: (stars: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [escaped, setEscaped] = useState(0);
  const [popped, setPopped] = useState(false); // pop flash for the current balloon
  const resolving = useRef(false);
  const escapedRef = useRef(0);
  const finished = useRef(false);

  const letter = content.letters[index] ?? "";

  // Each new balloon is a fresh, unresolved round.
  useEffect(() => {
    resolving.current = false;
    setPopped(false);
  }, [index]);

  const advance = useCallback(() => {
    if (index + 1 >= content.letters.length) {
      finished.current = true;
      onComplete(starForTyping(escapedRef.current, content.starThreshold));
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, content, onComplete]);

  const resolve = useCallback(
    (didPop: boolean) => {
      if (resolving.current || finished.current) return;
      resolving.current = true;
      if (didPop) {
        setPopped(true);
      } else {
        escapedRef.current += 1;
        setEscaped((e) => e + 1);
      }
      window.setTimeout(advance, didPop ? 260 : 120);
    },
    [advance],
  );

  const press = useCallback(
    (key: string) => {
      if (resolving.current || finished.current) return;
      if (typedChar(key) === letter.toLowerCase()) resolve(true);
    },
    [letter, resolve],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.length === 1) press(e.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press]);

  const speech = popped ? "Pop! Nice one!" : content.prompt;

  return (
    <div className="space-y-4">
      <ProgressDots total={content.letters.length} current={index} />
      <GameSpeech text={speech} mood={popped ? "happy" : "idle"} />

      {/* Sky where balloons rise */}
      <div className="relative mx-auto h-64 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-indigo-100 dark:from-sky-900/40 dark:to-indigo-900/40">
        <AnimatePresence>
          {!finished.current && letter && (
            <motion.div
              key={index}
              className="absolute left-1/2 -translate-x-1/2"
              initial={{ bottom: "-22%" }}
              animate={{ bottom: "112%" }}
              transition={{ duration: content.secondsPerBalloon, ease: "linear" }}
              onAnimationComplete={() => {
                // Reached the top without a pop → it escaped.
                if (!popped) resolve(false);
              }}
            >
              <motion.div
                animate={popped ? { scale: [1, 1.35, 0], opacity: [1, 1, 0] } : {}}
                transition={{ duration: 0.26 }}
                className="flex flex-col items-center"
              >
                <div
                  className={`grid h-20 w-16 place-items-center rounded-[45%] bg-gradient-to-br ${
                    BALLOON_COLORS[index % BALLOON_COLORS.length]
                  } text-3xl font-extrabold uppercase text-white shadow-lg`}
                >
                  {letter}
                </div>
                <div className="h-3 w-0.5 bg-black/20" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* On-screen keyboard (touch) — highlights the balloon's letter. */}
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
                  k === letter.toLowerCase()
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
        {escaped === 0
          ? "Pop them all with none escaping for a star!"
          : `Escaped: ${escaped}`}
      </p>
    </div>
  );
}
