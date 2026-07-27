"use client";
// LogicLand Canvas (ADR-021) — Excalidraw freehand + a semantic-block layer,
// with autosave/recovery, bounded version history, safe export and an
// age-adaptive block toolbar. The pure engine (lib/engines/canvas-doc) owns the
// document; this component is the workspace around it.
import { Card } from "@logicland/ui";
import dynamic from "next/dynamic";
import { Download, History, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAgeMode } from "@/features/age-mode/AgeModeProvider";
import {
  type CanvasDoc,
  type CanvasSnapshot,
  addBlock,
  availableBlockKinds,
  blockMeta,
  createDoc,
  exportJson,
  exportText,
  pushSnapshot,
  removeBlock,
  restoreSnapshot,
  setScene,
  updateBlock,
} from "@/lib/engines/canvas-doc";

const DOC_KEY = "logicland:canvas:doc:v1";
const HISTORY_KEY = "logicland:canvas:history:v1";

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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load (recovery) once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DOC_KEY);
      if (raw) {
        setDoc(JSON.parse(raw) as CanvasDoc);
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

  const kinds = availableBlockKinds(mode);

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
          <span className="rounded-full bg-meadow/10 px-2 py-0.5 text-[0.65rem] font-bold text-meadow">
            recovered
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={saveVersion}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            <Save className="h-3.5 w-3.5" /> Save version
          </button>
          <button
            type="button"
            onClick={() => download(`${doc.title || "canvas"}.json`, exportJson(doc), "application/json")}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[1fr_320px]">
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
            {doc.blocks.map((b) => {
              const meta = blockMeta(b.kind);
              const mono = b.kind === "code" || b.kind === "equation";
              return (
                <Card key={b.id} className="p-2">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-brand">
                      {meta?.label ?? b.kind}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDoc((d) => removeBlock(d, b.id))}
                      className="ml-auto rounded p-0.5 opacity-50 hover:text-rose-500 hover:opacity-100"
                      aria-label={`Delete ${meta?.label ?? b.kind} block`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
