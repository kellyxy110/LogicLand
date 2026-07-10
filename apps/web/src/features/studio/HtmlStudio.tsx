"use client";
// HTML Coding Studio — the child's first real coding workflow, VS Code-shaped:
// a file explorer, an editor, and a live preview, wrapped in Robo's guided HTML
// class. It plugs into the same MissionRunner seam as the games: when every
// lesson step is satisfied, it calls onWin so progress is awarded server-side.
import { useEffect, useRef } from "react";
import { currentStepIndex, isClassComplete } from "@/lib/engines/html-lesson";
import type { HtmlStudioData } from "@/types/studio";
import { AssignmentPanel } from "./AssignmentPanel";
import { CodeEditor } from "./CodeEditor";
import { FileExplorer } from "./FileExplorer";
import { HtmlPreview } from "./HtmlPreview";
import { LessonPanel } from "./LessonPanel";
import { useStudio } from "./useStudio";

interface HtmlStudioProps {
  slug: string;
  data: HtmlStudioData;
  onWin: (stars: number) => void;
}

export function HtmlStudio({ slug, data, onWin }: HtmlStudioProps) {
  const nodes = useStudio((s) => s.nodes);
  const load = useStudio((s) => s.load);
  // True once this mission's workspace is prepared (draft resumed or starter
  // seeded). We only judge completion after this, so a resumed draft never looks
  // momentarily empty and a *finished* module (revisited) isn't re-celebrated.
  const loaded = useStudio((s) => s.slug === slug);
  const notified = useRef(false);
  const sawIncomplete = useRef(false);

  useEffect(() => {
    load(slug, data);
  }, [slug, data, load]);

  const stepIndex = currentStepIndex(nodes, data.steps);

  useEffect(() => {
    if (!loaded) return;
    if (!isClassComplete(nodes, data.steps)) {
      sawIncomplete.current = true;
      return;
    }
    // Only celebrate a class the learner actually finished this visit — not one
    // that was already complete when they reopened it.
    if (sawIncomplete.current && !notified.current) {
      notified.current = true;
      onWin(1);
    }
  }, [loaded, nodes, data.steps, onWin]);

  return (
    <div className="space-y-4">
      <LessonPanel steps={data.steps} currentIndex={stepIndex} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="lg:h-[26rem]">
          <FileExplorer />
        </div>
        <div className="lg:h-[26rem]">
          <CodeEditor />
        </div>
        <div className="lg:h-[26rem]">
          <HtmlPreview previewFile={data.previewFile} />
        </div>
      </div>

      {data.assignment && (
        <AssignmentPanel slug={slug} assignment={data.assignment} />
      )}
    </div>
  );
}
