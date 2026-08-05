// Statistics Lab engine (ADR-031) — pure, deterministic descriptive statistics
// and exact-fraction probability, plus a seeded-PRNG simulator for the "run it
// and see" experience. The simulator is the one place in MathLab that uses
// randomness on purpose (that's what a simulation is) — everything it reports
// is still computed, never AI-guessed, and a given seed always reproduces the
// same run (ADR-015: deterministic evaluation, reproducible by design).
import { frac, fractionToString, type Fraction } from "./algebra";

export interface Step {
  label: string;
  expr: string;
}
export type StatsResult = { ok: true; steps: Step[]; result: string } | { ok: false; error: string };

// --- Descriptive statistics ---------------------------------------------------
export function parseDataset(src: string): number[] | null {
  const parts = src
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return nums;
}

export function mean(data: number[]): number {
  return data.reduce((s, x) => s + x, 0) / data.length;
}

export function median(data: number[]): number {
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** All values tied for highest frequency; empty if every value occurs once (no mode). */
export function modes(data: number[]): number[] {
  const counts = new Map<number, number>();
  for (const x of data) counts.set(x, (counts.get(x) ?? 0) + 1);
  const maxFreq = Math.max(...counts.values());
  if (maxFreq <= 1) return [];
  return [...counts.entries()].filter(([, c]) => c === maxFreq).map(([v]) => v).sort((a, b) => a - b);
}

export function range(data: number[]): number {
  return Math.max(...data) - Math.min(...data);
}

export function variance(data: number[], kind: "population" | "sample"): number {
  const m = mean(data);
  const sumSq = data.reduce((s, x) => s + (x - m) ** 2, 0);
  const denom = kind === "population" ? data.length : data.length - 1;
  return denom > 0 ? sumSq / denom : 0;
}

export function stdDev(data: number[], kind: "population" | "sample"): number {
  return Math.sqrt(variance(data, kind));
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""));

export function describeDataset(src: string): StatsResult {
  const data = parseDataset(src);
  if (!data || data.length === 0) return { ok: false, error: "Enter some numbers, separated by commas or spaces, like 4, 8, 6, 5, 3." };
  if (data.length < 2) return { ok: false, error: "Enter at least two numbers so spread has meaning." };

  const sorted = [...data].sort((a, b) => a - b);
  const n = data.length;
  const sum = data.reduce((s, x) => s + x, 0);
  const m = mean(data);
  const md = median(data);
  const mds = modes(data);
  const r = range(data);
  const popVar = variance(data, "population");
  const popSd = stdDev(data, "population");
  const sampVar = variance(data, "sample");
  const sampSd = stdDev(data, "sample");

  const steps: Step[] = [
    { label: "Data (sorted)", expr: sorted.map(fmt).join(", ") },
    { label: "Count (n)", expr: String(n) },
    { label: "Sum", expr: fmt(sum) },
    { label: "Mean (sum ÷ n)", expr: fmt(m) },
    { label: "Median (middle value)", expr: fmt(md) },
    { label: "Mode", expr: mds.length ? mds.map(fmt).join(", ") : "no mode — every value is unique" },
    { label: "Range (max − min)", expr: `${fmt(Math.max(...data))} − ${fmt(Math.min(...data))} = ${fmt(r)}` },
    { label: "Variance (population)", expr: fmt(popVar) },
    { label: "Standard deviation (population)", expr: fmt(popSd) },
    { label: "Variance (sample, n−1)", expr: fmt(sampVar) },
    { label: "Standard deviation (sample, n−1)", expr: fmt(sampSd) },
  ];
  return { ok: true, steps, result: `mean ${fmt(m)} · median ${fmt(md)} · population σ ${fmt(popSd)}` };
}

// --- Probability (exact fractions) --------------------------------------------
export type ExperimentId = "coin" | "die" | "deck";
const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export interface CardOutcome {
  rank: (typeof RANKS)[number];
  suit: (typeof SUITS)[number];
}

function deckOutcomes(): CardOutcome[] {
  const out: CardOutcome[] = [];
  for (const suit of SUITS) for (const rank of RANKS) out.push({ rank, suit });
  return out;
}

export function experimentOutcomes(id: ExperimentId): unknown[] {
  switch (id) {
    case "coin":
      return ["Heads", "Tails"];
    case "die":
      return [1, 2, 3, 4, 5, 6];
    case "deck":
      return deckOutcomes();
  }
}

export function experimentLabel(id: ExperimentId): string {
  switch (id) {
    case "coin":
      return "Coin flip";
    case "die":
      return "Six-sided die";
    case "deck":
      return "Standard 52-card deck";
  }
}

