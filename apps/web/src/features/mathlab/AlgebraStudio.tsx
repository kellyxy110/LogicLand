"use client";
// Algebra Studio (ADR-028) — manipulate expressions with confidence. The pure
// engine (lib/engines/algebra) does exact rational-arithmetic simplify/expand/
// factor/solve and returns labelled steps; this component is just a mode
// switcher + input + step list. No eval, no network, no LLM grading — every
// answer is computed, never guessed.
import { Card } from "@logicland/ui";
import { Variable } from "lucide-react";
import { useMemo, useState } from "react";
import { ALGEBRA_PRESETS, expandExpression, factorExpression, simplifyExpression, solveEquation, type OpResult } from "@/lib/engines/algebra";

type Mode = "simplify" | "expand" | "factor" | "solve";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "simplify", label: "Simplify", hint: "3x + 5 - x + 2" },
  { id: "expand", label: "Expand", hint: "(x + 2)(x + 3)" },
  { id: "factor", label: "Factor", hint: "x^2 + 5x + 6" },
  { id: "solve", label: "Solve", hint: "2x + 1 = 7" },
];

function run(mode: Mode, src: string): OpResult {
  switch (mode) {
    case "simplify":
      return simplifyExpression(src);
    case "expand":
      return expandExpression(src);
    case "factor":
      return factorExpression(src);
    case "solve":
      return solveEquation(src);
  }
}

export function AlgebraStudio() {
  const [mode, setMode] = useState<Mode>("simplify");
  const [input, setInput] = useState("3x + 5 - x + 2");

  const result = useMemo(() => run(mode, input), [mode, input]);
  const activeMode = MODES.find((m) => m.id === mode)!;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Variable className="h-5 w-5 text-violet-500" />
        <h1 className="font-display text-2xl font-extrabold">Algebra Studio</h1>
        <span className="text-sm opacity-60">Manipulate expressions with confidence.</span>
      </header>

      {/* Mode tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Algebra operation">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
              mode === m.id
                ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ALGEBRA_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setInput(p.expr)}
            className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
              input === p.expr
                ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <label className="mb-4 block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">
          {mode === "solve" ? "Equation" : "Expression"}
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          className="w-full rounded-lg border-2 border-black/10 bg-transparent px-3 py-2.5 font-mono text-base outline-none focus:border-violet-500 dark:border-white/15"
          placeholder={activeMode.hint}
          aria-label={mode === "solve" ? "Equation" : "Expression"}
        />
      </label>

      {!result.ok ? (
        <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/5 p-3 text-sm text-amber-700 dark:text-amber-300">
          {result.error}
        </div>
      ) : (
        <Card>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide opacity-55">Steps</h2>
          <ol className="space-y-2.5">
            {result.steps.map((s, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="min-w-[9rem] shrink-0 text-xs font-bold text-violet-500">{s.label}</span>
                <span className="font-mono text-sm">{s.expr}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-baseline gap-2 border-t border-black/5 pt-3 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wide opacity-55">Result</span>
            <span className="font-mono text-lg font-extrabold text-violet-600 dark:text-violet-300">{result.result}</span>
          </div>
        </Card>
      )}
      <p className="mt-2 text-center text-xs opacity-55">
        Exact arithmetic — no rounding on whole numbers or fractions · no AI grading, every step is computed
      </p>
    </main>
  );
}
