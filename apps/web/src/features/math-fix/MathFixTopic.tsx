"use client";
// Math Fix™ — the linear-equations practice experience. It embodies the flagship
// promise: when an answer is wrong it names the *exact* misconception and repairs
// the idea, then adapts the next question to the child's mastery. All the logic
// is the pure engine (lib/engines/math-fix); this component is just the friendly
// face + session persistence (localStorage — no account or DB needed for v0.1).
import { Button, Card, RoboAvatar } from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Delete,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type Diagnosis,
  type MasteryState,
  type Problem,
  START_MASTERY,
  accuracyPercent,
  afterAttempt,
  diagnose,
  generateProblem,
  masteryPercent,
  renderProblem,
} from "@/lib/engines/math-fix";

const STORAGE_KEY = "mathfix:linear-equations:v1";

function loadMastery(): MasteryState {
  if (typeof window === "undefined") return START_MASTERY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return START_MASTERY;
    return { ...START_MASTERY, ...JSON.parse(raw) };
  } catch {
    return START_MASTERY;
  }
}

function saveMastery(state: MasteryState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy-mode errors — practice still works in-session */
  }
}

export function MathFixTopic() {
  const [mastery, setMastery] = useState<MasteryState>(START_MASTERY);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate saved mastery, then pose the first problem at that difficulty.
  useEffect(() => {
    const saved = loadMastery();
    setMastery(saved);
    setProblem(generateProblem(saved.difficulty));
  }, []);

  const submit = useCallback(() => {
    if (!problem || result) return;
    const trimmed = input.trim();
    if (trimmed === "" || trimmed === "-") return;
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return;
    const d = diagnose(problem, value);
    setResult(d);
    setShowSteps(false);
    setMastery((prev) => {
      const next = afterAttempt(prev, d.correct);
      saveMastery(next);
      return next;
    });
  }, [problem, result, input]);

  const nextProblem = useCallback(() => {
    setResult(null);
    setInput("");
    setShowSteps(false);
    setProblem(generateProblem(mastery.difficulty));
    inputRef.current?.focus();
  }, [mastery.difficulty]);

  const equation = useMemo(() => (problem ? renderProblem(problem) : ""), [problem]);
  const percent = masteryPercent(mastery);

  if (!problem) {
    return <div className="grid h-40 place-items-center text-sm opacity-50">Loading Math Fix…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Mastery + stats */}
      <Card>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-1.5 text-brand">
            <Target className="h-4 w-4" /> Mastery
          </span>
          <span className="opacity-70">
            Level {mastery.difficulty} · {accuracyPercent(mastery)}% accurate
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500"
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        {mastery.mastered && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-meadow">
            <Sparkles className="h-4 w-4" /> Topic mastered — brilliant!
          </p>
        )}
      </Card>

      {/* The equation */}
      <Card className="text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">
          Solve for x
        </p>
        <p className="mt-2 font-mono text-4xl font-extrabold sm:text-5xl">{equation}</p>

        <div className="mx-auto mt-5 flex max-w-xs items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-brand/20 px-3 py-2 focus-within:border-brand">
            <span className="font-mono text-2xl font-bold opacity-60">x =</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && (result ? nextProblem() : submit())}
              inputMode="numeric"
              aria-label="Your answer for x"
              disabled={!!result}
              className="w-full bg-transparent font-mono text-2xl font-bold outline-none"
              placeholder="?"
            />
          </div>
        </div>

        {/* On-screen keypad (touch-friendly) */}
        {!result && (
          <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0", "⌫"].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === "⌫") setInput((s) => s.slice(0, -1));
                  else if (k === "-") setInput((s) => (s.startsWith("-") ? s : "-" + s));
                  else setInput((s) => s + k);
                }}
                className="grid h-11 place-items-center rounded-xl border-2 border-brand/15 bg-white text-xl font-bold text-brand transition-colors hover:border-brand/40 dark:bg-white/10"
                aria-label={k === "⌫" ? "Delete" : `Digit ${k}`}
              >
                {k === "⌫" ? <Delete className="h-5 w-5" aria-hidden /> : k}
              </button>
            ))}
          </div>
        )}

        {!result ? (
          <Button size="lg" className="mt-4 w-full max-w-xs" onClick={submit}>
            Check my answer
          </Button>
        ) : (
          <Button size="lg" className="mt-4 w-full max-w-xs" onClick={nextProblem}>
            Next question <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </Card>

      {/* Feedback — the heart of Math Fix */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.correct ? "right" : "wrong"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {result.correct ? (
              <Card className="border-2 border-meadow/40 bg-meadow/5">
                <p className="flex items-center gap-2 font-display text-lg font-extrabold text-meadow">
                  <CheckCircle2 className="h-6 w-6" /> Correct! x = {result.correctAnswer}
                </p>
                <p className="mt-1 text-sm opacity-75">
                  {mastery.streak === 0 && mastery.difficulty > 1
                    ? "Great streak — moving you up a level!"
                    : "Keep it going — three in a row levels you up."}
                </p>
              </Card>
            ) : (
              <Card className="border-2 border-rose-300/50 bg-rose-50/60 dark:bg-rose-500/5">
                <div className="flex items-start gap-3">
                  <RoboAvatar mood="thinking" size={44} />
                  <div className="min-w-0">
                    {result.misconception ? (
                      <>
                        <p className="font-display text-base font-extrabold text-rose-700 dark:text-rose-300">
                          Let&apos;s repair one idea: {result.misconception.name}
                        </p>
                        <p className="mt-1 text-sm opacity-85">{result.misconception.explain}</p>
                        <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sunburst" />
                          {result.misconception.repair}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-base font-extrabold text-rose-700 dark:text-rose-300">
                          Not quite — let&apos;s look at it together.
                        </p>
                        <p className="mt-1 text-sm opacity-85">
                          The answer is x = {result.correctAnswer}. Walk through the steps
                          below and see where it went a different way.
                        </p>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowSteps((s) => !s)}
                      className="mt-3 text-sm font-bold text-brand hover:underline"
                    >
                      {showSteps ? "Hide the steps" : "Show me the steps"}
                    </button>

                    <AnimatePresence>
                      {showSteps && (
                        <motion.ol
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1.5 overflow-hidden text-sm"
                        >
                          {result.steps.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="font-bold text-brand">{i + 1}.</span>
                              <span className="opacity-85">{s}</span>
                            </li>
                          ))}
                        </motion.ol>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