export interface EventDef {
  id: string;
  label: string;
  experiment: ExperimentId;
  test: (outcome: unknown) => boolean;
}

export const EVENTS: EventDef[] = [
  { id: "coin-heads", experiment: "coin", label: "Flip heads", test: (o) => o === "Heads" },
  { id: "die-even", experiment: "die", label: "Roll an even number", test: (o) => (o as number) % 2 === 0 },
  { id: "die-odd", experiment: "die", label: "Roll an odd number", test: (o) => (o as number) % 2 === 1 },
  { id: "die-gt4", experiment: "die", label: "Roll greater than 4", test: (o) => (o as number) > 4 },
  { id: "deck-heart", experiment: "deck", label: "Draw a heart", test: (o) => (o as CardOutcome).suit === "♥" },
  { id: "deck-ace", experiment: "deck", label: "Draw an ace", test: (o) => (o as CardOutcome).rank === "A" },
  {
    id: "deck-face",
    experiment: "deck",
    label: "Draw a face card (J, Q, K)",
    test: (o) => ["J", "Q", "K"].includes((o as CardOutcome).rank),
  },
];

function outcomeStr(o: unknown): string {
  if (typeof o === "object" && o !== null && "rank" in o) {
    const c = o as CardOutcome;
    return `${c.rank}${c.suit}`;
  }
  return String(o);
}

export function computeProbability(eventId: string): StatsResult {
  const event = EVENTS.find((e) => e.id === eventId);
  if (!event) return { ok: false, error: "Unknown event." };
  const outcomes = experimentOutcomes(event.experiment);
  const favorable = outcomes.filter(event.test);
  const p: Fraction = frac(favorable.length, outcomes.length);

  const steps: Step[] = [
    { label: "Experiment", expr: experimentLabel(event.experiment) },
    { label: "Event", expr: event.label },
    { label: "Total outcomes", expr: String(outcomes.length) },
    {
      label: "Favorable outcomes",
      expr: favorable.length <= 13 ? favorable.map(outcomeStr).join(", ") : `${favorable.length} outcomes`,
    },
    { label: "Favorable count", expr: String(favorable.length) },
    { label: `P(event) = ${favorable.length}/${outcomes.length}`, expr: fractionToString(p) },
  ];
  return { ok: true, steps, result: `P(${event.label}) = ${fractionToString(p)}` };
}

// --- Simulation (seeded PRNG — reproducible, not AI, not graded) -------------
/** mulberry32 — small, fast, deterministic given a seed. Not cryptographic; fine for a classroom simulator. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulationOutcome {
  label: string;
  count: number;
  empirical: number; // proportion, 0-1
  theoretical: number; // proportion, 0-1
}

export interface SimulationRun {
  experiment: ExperimentId;
  trials: number;
  seed: number;
  outcomes: SimulationOutcome[];
}

export function simulate(experiment: ExperimentId, trials: number, seed: number): SimulationRun {
  const pool = experimentOutcomes(experiment);
  const rand = mulberry32(seed);
  const counts = new Map<string, number>();
  for (const o of pool) counts.set(outcomeStr(o), 0);
  for (let i = 0; i < trials; i++) {
    const idx = Math.floor(rand() * pool.length);
    const key = outcomeStr(pool[idx]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const outcomes: SimulationOutcome[] = [...counts.entries()].map(([label, count]) => ({
    label,
    count,
    empirical: count / trials,
    theoretical: 1 / pool.length,
  }));
  return { experiment, trials, seed, outcomes };
}

export function simulateSummary(run: SimulationRun): StatsResult {
  const steps: Step[] = [
    { label: "Experiment", expr: experimentLabel(run.experiment) },
    { label: "Trials", expr: String(run.trials) },
    { label: "Seed", expr: String(run.seed) },
    ...run.outcomes.map((o) => ({
      label: o.label,
      expr: `${o.count} times · empirical ${(o.empirical * 100).toFixed(1)}% · theoretical ${(o.theoretical * 100).toFixed(1)}%`,
    })),
  ];
  const maxDrift = Math.max(...run.outcomes.map((o) => Math.abs(o.empirical - o.theoretical)));
  steps.push({ label: "Largest drift from theoretical", expr: `${(maxDrift * 100).toFixed(1)} percentage points` });
  return { ok: true, steps, result: `${run.trials} trials · max drift ${(maxDrift * 100).toFixed(1)}pp from theoretical` };
}

// --- Presets -------------------------------------------------------------------
export const DATASET_PRESETS = ["4, 8, 6, 5, 3, 2, 8, 9, 2, 5", "10, 12, 23, 23, 16, 23, 21, 16", "1, 2, 3, 4, 5, 6, 7, 8, 9, 10"];
