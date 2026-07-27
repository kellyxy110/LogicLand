"use client";
// The `logic` CLI terminal (ADR-016) — a teaching shell inside Studio. It runs
// nothing on a real system; it renders the pure engine's guidance, and shows the
// real Git command under every `logic git …` so learners bridge to real tools.
import { TerminalSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { runLogicCommand, type CliLine } from "@/lib/engines/logic-cli";

const WELCOME: CliLine[] = [
  { tone: "muted", text: "LogicLand terminal — type " },
  { tone: "info", text: "help" },
];

const TONE_CLASS: Record<CliLine["tone"], string> = {
  cmd: "text-brand font-semibold",
  info: "opacity-90",
  real: "text-emerald-500",
  error: "text-rose-500",
  muted: "opacity-55",
};

export function LogicTerminal() {
  const [lines, setLines] = useState<CliLine[]>(WELCOME);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function submit() {
    const cmd = input;
    if (!cmd.trim()) return;
    const res = runLogicCommand(cmd);
    setInput("");
    if (res.clear) {
      setLines([]);
      return;
    }
    setLines((prev) => [...prev, { tone: "cmd", text: `logic> ${cmd}` }, ...res.lines]);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-black/10 bg-slate-950 text-slate-100 dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5">
        <TerminalSquare className="h-4 w-4 opacity-70" />
        <span className="text-xs font-bold uppercase tracking-wide opacity-70">Terminal</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((l, i) => (
          <div key={i} className={`whitespace-pre-wrap break-words ${TONE_CLASS[l.tone]}`}>
            {l.text}
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-brand">logic&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="LogicLand terminal input"
            className="flex-1 bg-transparent font-mono text-xs text-slate-100 outline-none"
            placeholder='try: git save "my first change"'
          />
        </div>
      </div>
    </div>
  );
}
