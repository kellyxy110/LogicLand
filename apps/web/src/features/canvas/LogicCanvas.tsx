"use client";
// LogicLand Canvas (ADR-021, V2 by ADR-025) — Excalidraw freehand + a semantic
// layer that is now a GRAPH: blocks can be linked with typed edges, reordered,
// duplicated, explained by the engine (deterministic fallback) and exported to
// Markdown. Autosave/recovery, bounded version history and safe export remain.
// The pure engine (lib/engines/canvas-doc) owns the document; this is the
// workspace around it.
import { Card } from "@logicland/ui";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowUp, Copy, Download, GitBranch, History, Link2, Save, Sparkles, Trash2, Unlink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAgeMode } from "@/features/age-mode/AgeModeProvider";
import { explainCanvasBlock, type ExplainBlockResult } from "@/app/actions/canvas";
import {
  type CanvasDoc,
  type CanvasRelation,
  type CanvasSnapshot,
  RELATION_META,
  addBlock,
  availableBlockKinds,
  blockInsight,
  blockLabel,
  blockMeta,
  canUseGraph,
  createDoc,
  duplicateBlock,
  exportJson,
  exportMarkdown,
  exportText,
  linkBlocks,
  migrateDoc,
  moveBlock,
  pushSnapshot,
  removeBlock,
  restoreSnapshot,
  setScene,
  toGraph,
  unlinkBlocks,
  updateBlock,
} from "@/lib/engines/canvas-doc";

const DOC_KEY = "logicland:canvas:doc:v2";
const HISTORY_KEY = "logicland:canvas:history:v2";
const LEGACY_DOC_KEY = "logicland:canvas:doc:v1";

