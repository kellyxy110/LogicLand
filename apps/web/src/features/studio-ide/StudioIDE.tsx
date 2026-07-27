"use client";
// LogicLand Studio (ADR-013) — a genuine browser IDE: file explorer, tabbed
// Monaco editor, and a live run/preview + console. The "what can I build?"
// environment. Monaco is dynamically imported (ssr:false) so its chunk only
// loads here, never in the young-learner bundles.
import dynamic from "next/dynamic";
import { FolderCode, RotateCcw, TerminalSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { languageForFile } from "@/lib/engines/studio-project";
import { loadMyStudioProject, saveMyStudioProject } from "@/app/actions/studio";
import { useStudioProject } from "./useStudioProject";
import { LogicTerminal } from "./LogicTerminal";
import { DependencyList } from "./DependencyList";
import { useAgeMode } from "@/features/age-mode/AgeModeProvider";
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
  const { files, activeId, hydrated, hydrate, hydrateFromServer, updateContent, reset } =
    useStudioProject();
  // True once we know the viewer is a student, so edits should persist to the DB.
  const serverBacked = useRef(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const { can, term } = useAgeMode();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load the student's saved workspace (the server is source of truth across
  // devices). A signed-in non-student, or any error, leaves the local project.
  useEffect(() => {
    let alive = true;
    loadMyStudioProject()
      .then((res) => {
        if (!alive || !res.isStudent) return;
        serverBacked.current = true;
        if (res.project && res.project.files.length > 0) {
          hydrateFromServer(res.project.files);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hydrateFromServer]);

  // Debounced save on any change — only once we know it's a student. Never
  // blocks editing; localStorage remains the offline cache.
  useEffect(() => {
    if (!serverBacked.current) return;
    const t = setTimeout(() => {
      void saveMyStudioProject(files.map((f) => ({ name: f.name, content: f.content })));
    }, 1200);
    return () => clearTimeout(t);
  }, [files]);

  const active = files.find((f) => f.id === activeId) ?? null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1600px] flex-col px-3 py-3">
      <header className="mb-2 flex items-center gap-2">
        <FolderCode className="h-5 w-5 text-brand" />
        <h1 className="font-display text-lg font-extrabold">LogicLand Studio</h1>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand">
          Build
        </span>
        {can("terminal") && (
          <button
            type="button"
            onClick={() => setShowTerminal((v) => !v)}
            aria-pressed={showTerminal}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 ${
              showTerminal ? "text-brand" : "opacity-70 hover:opacity-100"
            }`}
          >
            <TerminalSquare className="h-3.5 w-3.5" /> {term("terminal")}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset the project to the starter files? Your changes will be lost.")) {
              reset();
            }
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10 ${
            can("terminal") ? "" : "ml-auto"
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[190px_1fr_minmax(320px,42%)]">
        {/* Explorer */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          {hydrated ? (
            <>
              <div className="min-h-0 flex-1 overflow-hidden">
                <FileTree />
              </div>
              {can("dependencies") && <DependencyList />}
            </>
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

      {showTerminal && (
        <div className="mt-2 h-56 shrink-0">
          <LogicTerminal />
        </div>
      )}
    </div>
  );
}
