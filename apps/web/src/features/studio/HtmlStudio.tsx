"use client";
// HTML Coding Studio — the child's first real coding workflow, VS Code-shaped:
// a file explorer, an editor, and a live preview, wrapped in Robo's guided HTML
// class. It plugs into the same MissionRunner seam as the games: when every
// lesson step is satisfied, it calls onWin so progress is awarded server-side.
import { useEffect, useRef } from "react";
import { currentStepIndex, isClassComplete } from "@/lib/engines/html-lesson";
import type { HtmlStudioData } from "@/types/studio";
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
  const { nodes, load } = useStudio();
  const notified = useRef(false);

  useEffect(() => {
    load(slug);
  }, [slug, load]);

  const stepIndex = currentStepIndex(nodes, data.steps);

  useEffect(() => {
    if (isClassComplete(nodes, data.steps) && !notified.current) {
      notified.current = true;
      onWin(1);
    }
  }, [nodes, data.steps, onWin]);

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
    </div>
  );
}
