"use client";
// The editor pane. Shows the open file's name as a tab and a big, calm
// monospace textarea bound to its contents. Folders and the empty state get a
// friendly nudge instead of a blank box.
import { useStudio } from "./useStudio";

export function CodeEditor() {
  const { nodes, selectedId, updateContent } = useStudio();
  const file = nodes.find((n) => n.id === selectedId && n.kind === "file");

  if (!file) {
    return (
      <div className="grid h-full min-h-[16rem] place-items-center rounded-2xl bg-black/[0.03] p-6 text-center dark:bg-white/5">
        <p className="text-sm opacity-60">
          📄 Pick a file (or make one) to start coding!
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-black/10 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <span aria-hidden>📄</span>
        <span className="text-sm font-bold">{file.name}</span>
      </div>
      <label htmlFor="studio-editor" className="sr-only">
        Code for {file.name}
      </label>
      <textarea
        id="studio-editor"
        value={file.content}
        onChange={(e) => updateContent(file.id, e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={"<h1>Hello!</h1>"}
        className="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
      />
    </div>
  );
}
