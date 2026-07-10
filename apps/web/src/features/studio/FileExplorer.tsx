"use client";
// The Studio sidebar — a tiny, kid-sized VS Code explorer. Two big buttons make
// a folder or a file; new items are named with a friendly inline input (no
// browser prompts). Files open in the editor; folders become the home for the
// next new item, so "make a folder, then a file inside it" just works.
import { FileCode, FilePlus2, Folder, FolderPlus } from "lucide-react";
import { useState } from "react";
import type { FsNode } from "@/types/studio";
import { useStudio } from "./useStudio";

/** Where a new item should be created, based on what's selected. */
function parentForNew(nodes: FsNode[], selectedId: string | null): string | null {
  if (!selectedId) return null;
  const sel = nodes.find((n) => n.id === selectedId);
  if (!sel) return null;
  return sel.kind === "folder" ? sel.id : sel.parentId;
}

export function FileExplorer() {
  const { nodes, selectedId, addFolder, addFile, select } = useStudio();
  const [creating, setCreating] = useState<"folder" | "file" | null>(null);
  const [name, setName] = useState("");

  function start(kind: "folder" | "file") {
    setCreating(kind);
    setName(kind === "file" ? "index.html" : "my-website");
  }

  function confirm() {
    const clean = name.trim();
    if (!clean) return setCreating(null);
    const parent = parentForNew(nodes, selectedId);
    if (creating === "folder") addFolder(parent, clean);
    else addFile(parent, clean);
    setCreating(null);
    setName("");
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide opacity-60">
          Files
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => start("folder")}
            aria-label="New folder"
            title="New folder"
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => start("file")}
            aria-label="New file"
            title="New file"
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FilePlus2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {creating && (
        <div className="mb-2 flex items-center gap-1 rounded-lg bg-white p-1 dark:bg-white/10">
          {creating === "folder" ? (
            <Folder className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          ) : (
            <FileCode className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          )}
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirm();
              if (e.key === "Escape") setCreating(null);
            }}
            onBlur={confirm}
            aria-label={`Name your ${creating}`}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {nodes.length === 0 && !creating ? (
          <p className="px-1 py-3 text-xs opacity-50">
            Tap ＋ to make your first folder!
          </p>
        ) : (
          <TreeNodes nodes={nodes} parentId={null} depth={0} selectedId={selectedId} onSelect={select} />
        )}
      </div>
    </div>
  );
}

function TreeNodes({
  nodes,
  parentId,
  depth,
  selectedId,
  onSelect,
}: {
  nodes: FsNode[];
  parentId: string | null;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const children = nodes.filter((n) => n.parentId === parentId);
  if (children.length === 0) return null;
  return (
    <ul className="space-y-0.5">
      {children.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            aria-current={node.id === selectedId}
            style={{ paddingLeft: `${depth * 0.85 + 0.4}rem` }}
            className={`flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-sm font-semibold ${
              node.id === selectedId
                ? "bg-brand/15 text-brand"
                : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {node.kind === "folder" ? (
              <Folder className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            ) : (
              <FileCode className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {node.kind === "folder" && (
            <TreeNodes
              nodes={nodes}
              parentId={node.id}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
