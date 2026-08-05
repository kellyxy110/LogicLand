"use client";
// Calculus Visualizer (ADR-032) — limits, gradients, areas under curves, made
// visual. The pure engine (lib/engines/calculus) computes derivatives
// (central difference), integrals (trapezoid rule) and limits (both-sided
// approach) on top of Graph Explorer's safe parser. This component plots the
// curve plus a tangent line, shaded Riemann rectangles, or approach markers.
import { Card } from "@logicland/ui";
import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DERIVATIVE_PRESETS,
  INTEGRAL_PRESETS,
  LIMIT_PRESETS,
  definiteIntegral,
  derivativeAt,
  integralRectangles,
  limitAt,
  sampleFunction,
  tangentLine,
  type CalcResult,
} from "@/lib/engines/calculus";
import { evaluateAt, parseExpression } from "@/lib/engines/graph-explorer";

type Mode = "derivative" | "integral" | "limit";
const MODES: { id: Mode; label: string }[] = [
  { id: "derivative", label: "Derivative" },
  { id: "integral", label: "Integral" },
  { id: "limit", label: "Limit" },
];

const W = 420;
const H = 360;
const M = { l: 36, r: 14, t: 14, b: 26 };
const PLOT_W = W - M.l - M.r;
const PLOT_H = H - M.t - M.b;

function StepList({ result }: { result: CalcResult }) {
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
            <span className="min-w-[13rem] shrink-0 text-xs font-bold text-orange-500">{s.label}</span>
            <span className="break-all font-mono text-sm">{s.expr}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-baseline gap-2 border-t border-black/5 pt-3 dark:border-white/10">
        <span className="text-xs font-bold uppercase tracking-wide opacity-55">Result</span>
        <span className="break-all font-mono text-sm font-extrabold text-orange-600 dark:text-orange-300">{result.result}</span>
      </div>
    </Card>
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
        className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 font-mono text-sm outline-none focus:border-orange-500 dark:border-white/15"
      />
    </label>
  );
}

