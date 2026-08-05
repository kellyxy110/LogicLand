"use client";
// Geometry Lab (ADR-029) — construct, measure and transform shapes. The pure
// engine (lib/engines/geometry) computes distances, angles, area, perimeter
// and rigid/scale transforms deterministically; this component renders an SVG
// grid (before/after for transforms) and the labelled step list. No eval, no
// network, no LLM grading.
import { Card } from "@logicland/ui";
import { Shapes } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SHAPE_PRESETS,
  applyTransform,
  measureShape,
  type Point,
  type ReflectAxis,
  type Transform,
} from "@/lib/engines/geometry";

type Mode = "measure" | "transform";
type TransformKind = Transform["kind"];

const W = 420;
const H = 420;
const SCALE = 24; // px per unit
const ORIGIN = { x: W / 2, y: H / 2 };

function toSvg(p: Point): { x: number; y: number } {
  return { x: ORIGIN.x + p.x * SCALE, y: ORIGIN.y - p.y * SCALE };
}

function polygonPoints(points: Point[]): string {
  return points.map((p) => { const s = toSvg(p); return `${s.x.toFixed(1)},${s.y.toFixed(1)}`; }).join(" ");
}

function Grid() {
  const lines = [];
  for (let x = -8; x <= 8; x++) lines.push(<line key={`gx${x}`} x1={ORIGIN.x + x * SCALE} y1={0} x2={ORIGIN.x + x * SCALE} y2={H} />);
  for (let y = -8; y <= 8; y++) lines.push(<line key={`gy${y}`} x1={0} y1={ORIGIN.y + y * SCALE} x2={W} y2={ORIGIN.y + y * SCALE} />);
  return (
    <g stroke="currentColor" className="text-slate-400" strokeOpacity={0.15}>
      {lines}
      <g strokeOpacity={0.5}>
        <line x1={0} y1={ORIGIN.y} x2={W} y2={ORIGIN.y} />
        <line x1={ORIGIN.x} y1={0} x2={ORIGIN.x} y2={H} />
      </g>
    </g>
  );
}

function ShapeSvg({ points, color, label, labelY }: { points: Point[]; color: string; label?: string; labelY?: number }) {
  return (
    <>
      <polygon points={polygonPoints(points)} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      {points.map((p, i) => {
        const s = toSvg(p);
        return <circle key={i} cx={s.x} cy={s.y} r={3.5} fill={color} />;
      })}
      {label && (
        <text x={8} y={labelY ?? 16} fill={color} fontSize={11} fontWeight={700}>
          {label}
        </text>
      )}
    </>
  );
}

export function GeometryLab() {
  const [mode, setMode] = useState<Mode>("measure");
  const [presetIdx, setPresetIdx] = useState(0);
  const [transformKind, setTransformKind] = useState<TransformKind>("translate");
  const [dx, setDx] = useState(3);
  const [dy, setDy] = useState(2);
  const [degrees, setDegrees] = useState(90);
  const [axis, setAxis] = useState<ReflectAxis>("x-axis");
  const [factor, setFactor] = useState(1.5);

  const points = SHAPE_PRESETS[presetIdx].points;

  const measured = useMemo(() => measureShape(points), [points]);
  const transform: Transform = useMemo(() => {
    switch (transformKind) {
      case "translate":
        return { kind: "translate", dx, dy };
      case "rotate":
        return { kind: "rotate", center: { x: 0, y: 0 }, degrees };
      case "reflect":
        return { kind: "reflect", axis };
      case "scale":
        return { kind: "scale", center: { x: 0, y: 0 }, factor };
    }
  }, [transformKind, dx, dy, degrees, axis, factor]);
  const transformed = useMemo(() => applyTransform(points, transform), [points, transform]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Shapes className="h-5 w-5 text-sky-500" />
        <h1 className="font-display text-2xl font-extrabold">Geometry Lab</h1>
        <span className="text-sm opacity-60">Construct, measure and transform.</span>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Geometry mode">
        {(["measure", "transform"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold capitalize ${
              mode === m
                ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {SHAPE_PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPresetIdx(i)}
            className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
              presetIdx === i
                ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {mode === "transform" && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["translate", "rotate", "reflect", "scale"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTransformKind(k)}
                className={`rounded-full border-2 px-2.5 py-1 text-xs font-bold capitalize ${
                  transformKind === k
                    ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                    : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/15"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          {transformKind === "translate" && (
            <>
              <NumberField label="dx" value={dx} onChange={setDx} />
              <NumberField label="dy" value={dy} onChange={setDy} />
            </>
          )}
          {transformKind === "rotate" && <NumberField label="degrees (about origin)" value={degrees} onChange={setDegrees} />}
          {transformKind === "reflect" && (
            <label className="w-40">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">Axis</span>
              <select
                value={axis}
                onChange={(e) => setAxis(e.target.value as ReflectAxis)}
                className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sky-500 dark:border-white/15"
              >
                <option value="x-axis">x-axis</option>
                <option value="y-axis">y-axis</option>
                <option value="y=x">y = x</option>
                <option value="y=-x">y = -x</option>
              </select>
            </label>
          )}
          {transformKind === "scale" && <NumberField label="factor (about origin)" value={factor} onChange={setFactor} step={0.1} />}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[420px_1fr]">
        <Card className="overflow-x-auto p-2">
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" role="img" aria-label={`${SHAPE_PRESETS[presetIdx].label} on a coordinate grid`}>
            <Grid />
            {mode === "measure" ? (
              <ShapeSvg points={points} color="rgb(14,165,233)" />
            ) : (
              <>
                <ShapeSvg points={transformed.before} color="rgb(148,163,184)" label="before" labelY={16} />
                <ShapeSvg points={transformed.after} color="rgb(14,165,233)" label="after" labelY={30} />
              </>
            )}
          </svg>
        </Card>

        <Card>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide opacity-55">Steps</h2>
          <ol className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {(mode === "measure" ? measured.steps : transformed.steps).map((s, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="min-w-[9rem] shrink-0 text-xs font-bold text-sky-500">{s.label}</span>
                <span className="font-mono text-sm">{s.expr}</span>
              </li>
            ))}
          </ol>
          {mode === "measure" && (
            <div className="mt-4 flex items-baseline gap-2 border-t border-black/5 pt-3 dark:border-white/10">
              <span className="text-xs font-bold uppercase tracking-wide opacity-55">Result</span>
              <span className="font-mono text-sm font-extrabold text-sky-600 dark:text-sky-300">{measured.result}</span>
            </div>
          )}
        </Card>
      </div>
      <p className="mt-2 text-center text-xs opacity-55">Exact vector geometry — no AI grading, every measurement is computed</p>
    </main>
  );
}

function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="w-28">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-55">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border-2 border-black/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sky-500 dark:border-white/15"
      />
    </label>
  );
}
