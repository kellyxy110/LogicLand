"use client";
// The file explorer. Lists the project's files, opens one on click, and lets a
// learner add or remove files — a real project surface, not a single box.
import { FilePlus2, FileCode2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStudioProject } from "./useStudioProject";

export function FileTree() {
  const { files, activeId, open, addFile, deleteFile } = useStudioProject();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function commit() {
    const trimmed = name.trim();
    if (trimmed) addFile(trimmed);
    setName("");
    setAdding(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wide opacity-55">Files</span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded p-1 opacity-70 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
          aria-label="New file"
          title="New file"
        >
          <FilePlus2 className="h-4 w-4" />
        </button>
      </div>

      {adding && (
        <div className="px-2 pb-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setName("");
                setAdding(false);
              }
            }}
            onBlur={commit}
            placeholder="about.html"
            className="w-full rounded-md border border-black/10 bg-white px-2 py-1 font-mono text-xs outline-none focus:border-brand dark:border-white/15 dark:bg-slate-800"
          />
        </div>
      )}

      <ul className="flex-1 overflow-y-auto px-1 pb-2">
        {files.map((f) => {
          const active = f.id === activeId;
          return (
            <li key={f.id} className="group">
              <div
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                  active ? "bg-brand/15 font-semibold text-brand" : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => open(f.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <FileCode2 className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate font-mono text-xs">{f.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteFile(f.id)}
                  className="opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-60 group-hover:hover:opacity-100"
                  aria-label={`Delete ${f.name}`}
                  title={`Delete ${f.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
