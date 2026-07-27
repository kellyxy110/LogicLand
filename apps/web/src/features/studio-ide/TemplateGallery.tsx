"use client";
// The "New Project" gallery — pick a template and it loads into Studio with its
// own brief + completion criteria. Grouped by category; each card shows the
// level, summary and objectives.
import { Card } from "@logicland/ui";
import { ArrowLeft, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LEVEL_LABEL,
  templatesByCategory,
  type TemplateLevel,
} from "@/lib/engines/project-templates";
import { useStudioProject } from "./useStudioProject";

const LEVEL_CLASS: Record<TemplateLevel, string> = {
  beginner: "bg-meadow/15 text-meadow",
  intermediate: "bg-brand/15 text-brand",
  advanced: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
};

export function TemplateGallery() {
  const router = useRouter();
  const loadTemplate = useStudioProject((s) => s.loadTemplate);
  const groups = templatesByCategory();

  const start = (files: { name: string; content: string }[], id: string) => {
    loadTemplate(files, id);
    router.push("/studio");
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
      <header className="mb-6">
        <Link href="/studio" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Start a project</h1>
        <p className="mt-1 opacity-75">
          Pick a template — each comes with a brief and goals that tick off as you build.
        </p>
      </header>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.category} aria-labelledby={`cat-${g.category}`}>
            <h2 id={`cat-${g.category}`} className="mb-3 font-display text-lg font-bold">
              {g.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.templates.map((t) => (
                <Card key={t.id} className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold leading-tight">{t.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${LEVEL_CLASS[t.level]}`}>
                      {LEVEL_LABEL[t.level]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm opacity-75">{t.summary}</p>
                  <ul className="mt-2 flex-1 space-y-1 text-xs">
                    {t.objectives.slice(0, 3).map((o) => (
                      <li key={o} className="flex items-start gap-1.5">
                        <Target className="mt-0.5 h-3 w-3 shrink-0 text-brand/70" aria-hidden />
                        <span className="opacity-80">{o}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => start(t.files, t.id)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white hover:opacity-90"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Use this project
                  </button>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
