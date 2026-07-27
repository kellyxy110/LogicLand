"use client";
// MathLab Sketchpad (Mathematics foundation, ADR-010) — a Visual Math canvas.
// Inspired by PenEcho's "reason on the canvas" idea, but built as our own and
// wired to the DETERMINISTIC Math Fix engine (ADR-015): the learner works a
// problem out by hand on an Excalidraw canvas (embedded, MIT), then the exact
// same misconception diagnosis appears *in place*. No external LLM, so it's
// child-safe by construction. A future "explain another way" layer can route
// through the engine + safety.py.
import { Button, Card, RoboAvatar } from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle2,
  Delete,
  Lightbulb,
  PenLine,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type Diagnosis,
  type PosedProblem,
  MATH_TOPICS,
  mathTopicById,
} from "@/lib/engines/math-fix";

const SketchCanvas = dynamic(() => import("./SketchCanvas").then((m) => m.SketchCanvas), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[24rem] place-items-center text-sm opacity-60">
      Loading the canvas…
    </div>
  ),
});

// A comfortable middle tier so problems are worth sketching, not trivial.
const START_DIFFICULTY = 3;

export function MathSketchpad({ initialTopicId }: { initialTopicId?: string }) {
  const [topicId, setTopicId] = useState(
    initialTopicId && mathTopicById(initialTopicId) ? initialTopicId : MATH_TOPICS[0].id,
  );
  const topic = useMemo(() => mathTopicById(topicId), [topicId]);
  const [problem, setProblem] = useState<PosedProblem | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  // Bump to clear the canvas when a new problem is posed.
  const [canvasKey, setCanvasKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pose = useCallback(() => {
    if (!topic) return;
    setResult(null);
    setInput("");
    setShowSteps(false);
    setProblem(topic.generate(START_DIFFICULTY));
    setCanvasKey((k) => k + 1);
  }, [topic]);

  useEffect(() => {
    pose();
  }, [pose]);

  const submit = useCallback(() => {
    if (!problem || result) return;
    const trimmed = input.trim();
    if (trimmed === "" || trimmed === "-") return;
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return;
    setResult(problem.diagnose(value));
    setShowSteps(false);
  }, [problem, result, input]);

  const isEquation = problem?.instruction === "Solve for x";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <PenLine className="h-5 w-5 text-rose-500" />
        <h1 className="font-display text-xl font-extrabold sm:text-2xl">Math Sketchpad</h1>
        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">
          MathLab
        </span>
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
          <span className="opacity-60">Topic</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="rounded-lg border-2 border-brand/20 bg-transparent px-2 py-1 text-sm font-semibold outline-none focus:border-brand"
          >
            {MATH_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* The working canvas */}
        <div className="min-h-[24rem] overflow-hidden rounded-2xl border-2 border-brand/15 lg:h-[70vh]">
          <SketchCanvas key={canvasKey} />
        </div>

        {/* Problem + in-place feedback */}
        <div className="space-y-4">
          <Card className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">
              {problem?.instruction ?? "Work it out"}
            </p>
            <p className="mt-2 font-mono text-3xl font-extrabold sm:text-4xl">
              {problem?.prompt ?? "…"}
            </p>
            <p className="mt-2 text-xs opacity-60">
              Work it out on the canvas, then type your answer.
            </p>

            <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-brand/20 px-3 py-2 focus-within:border-brand">
                <span className="font-mono text-2xl font-bold opacity-60">
                  {isEquation ? "x =" : "="}
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && (result ? pose() : submit())}
                  inputMode="numeric"
                  aria-label="Your answer"
                  disabled={!!result}
                  className="w-full bg-transparent font-mono text-2xl font-bold outline-none"
                  placeholder="?"
                />
              </div>
            </div>

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
                Check my work
              </Button>
            ) : (
              <Button size="lg" className="mt-4 w-full max-w-xs" onClick={pose}>
                New problem <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </Card>

          <AnimatePresence mode="wait">
            {result && problem && (
              <motion.div
                key={result.correct ? "right" : "wrong"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {result.correct ? (
                  <Card className="border-2 border-meadow/40 bg-meadow/5">
                    <p className="flex items-center gap-2 font-display text-lg font-extrabold text-meadow">
                      <CheckCircle2 className="h-6 w-6" /> Correct!{" "}
                      {isEquation ? "x = " : ""}
                      {result.correctAnswer}
                    </p>
                    <p className="mt-1 text-sm opacity-75">
                      Nice working — try another to keep the streak going.
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
                            <p className="mt-1 text-sm opacity-85">
                              {result.misconception.explain}
                            </p>
                            <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold">
                              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sunburst" />
                              {result.misconception.repair}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-display text-base font-extrabold text-rose-700 dark:text-rose-300">
                              Not quite — let&apos;s look together.
                            </p>
                            <p className="mt-1 text-sm opacity-85">
                              The answer is {isEquation ? "x = " : ""}
                              {result.correctAnswer}. Check the steps below against your
                              working on the canvas.
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
      </div>
    </main>
  );
}
