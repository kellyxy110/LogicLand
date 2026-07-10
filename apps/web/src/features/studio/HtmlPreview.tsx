"use client";
// The live preview. Renders the project's HTML file in a sandboxed iframe so the
// child sees their page come alive as they type. sandbox="" blocks scripts,
// forms, and navigation — safe for young coders learning markup; we can widen it
// (e.g. allow-scripts) when JS lessons arrive.
import { Eye, ShieldCheck } from "lucide-react";
import { useStudio } from "./useStudio";
import { findFile } from "@/lib/engines/html-lesson";
import { findUnsafeHtml } from "@/lib/engines/html-safety";

export function HtmlPreview({ previewFile }: { previewFile: string }) {
  const nodes = useStudio((s) => s.nodes);
  const file = findFile(nodes, previewFile);
  const hasContent = !!file && file.content.trim().length > 0;
  // The iframe sandbox="" is the real guard; this note just explains why a
  // <script> the child typed doesn't run, so it isn't confusing.
  const unsafe = hasContent ? findUnsafeHtml(file!.content) : [];

  return (
    <div className="flex h-full min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-black/10 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <Eye className="h-4 w-4 opacity-70" aria-hidden />
        <span className="text-sm font-bold">Preview</span>
      </div>
      {unsafe.length > 0 && (
        <p className="flex items-center gap-1.5 border-b border-black/10 bg-sunburst/10 px-3 py-1.5 text-xs font-semibold text-sunburst dark:border-white/10">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {unsafe[0].message}
        </p>
      )}
      {hasContent ? (
        <iframe
          title="Your web page preview"
          sandbox=""
          srcDoc={file!.content}
          className="flex-1 bg-white"
        />
      ) : (
        <div className="grid flex-1 place-items-center bg-white p-6 text-center dark:bg-slate-50">
          <p className="text-sm text-slate-500">
            Your web page will appear here.
            <br />
            Make <b>{previewFile}</b> and type some HTML!
          </p>
        </div>
      )}
    </div>
  );
}
