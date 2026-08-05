"use client";
// Number Theory (ADR-030) — primes, factors and patterns. The pure engine
// (lib/engines/number-theory) does trial-division factorization, the
// Euclidean algorithm, square-and-multiply modular exponentiation and a Sieve
// of Eratosthenes, each returning a labelled step trace. No eval, no network,
// no LLM grading.
import { Card } from "@logicland/ui";
import { Hash } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FACTORIZE_PRESETS,
  GCD_PRESETS,
  MOD_PRESETS,
  SIEVE_PRESETS,
  factorize,
  gcdLcm,
  modularArithmetic,
  primeSieve,
  sieveOfEratosthenes,
  type NTResult,
} from "@/lib/engines/number-theory";

type Mode = "factorize" | "gcd" | "mod" | "sieve";
const MODES: { id: Mode; label: string }[] = [
  { id: "factorize", label: "Factorize" },
  { id: "gcd", label: "GCD & LCM" },
  { id: "mod", label: "Modular Arithmetic" },
  { id: "sieve", label: "Prime Sieve" },
];

function StepList({ result }: { result: NTResult }) {
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
            <span className="min-w-[11rem] shrink-0 text-xs font-bold text-amber-500">{s.label}</span>
            <span className="break-all font-mono text-sm">{s.expr}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-baseline gap-2 border-t border-black/5 pt-3 dark:border-white/10">
        <span className="text-xs font-bold uppercase tracking-wide opacity-55">Result</span>
        <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-300">{result.result}</span>
      </div>
    </Card>
  );
}

function PresetRow({ items, active, onPick }: { items: string[]; active: string; onPick: (v: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {items.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
            active === v
              ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300"
              : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function TextField({ label, value, onChange, width = "w-28" }: { label: string; value: string; onChange: (v: string) => void; width?: string }) {
  return (
    <label className={width}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 font-mono text-sm outline-none focus:border-amber-500 dark:border-white/15"
      />
    </label>
  );
}

function SieveGrid({ limit }: { limit: number }) {
  const primes = useMemo(() => new Set(sieveOfEratosthenes(limit)), [limit]);
  const cells = Array.from({ length: limit - 1 }, (_, i) => i + 2);
  return (
    <div className="grid grid-cols-10 gap-1 sm:grid-cols-12">
      {cells.map((n) => (
        <div
          key={n}
          className={`grid aspect-square place-items-center rounded-md font-mono text-[11px] ${
            primes.has(n) ? "bg-amber-500 font-bold text-white" : "bg-black/5 opacity-50 dark:bg-white/10"
          }`}
        >
          {n}
        </div>
      ))}
    </div>
  );
}

export function NumberTheoryLab() {
  const [mode, setMode] = useState<Mode>("factorize");
  const [n, setN] = useState("60");
  const [a, setA] = useState("48");
  const [b, setB] = useState("18");
  const [base, setBase] = useState("7");
  const [exp, setExp] = useState("128");
  const [mod, setMod] = useState("13");
  const [limit, setLimit] = useState("50");

  const factorizeResult = useMemo(() => factorize(n), [n]);
  const gcdResult = useMemo(() => gcdLcm(a, b), [a, b]);
  const modResult = useMemo(() => modularArithmetic(base, exp, mod), [base, exp, mod]);
  const sieveResult = useMemo(() => primeSieve(limit), [limit]);
  const limitNum = Number(limit);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Hash className="h-5 w-5 text-amber-500" />
        <h1 className="font-display text-2xl font-extrabold">Number Theory</h1>
        <span className="text-sm opacity-60">Primes, factors and patterns.</span>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Number theory tool">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
              mode === m.id
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "factorize" && (
        <>
          <PresetRow items={FACTORIZE_PRESETS} active={n} onPick={setN} />
          <div className="mb-4">
            <TextField label="Number" value={n} onChange={setN} width="w-40" />
          </div>
          <StepList result={factorizeResult} />
        </>
      )}

      {mode === "gcd" && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {GCD_PRESETS.map(([pa, pb]) => (
              <button
                key={`${pa}-${pb}`}
                type="button"
                onClick={() => { setA(pa); setB(pb); }}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  a === pa && b === pb
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {pa}, {pb}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <TextField label="a" value={a} onChange={setA} />
            <TextField label="b" value={b} onChange={setB} />
          </div>
          <StepList result={gcdResult} />
        </>
      )}

      {mode === "mod" && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {MOD_PRESETS.map(([pb, pe, pm]) => (
              <button
                key={`${pb}-${pe}-${pm}`}
                type="button"
                onClick={() => { setBase(pb); setExp(pe); setMod(pm); }}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  base === pb && exp === pe && mod === pm
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {pb}^{pe} mod {pm}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <TextField label="base" value={base} onChange={setBase} />
            <TextField label="exponent" value={exp} onChange={setExp} />
            <TextField label="modulus" value={mod} onChange={setMod} />
          </div>
          <StepList result={modResult} />
        </>
      )}

      {mode === "sieve" && (
        <>
          <PresetRow items={SIEVE_PRESETS} active={limit} onPick={setLimit} />
          <div className="mb-4">
            <TextField label="Limit" value={limit} onChange={setLimit} width="w-40" />
          </div>
          {sieveResult.ok && Number.isInteger(limitNum) && limitNum >= 2 && limitNum <= 1000 && (
            <Card className="mb-4 overflow-x-auto p-3">
              <SieveGrid limit={limitNum} />
            </Card>
          )}
          <StepList result={sieveResult} />
        </>
      )}

      <p className="mt-2 text-center text-xs opacity-55">
        Trial division, the Euclidean algorithm, square-and-multiply — no AI grading, every step is computed
      </p>
    </main>
  );
}
