"use client";
// LogicLand Studio (ADR-013) — a genuine browser IDE: file explorer, tabbed
// Monaco editor, and a live run/preview + console. The "what can I build?"
// environment. Monaco is dynamically imported (ssr:false) so its chunk only
// loads here, never in the young-learner bundles.
import dynamic from "next/dynamic";
import { FolderCode, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { languageForFile } from "@/lib/engines/studio-project";
import { useStudioProject } from "./useStudioProject";
import { FileTree } from "./FileTree";
import { EditorTabs } from "./EditorTabs";
import { RunPreview } from "./RunPreview";

const MonacoPane = dynamic(() => import("./MonacoPane").then((m) => m.MonacoPane), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm opacity-60">Loading editor…</div>
  ),
});

export function StudioIDE() {
  const { files, activeId, hydrated, hydrate, updateContent, reset } = useStudioProject();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const active = files.find((f) => f.id === activeId) ?? null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1600px] flex-col px-3 py-3">
      <header className="mb-2 flex items-center gap-2">
        <FolderCode className="h-5 w-5 text-brand" />
        <h1 className="font-display text-lg font-extrabold">LogicLand Studio</h1>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand">
          Build
        </span>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset the project to the starter files? Your changes will be lost.")) {
              reset();
            }
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[190px_1fr_minmax(320px,42%)]">
        {/* Explorer */}
        <aside className="min-h-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          {hydrated ? (
            <FileTree />
          ) : (
            <div className="p-3 text-xs opacity-50">Loading files…</div>
          )}
        </aside>

        {/* Editor */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <EditorTabs />
          <div className="min-h-0 flex-1">
            {active ? (
              <MonacoPane
                key={active.id}
                value={active.content}
                language={languageForFile(active.name)}
                onChange={(v) => updateContent(active.id, v)}
              />
            ) : (
              <div className="grid h-full place-items-center text-sm opacity-60">
                Pick a file to start editing.
              </div>
            )}
          </div>
        </section>

        {/* Run / Preview */}
        <section className="min-h-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <RunPreview />
        </section>
      </div>
    </div>
  );
}
