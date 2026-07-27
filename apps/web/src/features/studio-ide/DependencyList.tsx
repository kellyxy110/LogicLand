"use client";
// A compact "Packages" panel under the file explorer: the external dependencies
// the project uses, read deterministically from the files. Helps a learner see
// where their code ends and the outside world begins.
import { Boxes, Globe, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { detectDependencies, type DependencyKind } from "@/lib/engines/dependencies";
import { useStudioProject } from "./useStudioProject";

const KIND_META: Record<DependencyKind, { icon: LucideIcon; label: string }> = {
  web: { icon: Globe, label: "web" },
  python: { icon: Boxes, label: "py" },
  npm: { icon: Package, label: "npm" },
};

export function DependencyList() {
  const files = useStudioProject((s) => s.files);
  const deps = detectDependencies(files);

  return (
    <div className="border-t border-black/10 dark:border-white/10">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide opacity-55">
        Packages
      </div>
      {deps.length === 0 ? (
        <p className="px-3 pb-3 text-xs opacity-45">
          None yet — link a CDN script, or import a module.
        </p>
      ) : (
        <ul className="max-h-40 space-y-0.5 overflow-y-auto px-1 pb-2">
          {deps.map((d) => {
            const Icon = KIND_META[d.kind].icon;
            return (
              <li
                key={`${d.kind}:${d.name}`}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                <span className="truncate font-mono">{d.name}</span>
                <span className="ml-auto shrink-0 rounded bg-black/10 px-1 text-[0.6rem] font-bold opacity-60 dark:bg-white/10">
                  {KIND_META[d.kind].label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
