"use client";
// Graph Explorer (ADR-027) — type a function of x and watch it come alive. The
// pure engine (lib/engines/graph-explorer) parses + samples deterministically;
// this component maps samples to a self-contained SVG with axes, a grid, gaps at
// asymptotes/domain errors, and x-intercept markers. No eval, no network.
import { Card } from "@logicland/ui";
import { LineChart } from "lucide-react";
import { useMemo, useState } from "react";
import { GRAPH_PRESETS, sampleFunction } from "@/lib/engines/graph-explorer";

const W = 660;
const H = 440;
const M = { l: 46, r: 18, t: 18, b: 34 };
const PLOT_W = W - M.l - M.r;
const PLOT_H = H - M.t - M.b;
const STEPS = 320;
const RANGE_CAP = 1000; // beyond this the data-range is untrustworthy (asymptotes)

function niceStep(range: number, target = 8): number {
  if (!(range > 0)) return 1;
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

function fmt(n: number): string {
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a >= 1000 || a < 0.001) return n.toExponential(0);
  return String(Math.round(n * 1000) / 1000);
}

export function GraphExplorer() {
  const [expr, setExpr] = useState("x^2");
  const [xmin, setXmin] = useState(-10);
  const [xmax, setXmax] = useState(10);

  const sample = useMemo(() => sampleFunction(expr, { min: xmin, max: xmax, steps: STEPS }), [expr, xmin, xmax]);

  // Choose a sensible y-window: padded data range when it's trustworthy, else a
  // default that keeps asymptotic functions readable.
  const [yLo, yHi] = useMemo(() => {
    if (sample.yMin === null || sample.yMax === null) return [-10, 10];
    const span = sample.yMax - sample.yMin;
    if (span > RANGE_CAP) return [-10, 10];
    if (span === 0) return [sample.yMin - 1, sample.yMax + 1];
    const pad = span * 0.08;
    return [sample.yMin - pad, sample.yMax + pad];
  }, [sample]);

  const validXDomain = xmax > xmin;

  const px = (x: number) => M.l + ((x - xmin) / (xmax - xmin)) * PLOT_W;
  const py = (y: number) => M.t + ((yHi - y) / (yHi - yLo)) * PLOT_H;

  // Build polyline segments, breaking at gaps or where the curve leaves the window.
  const segments = useMemo(() => {
    const segs: string[][] = [];
    let cur: string[] = [];
    for (const p of sample.points) {
      const inWindow = p.ok && p.y >= yLo && p.y <= yHi;
      if (inWindow) {
        cur.push(`${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`);
      } else if (cur.length) {
        segs.push(cur);
        cur = [];
      }
    }
    if (cur.length) segs.push(cur);
    return segs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample, yLo, yHi, xmin, xmax]);

  // x-intercepts: sign changes between consecutive finite samples (linear approx).
  const roots = useMemo(() => {
    const out: number[] = [];
    const pts = sample.points;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (a.ok && b.ok && a.y !== 0 && Math.sign(a.y) !== Math.sign(b.y)) {
        const t = a.y / (a.y - b.y);
        out.push(a.x + t * (b.x - a.x));
      } else if (a.ok && a.y === 0) {
        out.push(a.x);
      }
    }
    return out;
  }, [sample]);

  const xStep = niceStep(xmax - xmin);
  const yStep = niceStep(yHi - yLo);
  const xTicks: number[] = [];
  for (let v = Math.ceil(xmin / xStep) * xStep; v <= xmax + 1e-9; v += xStep) xTicks.push(Number(v.toFixed(6)));
  const yTicks: number[] = [];
  for (let v = Math.ceil(yLo / yStep) * yStep; v <= yHi + 1e-9; v += yStep) yTicks.push(Number(v.toFixed(6)));

  const zeroInY = yLo <= 0 && yHi >= 0;
  const zeroInX = xmin <= 0 && xmax >= 0;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <LineChart className="h-5 w-5 text-emerald-500" />
        <h1 className="font-display text-2xl font-extrabold">Graph Explorer</h1>
        <span className="text-sm opacity-60">See functions come alive.</span>
      </header>

      {/* Presets */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {GRAPH_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setExpr(p.expr)}
            className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
              expr === p.expr
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Function input + domain */}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[220px]">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">f(x) =</span>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            spellCheck={false}
            className="w-full rounded-lg border-2 border-black/10 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500 dark:border-white/15"
            placeholder="x^2 - 1"
            aria-label="Function of x"
          />
        </label>
        <label className="w-24">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">x min</span>
          <input
            type="number"
            value={xmin}
            onChange={(e) => setXmin(Number(e.target.value))}
            className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-emerald-500 dark:border-white/15"
          />
        </label>
        <label className="w-24">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">x max</span>
          <input
            type="number"
            value={xmax}
            onChange={(e) => setXmax(Number(e.target.value))}
            className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-emerald-500 dark:border-white/15"
          />
        </label>
      </div>

      {sample.error ? (
        <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/5 p-3 text-sm text-amber-700 dark:text-amber-300">
          {sample.error}
        </div>
      ) : (
        <>
          <Card className="overflow-x-auto p-2">
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" role="img" aria-label={`Graph of ${expr}`}>
              {/* Grid */}
              <g className="text-slate-400" stroke="currentColor" strokeOpacity={0.18}>
                {validXDomain &&
                  xTicks.map((v) => <line key={`gx${v}`} x1={px(v)} y1={M.t} x2={px(v)} y2={M.t + PLOT_H} />)}
                {yTicks.map((v) => (
                  <line key={`gy${v}`} x1={M.l} y1={py(v)} x2={M.l + PLOT_W} y2={py(v)} />
                ))}
              </g>

              {/* Axes */}
              <g className="text-slate-500" stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.4}>
                {zeroInY && <line x1={M.l} y1={py(0)} x2={M.l + PLOT_W} y2={py(0)} />}
                {zeroInX && validXDomain && <line x1={px(0)} y1={M.t} x2={px(0)} y2={M.t + PLOT_H} />}
              </g>

              {/* Tick labels */}
              <g className="fill-current text-[10px] text-slate-500" fontSize={10}>
                {validXDomain &&
                  xTicks.map((v) => (
                    <text key={`tx${v}`} x={px(v)} y={M.t + PLOT_H + 14} textAnchor="middle" fill="currentColor" opacity={0.7}>
                      {fmt(v)}
                    </text>
                  ))}
                {yTicks.map((v) => (
                  <text key={`ty${v}`} x={M.l - 6} y={py(v) + 3} textAnchor="end" fill="currentColor" opacity={0.7}>
                    {fmt(v)}
                  </text>
                ))}
              </g>

              {/* Curve */}
              <g fill="none" stroke="rgb(16,185,129)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
                {segments.map((seg, i) => (
                  <polyline key={i} points={seg.join(" ")} />
                ))}
              </g>

              {/* x-intercepts */}
              <g fill="rgb(239,68,68)">
                {zeroInY &&
                  roots.map((rx, i) => <circle key={i} cx={px(rx)} cy={py(0)} r={3.2} />)}
              </g>
            </svg>
          </Card>
          <p className="mt-2 text-center text-xs opacity-55">
            {roots.length > 0
              ? `${roots.length} x-intercept${roots.length === 1 ? "" : "s"} in view (red dots) · `
              : ""}
            y auto-scales · undefined points (like ÷0) leave gaps
          </p>
        </>
      )}
    </main>
  );
}
