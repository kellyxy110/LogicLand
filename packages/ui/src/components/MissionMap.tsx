"use client";
import { Check, Lock, Play } from "lucide-react";
import { cn } from "../cn";

export interface MissionNode {
  slug: string;
  title: string;
  skill: string;
  state: "done" | "current" | "locked";
}

/** A winding path of mission nodes — the child's adventure map. */
export function MissionMap({
  nodes,
  onSelect,
}: {
  nodes: MissionNode[];
  onSelect?: (slug: string) => void;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {nodes.map((n, i) => {
        const Icon = n.state === "done" ? Check : n.state === "current" ? Play : Lock;
        const interactive = n.state !== "locked";
        return (
          <li key={n.slug} className={cn(i % 2 === 0 ? "self-start" : "self-end")}>
            <button
              disabled={!interactive}
              onClick={() => interactive && onSelect?.(n.slug)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                n.state === "current" && "bg-brand text-white shadow-lg",
                n.state === "done" && "bg-meadow/15 text-meadow",
                n.state === "locked" && "bg-black/5 text-black/40 dark:bg-white/5 dark:text-white/40",
                interactive && "hover:scale-[1.02]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>
                <span className="block font-semibold leading-tight">{n.title}</span>
                <span className="block text-xs opacity-80">{n.skill}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