export function CalculusVisualizer() {
  const [mode, setMode] = useState<Mode>("derivative");
  const [derivExpr, setDerivExpr] = useState(DERIVATIVE_PRESETS[0].expr);
  const [derivA, setDerivA] = useState(DERIVATIVE_PRESETS[0].a);
  const [intExpr, setIntExpr] = useState(INTEGRAL_PRESETS[0].expr);
  const [intA, setIntA] = useState(INTEGRAL_PRESETS[0].a);
  const [intB, setIntB] = useState(INTEGRAL_PRESETS[0].b);
  const [limExpr, setLimExpr] = useState(LIMIT_PRESETS[0].expr);
  const [limA, setLimA] = useState(LIMIT_PRESETS[0].a);

  const derivResult = useMemo(() => tangentLine(derivExpr, derivA), [derivExpr, derivA]);
  const intResult = useMemo(() => definiteIntegral(intExpr, intA, intB), [intExpr, intA, intB]);
  const limResult = useMemo(() => limitAt(limExpr, limA), [limExpr, limA]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Activity className="h-5 w-5 text-orange-500" />
        <h1 className="font-display text-2xl font-extrabold">Calculus Visualizer</h1>
        <span className="text-sm opacity-60">Limits, gradients, areas under curves.</span>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Calculus tool">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
              mode === m.id
                ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "derivative" && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {DERIVATIVE_PRESETS.map((p) => (
              <button
                key={p.expr + p.a}
                type="button"
                onClick={() => { setDerivExpr(p.expr); setDerivA(p.a); }}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  derivExpr === p.expr && derivA === p.a
                    ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {p.expr} at x={p.a}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <TextField label="f(x)" value={derivExpr} onChange={setDerivExpr} width="w-48" />
            <TextField label="a" value={derivA} onChange={setDerivA} width="w-20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[420px_1fr]">
            <DerivativePlot expr={derivExpr} a={Number(derivA)} />
            <StepList result={derivResult} />
          </div>
        </>
      )}

      {mode === "integral" && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {INTEGRAL_PRESETS.map((p) => (
              <button
                key={p.expr + p.a + p.b}
                type="button"
                onClick={() => { setIntExpr(p.expr); setIntA(p.a); setIntB(p.b); }}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  intExpr === p.expr && intA === p.a && intB === p.b
                    ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {p.expr} on [{p.a}, {p.b}]
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <TextField label="f(x)" value={intExpr} onChange={setIntExpr} width="w-48" />
            <TextField label="a" value={intA} onChange={setIntA} width="w-20" />
            <TextField label="b" value={intB} onChange={setIntB} width="w-20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[420px_1fr]">
            <IntegralPlot expr={intExpr} a={Number(intA)} b={Number(intB)} />
            <StepList result={intResult} />
          </div>
        </>
      )}

      {mode === "limit" && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {LIMIT_PRESETS.map((p) => (
              <button
                key={p.expr + p.a}
                type="button"
                onClick={() => { setLimExpr(p.expr); setLimA(p.a); }}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
                  limExpr === p.expr && limA === p.a
                    ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {p.expr} at x={p.a}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <TextField label="f(x)" value={limExpr} onChange={setLimExpr} width="w-48" />
            <TextField label="x →" value={limA} onChange={setLimA} width="w-20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[420px_1fr]">
            <LimitPlot expr={limExpr} a={Number(limA)} />
            <StepList result={limResult} />
          </div>
        </>
      )}

      <p className="mt-2 text-center text-xs opacity-55">
        Central-difference derivatives · trapezoid-rule integrals · two-sided limits — no AI grading, every step is computed
      </p>
    </main>
  );
}

function CurveAxes({ px, py, xmin, xmax, points }: { px: (x: number) => number; py: (y: number) => number; xmin: number; xmax: number; points: { x: number; y: number; ok: boolean }[] }) {
  const zeroInX = xmin <= 0 && xmax >= 0;
  const segments: string[][] = [];
  let cur: string[] = [];
  for (const p of points) {
    if (p.ok) cur.push(`${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`);
    else if (cur.length) { segments.push(cur); cur = []; }
  }
  if (cur.length) segments.push(cur);
  return (
    <>
      <g stroke="currentColor" className="text-slate-400" strokeOpacity={0.15}>
        <line x1={M.l} y1={M.t + PLOT_H} x2={M.l + PLOT_W} y2={M.t + PLOT_H} />
        {zeroInX && <line x1={px(0)} y1={M.t} x2={px(0)} y2={M.t + PLOT_H} strokeOpacity={0.4} />}
      </g>
      <g fill="none" stroke="rgb(249,115,22)" strokeWidth={2} strokeLinejoin="round">
        {segments.map((seg, i) => <polyline key={i} points={seg.join(" ")} />)}
      </g>
    </>
  );
}

function useWindow(expr: string, xmin: number, xmax: number) {
  const sample = useMemo(() => sampleFunction(expr, { min: xmin, max: xmax, steps: 200 }), [expr, xmin, xmax]);
  const [yLo, yHi] = useMemo(() => {
    if (sample.yMin === null || sample.yMax === null) return [-5, 5];
    const span = sample.yMax - sample.yMin;
    if (span === 0 || span > 500) return [sample.yMin - 5, sample.yMax + 5];
    const pad = span * 0.15;
    return [sample.yMin - pad, sample.yMax + pad];
  }, [sample]);
  const px = (x: number) => M.l + ((x - xmin) / (xmax - xmin)) * PLOT_W;
  const py = (y: number) => M.t + ((yHi - y) / (yHi - yLo)) * PLOT_H;
  return { sample, px, py, yLo, yHi };
}

function DerivativePlot({ expr, a }: { expr: string; a: number }) {
  const validA = Number.isFinite(a);
  const xmin = validA ? a - 5 : -5;
  const xmax = validA ? a + 5 : 5;
  const { sample, px, py } = useWindow(expr, xmin, xmax);
  const parsed = parseExpression(expr);
  const fa = parsed.ok && validA ? evaluateAt(parsed.ast, a) : null;
  const faFinite = fa !== null && Number.isFinite(fa);
  const slope = parsed.ok && validA && faFinite ? derivativeAt(parsed.ast, a, 0.0001) : null;

  return (
    <Card className="overflow-x-auto p-2">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Tangent line to ${expr} at x=${a}`}>
        <CurveAxes px={px} py={py} xmin={xmin} xmax={xmax} points={sample.points} />
        {slope !== null && faFinite && (
          <g stroke="rgb(59,130,246)" strokeWidth={2} strokeDasharray="5 3">
            <line x1={px(a - 2)} y1={py(fa! + slope * -2)} x2={px(a + 2)} y2={py(fa! + slope * 2)} />
          </g>
        )}
        {faFinite && <circle cx={px(a)} cy={py(fa!)} r={4} fill="rgb(59,130,246)" />}
      </svg>
    </Card>
  );
}

function IntegralPlot({ expr, a, b }: { expr: string; a: number; b: number }) {
  const validRange = Number.isFinite(a) && Number.isFinite(b) && b > a;
  const pad = validRange ? (b - a) * 0.3 : 1;
  const xmin = validRange ? a - pad : -5;
  const xmax = validRange ? b + pad : 5;
  const { sample, px, py } = useWindow(expr, xmin, xmax);
  const parsed = parseExpression(expr);
  const rects = parsed.ok && validRange ? integralRectangles(parsed.ast, a, b, 12) : [];

  return (
    <Card className="overflow-x-auto p-2">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Area under ${expr} from ${a} to ${b}`}>
        <CurveAxes px={px} py={py} xmin={xmin} xmax={xmax} points={sample.points} />
        {rects.map((r, i) => {
          const yTop = Math.max(r.height, 0);
          const yBot = Math.min(r.height, 0);
          return (
            <rect
              key={i}
              x={px(r.x0)}
              y={Math.min(py(yTop), py(0))}
              width={Math.max(1, px(r.x1) - px(r.x0) - 1)}
              height={Number.isFinite(r.height) ? Math.abs(py(yTop) - py(yBot)) : 0}
              fill="rgb(249,115,22)"
              fillOpacity={0.25}
              stroke="rgb(249,115,22)"
              strokeOpacity={0.4}
            />
          );
        })}
        <g stroke="currentColor" className="text-slate-500" strokeOpacity={0.3}>
          {validRange && <line x1={px(a)} y1={M.t} x2={px(a)} y2={M.t + PLOT_H} />}
          {validRange && <line x1={px(b)} y1={M.t} x2={px(b)} y2={M.t + PLOT_H} />}
        </g>
      </svg>
    </Card>
  );
}

function LimitPlot({ expr, a }: { expr: string; a: number }) {
  const validA = Number.isFinite(a);
  const xmin = validA ? a - 3 : -5;
  const xmax = validA ? a + 3 : 5;
  const { sample, px, py, yLo, yHi } = useWindow(expr, xmin, xmax);
  const approachXs = validA ? [-0.5, -0.2, -0.05, 0.05, 0.2, 0.5].map((d) => a + d) : [];

  return (
    <Card className="overflow-x-auto p-2">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Limit of ${expr} as x approaches ${a}`}>
        <CurveAxes px={px} py={py} xmin={xmin} xmax={xmax} points={sample.points} />
        {validA && (
          <line x1={px(a)} y1={M.t} x2={px(a)} y2={M.t + PLOT_H} stroke="rgb(59,130,246)" strokeDasharray="4 3" strokeOpacity={0.6} />
        )}
        {approachXs.map((x, i) => {
          const p = sample.points.find((pt) => Math.abs(pt.x - x) < (xmax - xmin) / 100);
          if (!p?.ok || p.y < yLo || p.y > yHi) return null;
          return <circle key={i} cx={px(x)} cy={py(p.y)} r={3.5} fill="rgb(59,130,246)" />;
        })}
      </svg>
    </Card>
  );
}