const DrawSurface = dynamic(() => import("./DrawSurface").then((m) => m.DrawSurface), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm opacity-60">Loading canvas…</div>,
});

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function LogicCanvas() {
  const { mode } = useAgeMode();
  const [doc, setDoc] = useState<CanvasDoc>(() => createDoc("My canvas"));
  const [history, setHistory] = useState<CanvasSnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [recovered, setRecovered] = useState(false);
  // Per-block "Explain" results and which block's link form is open.
  const [explains, setExplains] = useState<Record<string, ExplainBlockResult | "loading">>({});
  const [linking, setLinking] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const graphOn = canUseGraph(mode);

  // Load (recovery + v1→v2 migration) once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DOC_KEY) ?? window.localStorage.getItem(LEGACY_DOC_KEY);
      if (raw) {
        setDoc(migrateDoc(JSON.parse(raw) as Partial<CanvasDoc>));
        setRecovered(true);
      }
      const h = window.localStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h) as CanvasSnapshot[]);
    } catch {
      /* start fresh */
    }
    setHydrated(true);
  }, []);

  // Debounced autosave (only after hydration, so we never overwrite saved work).
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(DOC_KEY, JSON.stringify(doc));
      } catch {
        /* storage full/unavailable */
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [doc, hydrated]);

  const onSceneChange = useCallback((elements: unknown) => {
    if (sceneTimer.current) clearTimeout(sceneTimer.current);
    sceneTimer.current = setTimeout(() => {
      setDoc((d) => setScene(d, elements));
    }, 1000);
  }, []);

  const saveVersion = () => {
    setHistory((h) => {
      const next = pushSnapshot(h, doc);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const restore = (snap: CanvasSnapshot) => setDoc(restoreSnapshot(snap));

  const explain = async (blockId: string) => {
    const block = doc.blocks.find((b) => b.id === blockId);
    if (!block) return;
    setExplains((e) => ({ ...e, [blockId]: "loading" }));
    try {
      const res = await explainCanvasBlock({ kind: block.kind, text: block.text });
      setExplains((e) => ({ ...e, [blockId]: res }));
    } catch {
      setExplains((e) => ({
        ...e,
        [blockId]: { source: "example", text: "Couldn't fetch a hint — try again in a moment.", safe: true },
      }));
    }
  };

  const kinds = availableBlockKinds(mode);
  const graph = toGraph(doc);

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1500px] flex-col px-3 py-3">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="canvas-title">
          Canvas title
        </label>
        <input
          id="canvas-title"
          value={doc.title}
          onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 font-display text-lg font-extrabold outline-none focus:border-brand dark:border-white/15"
        />
        {recovered && (
          <span className="rounded-full bg-meadow/10 px-2 py-0.5 text-[0.65rem] font-bold text-meadow">recovered</span>
        )}
        {graphOn && (doc.blocks.length > 0 || doc.edges.length > 0) && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-bold text-brand">
            {graph.nodes.length} blocks · {graph.edges.length} links
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {graphOn && (
            <a
              href="/lab/graph"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-indigo-500 opacity-80 hover:opacity-100"
            >
              <GitBranch className="h-3.5 w-3.5" /> Graph
            </a>
          )}
          <button
            type="button"
            onClick={saveVersion}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            <Save className="h-3.5 w-3.5" /> Save version
          </button>
          <button
            type="button"
            onClick={() => download(`${doc.title || "canvas"}.md`, exportMarkdown(doc), "text/markdown")}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" /> Markdown
          </button>
          <button
            type="button"
            onClick={() => download(`${doc.title || "canvas"}.json`, exportJson(doc), "application/json")}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[1fr_340px]">
        <section className="min-h-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          {hydrated ? (
            <DrawSurface initialElements={doc.scene} onSceneChange={onSceneChange} />
          ) : (
            <div className="grid h-full place-items-center text-sm opacity-60">Loading canvas…</div>
          )}
        </section>

        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          {/* Age-adaptive block toolbar */}
          <div className="rounded-xl border border-black/10 p-2 dark:border-white/10">
            <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide opacity-55">Add a block</p>
            <div className="flex flex-wrap gap-1.5">
              {kinds.map((k) => (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => setDoc((d) => addBlock(d, k.kind))}
                  className="rounded-full border-2 border-brand/20 px-2.5 py-1 text-xs font-bold text-brand hover:border-brand/50"
                >
                  + {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* Semantic blocks */}
          <div className="space-y-2">
            {doc.blocks.length === 0 && (
              <p className="px-1 text-xs opacity-50">
                Add note, flow, code or equation blocks — structured pieces other tools can use.
              </p>
            )}
            {doc.blocks.map((b, i) => {
              const meta = blockMeta(b.kind);
              const mono = b.kind === "code" || b.kind === "equation";
              const others = doc.blocks.filter((x) => x.id !== b.id);
              const outgoing = doc.edges.filter((e) => e.from === b.id);
              const ex = explains[b.id];
              return (
                <Card key={b.id} className="p-2">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-brand">
                      {meta?.label ?? b.kind}
                    </span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setDoc((d) => moveBlock(d, b.id, "up"))}
                        disabled={i === 0}
                        className="rounded p-0.5 opacity-50 hover:opacity-100 disabled:opacity-20"
                        aria-label={`Move ${meta?.label ?? b.kind} block up`}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoc((d) => moveBlock(d, b.id, "down"))}
                        disabled={i === doc.blocks.length - 1}
                        className="rounded p-0.5 opacity-50 hover:opacity-100 disabled:opacity-20"
                        aria-label={`Move ${meta?.label ?? b.kind} block down`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoc((d) => duplicateBlock(d, b.id))}
                        className="rounded p-0.5 opacity-50 hover:opacity-100"
                        aria-label={`Duplicate ${meta?.label ?? b.kind} block`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {graphOn && others.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setLinking((l) => (l === b.id ? null : b.id))}
                          className="rounded p-0.5 opacity-50 hover:text-brand hover:opacity-100"
                          aria-label={`Link ${meta?.label ?? b.kind} block to another`}
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDoc((d) => removeBlock(d, b.id))}
                        className="rounded p-0.5 opacity-50 hover:text-rose-500 hover:opacity-100"
                        aria-label={`Delete ${meta?.label ?? b.kind} block`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <label className="sr-only" htmlFor={`block-${b.id}`}>
                    {meta?.label ?? b.kind} content
                  </label>
                  <textarea
                    id={`block-${b.id}`}
                    value={b.text}
                    onChange={(e) => setDoc((d) => updateBlock(d, b.id, { text: e.target.value }))}
                    rows={mono ? 3 : 2}
                    placeholder={meta?.placeholder}
                    spellCheck={!mono}
                    className={`w-full resize-none rounded-lg border border-black/10 bg-transparent p-2 text-sm outline-none focus:border-brand dark:border-white/15 ${
                      mono ? "font-mono text-xs" : ""
                    }`}
                  />

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[0.65rem] opacity-45">{blockInsight(b)}</span>
                    <button
                      type="button"
                      onClick={() => explain(b.id)}
                      disabled={ex === "loading"}
                      className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-brand opacity-80 hover:opacity-100 disabled:opacity-40"
                    >
                      <Sparkles className="h-3 w-3" /> {ex === "loading" ? "Thinking…" : "Explain"}
                    </button>
                  </div>

                  {/* Link form */}
                  {graphOn && linking === b.id && others.length > 0 && (
                    <LinkForm
                      others={others.map((o) => ({ id: o.id, label: blockLabel(o) }))}
                      onAdd={(to, relation) => {
                        setDoc((d) => linkBlocks(d, b.id, to, relation));
                        setLinking(null);
                      }}
                      onCancel={() => setLinking(null)}
                    />
                  )}

                  {/* Outgoing edges */}
                  {graphOn && outgoing.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {outgoing.map((e) => {
                        const rel = RELATION_META.find((r) => r.relation === e.relation);
                        const target = doc.blocks.find((x) => x.id === e.to);
                        return (
                          <li key={e.id} className="flex items-center gap-1 text-[0.65rem] opacity-70">
                            <span className="opacity-60">{rel?.arrow}</span>
                            <span className="font-semibold">{rel?.label}</span>
                            <span className="truncate">{target ? blockLabel(target) : "?"}</span>
                            <button
                              type="button"
                              onClick={() => setDoc((d) => unlinkBlocks(d, e.id))}
                              className="ml-auto rounded p-0.5 opacity-50 hover:text-rose-500 hover:opacity-100"
                              aria-label="Remove connection"
                            >
                              <Unlink className="h-3 w-3" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Explanation */}
                  {ex && ex !== "loading" && (
                    <div className="mt-1.5 rounded-lg bg-black/[0.03] p-2 text-xs dark:bg-white/[0.04]">
                      <span
                        className={`mr-1.5 rounded px-1 py-0.5 text-[0.55rem] font-bold uppercase ${
                          ex.source === "ai" ? "bg-brand/15 text-brand" : "bg-black/10 opacity-60 dark:bg-white/10"
                        }`}
                      >
                        {ex.source === "ai" ? "AI Helper" : "Hint"}
                      </span>
                      {ex.text}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Version history */}
          {history.length > 0 && (
            <div className="rounded-xl border border-black/10 p-2 dark:border-white/10">
              <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide opacity-55">
                <History className="h-3.5 w-3.5" /> Versions
              </p>
              <ul className="space-y-1">
                {history.map((s) => (
                  <li key={s.at} className="flex items-center gap-2 text-xs">
                    <span className="opacity-70">{s.label}</span>
                    <span className="opacity-45">· {s.doc.blocks.length} blocks</span>
                    <button
                      type="button"
                      onClick={() => restore(s)}
                      className="ml-auto font-bold text-brand hover:underline"
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => download(`${doc.title || "canvas"}.txt`, exportText(doc), "text/plain")}
            className="rounded-full border-2 border-black/10 px-3 py-1.5 text-xs font-semibold opacity-75 hover:opacity-100 dark:border-white/15"
          >
            Export as text
          </button>
        </aside>
      </div>
    </main>
  );
}

// Inline form to connect this block to another with a typed relation (ADR-025).
function LinkForm({
  others,
  onAdd,
  onCancel,
}: {
  others: { id: string; label: string }[];
  onAdd: (to: string, relation: CanvasRelation) => void;
  onCancel: () => void;
}) {
  const [to, setTo] = useState(others[0]?.id ?? "");
  const [relation, setRelation] = useState<CanvasRelation>("depends-on");
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-brand/20 p-1.5">
      <select
        value={relation}
        onChange={(e) => setRelation(e.target.value as CanvasRelation)}
        aria-label="Connection type"
        className="rounded border border-black/10 bg-transparent px-1 py-0.5 text-[0.65rem] dark:border-white/15"
      >
        {RELATION_META.map((r) => (
          <option key={r.relation} value={r.relation}>
            {r.label}
          </option>
        ))}
      </select>
      <select
        value={to}
        onChange={(e) => setTo(e.target.value)}
        aria-label="Connect to block"
        className="min-w-0 flex-1 rounded border border-black/10 bg-transparent px-1 py-0.5 text-[0.65rem] dark:border-white/15"
      >
        {others.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => to && onAdd(to, relation)}
        className="rounded-full bg-brand px-2 py-0.5 text-[0.65rem] font-bold text-white"
      >
        Link
      </button>
      <button type="button" onClick={onCancel} className="rounded-full px-1.5 py-0.5 text-[0.65rem] opacity-60">
        Cancel
      </button>
    </div>
  );
}
