"use client";
// Open-file tabs across the top of the editor, VS Code style. Click to focus,
// × to close (closing never deletes the file — it stays in the explorer).
import { X } from "lucide-react";
import { useStudioProject } from "./useStudioProject";

export function EditorTabs() {
  const { files, openTabs, activeId, open, closeTab } = useStudioProject();
  const byId = (id: string) => files.find((f) => f.id === id);

  if (openTabs.length === 0) return null;

  return (
    <div className="flex items-stretch overflow-x-auto border-b border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
      {openTabs.map((id) => {
        const f = byId(id);
        if (!f) return null;
        const active = id === activeId;
        return (
          <div
            key={id}
            className={`flex shrink-0 items-center gap-2 border-r border-black/10 px-3 py-2 dark:border-white/10 ${
              active ? "bg-white dark:bg-slate-900" : "opacity-70 hover:opacity-100"
            }`}
          >
            <button
              type="button"
              onClick={() => open(id)}
              className="font-mono text-xs font-semibold"
            >
              {f.name}
            </button>
            <button
              type="button"
              onClick={() => closeTab(id)}
              className="rounded p-0.5 opacity-60 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              aria-label={`Close ${f.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
