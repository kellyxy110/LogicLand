"use client";
// Project Graph (ADR-026) — one cross-artifact map of a learner's thinking. It
// reads the autosaved Canvas and Proof from localStorage, projects each to a
// {nodes, edges} graph, merges them (namespaced), and lays the result out in
// dependency tiers as a deterministic SVG. Pure engine does the reasoning; this
// only draws. Offline, no network, no LLM.
import { Card } from "@logicland/ui";
import { GitBranch, RefreshCw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { migrateDoc, toGraph as canvasToGraph, type CanvasDoc } from "@/lib/engines/canvas-doc";
import { proofToGraph, type Proof } from "@/lib/engines/proof";
import {
  emptyGraph,
  fromCanvasGraph,
  fromProofGraph,
  graphStats,
  leaves,
  longestChainLength,
  mergeGraphs,
  orphans,
  roots,
  topologicalLayers,
  validateGraph,
  type NodeSource,
  type ProjectGraph,
} from "@/lib/engines/project-graph";

const CANVAS_DOC_KEYS = ["logicland:canvas:doc:v2", "logicland:canvas:doc:v1"];
const PROOF_KEY = "logicland:proof:current:v1"; // mirrors ProofWorkshop.PROOF_STORAGE_KEY

const SOURCE_STYLE: Record<NodeSource, { fill: string; stroke: string; label: string }> = {
  canvas: { fill: "rgba(99,102,241,0.12)", stroke: "rgb(99,102,241)", label: "Canvas" },
  proof: { fill: "rgba(16,185,129,0.12)", stroke: "rgb(16,185,129)", label: "Proof" },
  skill: { fill: "rgba(234,179,8,0.12)", stroke: "rgb(234,179,8)", label: "Skill" },
};

// Layout constants (SVG units).
const NODE_W = 168;
const NODE_H = 46;
const COL_GAP = 28;
const ROW_GAP = 46;
const PAD = 24;

function readMergedGraph(): ProjectGraph {
  const parts: ProjectGraph[] = [];
  try {
    let canvasRaw: string | null = null;
    for (const k of CANVAS_DOC_KEYS) {
      canvasRaw = window.localStorage.getItem(k);
      if (canvasRaw) break;
    }
    if (canvasRaw) {
      const doc = migrateDoc(JSON.parse(canvasRaw) as Partial<CanvasDoc>);
      parts.push(fromCanvasGraph(canvasToGraph(doc)));
    }
  } catch {
    /* skip a corrupt canvas */
  }
  try {
    const proofRaw = window.localStorage.getItem(PROOF_KEY);
    if (proofRaw) {
      const proof = JSON.parse(proofRaw) as Proof;
      parts.push(fromProofGraph(proofToGraph(proof)));
    }
  } catch {
    /* skip a corrupt proof */
  }
  return parts.length ? mergeGraphs(...parts) : emptyGraph();
}

interface Placed {
  id: string;
  cx: number;
  cy: number;
}

export function ProjectGraphView() {
  const [graph, setGraph] = useState<ProjectGraph>(() => emptyGraph());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => setGraph(readMergedGraph()), []);
  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const layers = useMemo(() => topologicalLayers(graph), [graph]);
  const stats = useMemo(() => graphStats(graph), [graph]);
  const problems = useMemo(() => validateGraph(graph), [graph]);
  const rootN = useMemo(() => roots(graph), [graph]);
  const leafN = useMemo(() => leaves(graph), [graph]);
  const orphanN = useMemo(() => orphans(graph), [graph]);

  // Deterministic tiered layout: tier d on row d, nodes centred within the row.
  const { placed, width, height } = useMemo(() => {
    const maxRow = Math.max(1, ...layers.map((l) => l.length));
    const w = PAD * 2 + maxRow * NODE_W + (maxRow - 1) * COL_GAP;
    const h = PAD * 2 + layers.length * NODE_H + Math.max(0, layers.length - 1) * ROW_GAP;
    const pos = new Map<string, Placed>();
    layers.forEach((layer, d) => {
      const rowW = layer.length * NODE_W + (layer.length - 1) * COL_GAP;
      const startX = (w - rowW) / 2;
      const cy = PAD + d * (NODE_H + ROW_GAP) + NODE_H / 2;
      layer.forEach((n, i) => {
        pos.set(n.id, { id: n.id, cx: startX + i * (NODE_W + COL_GAP) + NODE_W / 2, cy });
      });
    });
    return { placed: pos, width: w, height: h };
  }, [layers]);

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  if (ready && graph.nodes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10 text-center">
        <GitBranch className="mx-auto h-10 w-10 text-brand opacity-70" />
        <h1 className="mt-3 font-display text-2xl font-extrabold">Project Graph</h1>
        <p className="mx-auto mt-2 max-w-md text-sm opacity-70">
          This map draws together the work you connect elsewhere. Add linked blocks in the{" "}
          <a href="/lab/canvas" className="font-bold text-brand hover:underline">
            Canvas
          </a>{" "}
          or build a{" "}
          <a href="/mathlab/proof" className="font-bold text-brand hover:underline">
            Proof
          </a>
          , then come back to see how it all fits together.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-brand/30 px-3 py-1.5 text-sm font-bold text-brand hover:border-brand/60"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <GitBranch className="h-5 w-5 text-brand" />
        <h1 className="font-display text-2xl font-extrabold">Project Graph</h1>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {(Object.keys(SOURCE_STYLE) as NodeSource[])
            .filter((s) => (stats.bySource[s] ?? 0) > 0)
            .map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 font-semibold">
                <span
                  className="inline-block h-3 w-3 rounded"
                  style={{ background: SOURCE_STYLE[s].fill, border: `2px solid ${SOURCE_STYLE[s].stroke}` }}
                />
                {SOURCE_STYLE[s].label} · {stats.bySource[s]}
              </span>
            ))}
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand/30 px-2.5 py-1 font-bold text-brand hover:border-brand/60"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Stat label="pieces" value={stats.nodeCount} />
        <Stat label="connections" value={stats.edgeCount} />
        <Stat label="longest chain" value={longestChainLength(graph)} />
        <Stat label="foundations" value={rootN.length} />
        <Stat label="conclusions" value={leafN.length} />
        <Stat label="unconnected" value={orphanN.length} tone={orphanN.length ? "warn" : "ok"} />
      </div>

      {problems.length > 0 && (
        <div className="mb-4 rounded-2xl border-2 border-amber-400/40 bg-amber-400/5 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-300">
            <TriangleAlert className="h-3.5 w-3.5" /> The graph has {problems.length} structural issue
            {problems.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-1 list-disc pl-5 opacity-80">
            {problems.slice(0, 5).map((p, k) => (
              <li key={k}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="overflow-x-auto p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="max-w-full"
          role="img"
          aria-label={`Project graph with ${stats.nodeCount} pieces and ${stats.edgeCount} connections`}
        >
          <defs>
            <marker id="pg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" opacity="0.5" />
            </marker>
          </defs>

          {/* Edges: from the dependent (deeper) up to its dependency (shallower). */}
          <g className="text-slate-500">
            {graph.edges.map((e) => {
              const a = placed.get(e.from);
              const b = placed.get(e.to);
              if (!a || !b) return null;
              return (
                <line
                  key={e.id}
                  x1={a.cx}
                  y1={a.cy - NODE_H / 2}
                  x2={b.cx}
                  y2={b.cy + NODE_H / 2}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                  markerEnd="url(#pg-arrow)"
                />
              );
            })}
          </g>

          {/* Nodes */}
          {graph.nodes.map((n) => {
            const p = placed.get(n.id);
            if (!p) return null;
            const style = SOURCE_STYLE[n.source];
            const label = n.label.length > 24 ? `${n.label.slice(0, 23)}…` : n.label;
            return (
              <g key={n.id}>
                <rect
                  x={p.cx - NODE_W / 2}
                  y={p.cy - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1.5}
                />
                <text x={p.cx} y={p.cy - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="currentColor">
                  {label}
                </text>
                <text x={p.cx} y={p.cy + 12} textAnchor="middle" fontSize={9} fill={style.stroke} opacity={0.85}>
                  {n.kind}
                </text>
              </g>
            );
          })}
        </svg>
      </Card>
      <p className="mt-2 text-center text-xs opacity-50">
        Reads your saved Canvas and Proof · arrows point from a piece to what it builds on
      </p>
    </main>
  );
}

function Stat({ label, value, tone = "ok" }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-semibold ${
        tone === "warn"
          ? "bg-amber-400/10 text-amber-600 dark:text-amber-300"
          : "bg-black/[0.04] dark:bg-white/[0.06]"
      }`}
    >
      <span className="font-extrabold">{value}</span> <span className="opacity-70">{label}</span>
    </span>
  );
}
