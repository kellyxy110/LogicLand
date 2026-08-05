"use client";
// Statistics Lab (ADR-031) — averages, spread, probability and simulations.
// The pure engine (lib/engines/statistics) computes descriptive stats, exact-
// fraction probabilities and seeded-PRNG simulations; this component is mode
// switching + a step list + a simple bar chart for the simulator. No AI
// grading — the simulator uses randomness on purpose (that's what a
// simulation is), but a given seed always reproduces the same run.
import { Card } from "@logicland/ui";
import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DATASET_PRESETS,
  EVENTS,
  computeProbability,
  describeDataset,
  simulate,
  simulateSummary,
  type ExperimentId,
  type StatsResult,
} from "@/lib/engines/statistics";

type Mode = "describe" | "probability" | "simulate";
const MODES: { id: Mode; label: string }[] = [
  { id: "describe", label: "Descriptive Stats" },
  { id: "probability", label: "Probability" },
  { id: "simulate", label: "Simulate" },
];

function StepList({ result }: { result: StatsResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/5 p-3 text-sm text-amber-700 dark:text-amber-300">
        {result.error}
      </div>
    );
  }
  return (
    <Card>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide opacity-55">Steps</h2>
      <ol className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {result.steps.map((s, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="min-w-[13rem] shrink-0 text-xs font-bold text-lime-600 dark:text-lime-400">{s.label}</span>
            <span className="break-all font-mono text-sm">{s.expr}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-baseline gap-2 border-t border-black/5 pt-3 dark:border-white/10">
        <span className="text-xs font-bold uppercase tracking-wide opacity-55">Result</span>
        <span className="font-mono text-sm font-extrabold text-lime-700 dark:text-lime-300">{result.result}</span>
      </div>
    </Card>
  );
}

const EXPERIMENTS: { id: ExperimentId; label: string }[] = [
  { id: "coin", label: "Coin" },
  { id: "die", label: "Die" },
  { id: "deck", label: "Deck" },
];

export function StatisticsLab() {
  const [mode, setMode] = useState<Mode>("describe");
  const [dataset, setDataset] = useState(DATASET_PRESETS[0]);
  const [eventId, setEventId] = useState(EVENTS[1].id); // die-even
  const [simExperiment, setSimExperiment] = useState<ExperimentId>("die");
  const [trials, setTrials] = useState(100);
  const [seed, setSeed] = useState(1);

  const describeResult = useMemo(() => describeDataset(dataset), [dataset]);
  const probResult = useMemo(() => computeProbability(eventId), [eventId]);
  const simRun = useMemo(() => simulate(simExperiment, Math.max(1, Math.min(20000, trials)), seed), [simExperiment, trials, seed]);
  const simResult = useMemo(() => simulateSummary(simRun), [simRun]);
  const eventsForExperiment = EVENTS; // small list; no need to filter by tab

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <BarChart3 className="h-5 w-5 text-lime-600" />
        <h1 className="font-display text-2xl font-extrabold">Statistics Lab</h1>
        <span className="text-sm opacity-60">Averages, spread, probability and simulations.</span>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Statistics tool">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
              mode === m.id
                ? "border-lime-600 bg-lime-500/10 text-lime-700 dark:text-lime-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "describe" && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {DATASET_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDataset(p)}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  dataset === p
                    ? "border-lime-600 bg-lime-500/10 text-lime-700 dark:text-lime-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">Dataset</span>
            <input
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              spellCheck={false}
              className="w-full rounded-lg border-2 border-black/10 bg-transparent px-3 py-2.5 font-mono text-sm outline-none focus:border-lime-600 dark:border-white/15"
            />
          </label>
          <StepList result={describeResult} />
        </>
      )}

      {mode === "probability" && (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {eventsForExperiment.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEventId(e.id)}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  eventId === e.id
                    ? "border-lime-600 bg-lime-500/10 text-lime-700 dark:text-lime-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <StepList result={probResult} />
        </>
      )}

      {mode === "simulate" && (
        <>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-1.5">
              {EXPERIMENTS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSimExperiment(e.id)}
                  className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                    simExperiment === e.id
                      ? "border-lime-600 bg-lime-500/10 text-lime-700 dark:text-lime-300"
                      : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
            <label className="w-28">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">Trials</span>
              <input
                type="number"
                value={trials}
                onChange={(e) => setTrials(Number(e.target.value))}
                className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-lime-600 dark:border-white/15"
              />
            </label>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="rounded-lg border-2 border-lime-600 bg-lime-500/10 px-3 py-2 text-sm font-bold text-lime-700 dark:text-lime-300"
            >
              Run again (new seed)
            </button>
          </div>

          <Card className="mb-4 p-4">
            <div className="flex items-end gap-3">
              {simRun.outcomes.map((o) => (
                <div key={o.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-40 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-lime-500"
                      style={{ height: `${Math.max(2, o.empirical * 100 * 1.6)}px` }}
                      title={`${o.label}: ${(o.empirical * 100).toFixed(1)}%`}
                    />
                  </div>
                  <span className="text-xs font-bold">{o.label}</span>
                  <span className="text-[11px] opacity-60">{(o.empirical * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
          <StepList result={simResult} />
        </>
      )}

      <p className="mt-2 text-center text-xs opacity-55">
        Exact fractions for probability · a given seed always reproduces the same simulation · no AI grading
      </p>
    </main>
  );
}
