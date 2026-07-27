"use client";
// The run surface: a live browser preview + a console. This is ADR-014's browser
// execution lane — the project's HTML/CSS/JS is assembled into one document and
// run in a sandboxed iframe (allow-scripts so JS actually runs, but no
// same-origin, so it can't touch the app). console.* and errors are streamed
// back through postMessage and shown in the console panel.
import { Eye, Play, Terminal, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildRunnableDoc } from "@/lib/engines/studio-project";
import { useStudioProject } from "./useStudioProject";

interface LogLine {
  level: string;
  text: string;
}

export function RunPreview() {
  const files = useStudioProject((s) => s.files);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [tab, setTab] = useState<"preview" | "console">("preview");
  const noEntry = useRef(false);

  const run = useCallback(() => {
    const doc = buildRunnableDoc(files);
    noEntry.current = doc === null;
    setLogs([]);
    setSrcDoc(doc ?? "");
    setRunId((n) => n + 1);
  }, [files]);

  // Auto-run once on first mount so the starter project is alive immediately.
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data;
      if (d && d.__logicland_studio === true && typeof d.text === "string") {
        setLogs((prev) => [...prev.slice(-199), { level: String(d.level), text: d.text }]);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const errorCount = logs.filter((l) => l.level === "error").length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b border-black/10 bg-black/[0.03] px-2 py-1.5 dark:border-white/10 dark:bg-white/5">
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
          <Eye className="h-3.5 w-3.5" /> Preview
        </TabButton>
        <TabButton active={tab === "console"} onClick={() => setTab("console")}>
          <Terminal className="h-3.5 w-3.5" /> Console
          {errorCount > 0 && (
            <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[0.6rem] font-bold text-white">
              {errorCount}
            </span>
          )}
        </TabButton>
        <button
          type="button"
          onClick={run}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5" /> Run
        </button>
      </div>

      <div className="relative flex-1 bg-white dark:bg-slate-950">
        {tab === "preview" ? (
          noEntry.current ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm opacity-60">
              Add an <b className="mx-1 font-mono">index.html</b> file, then press Run.
            </div>
          ) : (
            <iframe
              key={runId}
              title="Project preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={srcDoc ?? ""}
              className="h-full w-full border-0 bg-white"
            />
          )
        ) : (
          <div className="h-full overflow-y-auto p-3 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="opacity-50">Console output appears here when your code runs.</p>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  className={`flex gap-2 border-b border-black/5 py-1 dark:border-white/5 ${
                    l.level === "error"
                      ? "text-rose-500"
                      : l.level === "warn"
                        ? "text-amber-500"
                        : ""
                  }`}
                >
                  {l.level === "error" && <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />}
                  <span className="whitespace-pre-wrap break-words">{l.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-white shadow-sm dark:bg-slate-900" : "opacity-60 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}
