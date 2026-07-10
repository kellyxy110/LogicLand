"use client";
// Robo's Helper — the scaffolded-hint tutor. One hint at a time, never the
// answer. All text comes from the engine (already child-safety filtered).
import { AnimatePresence, motion } from "framer-motion";
import { RoboAvatar } from "@logicland/ui";
import { Send, X } from "lucide-react";
import { useState } from "react";
import { engine } from "@/lib/engine";

interface Turn {
  role: "child" | "robo";
  text: string;
}

export function AiHelper({ missionSlug }: { missionSlug?: string }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    { role: "robo", text: "Hi! I'm Robo's Helper. Stuck? Ask me for a hint!" },
  ]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setTurns((t) => [...t, { role: "child", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const reply = await engine.askTutor({
        student_id: "demo-student",
        question,
        mission_slug: missionSlug,
        hint_level: 1,
      });
      setTurns((t) => [...t, { role: "robo", text: reply.answer }]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "robo", text: "Let's try that again together!" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-xl transition hover:scale-105"
        aria-label="Ask Robo's Helper"
      >
        <RoboAvatar size={28} mood="idle" />
        Ask Robo
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-40 flex h-[26rem] w-[22rem] flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900"
          >
            <header className="flex items-center justify-between bg-brand px-4 py-3 text-white">
              <span className="font-display font-bold">Robo&apos;s Helper</span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={
                    t.role === "child"
                      ? "ml-auto max-w-[80%] rounded-2xl bg-brand px-3 py-2 text-sm text-white"
                      : "mr-auto max-w-[80%] rounded-2xl bg-black/5 px-3 py-2 text-sm dark:bg-white/10"
                  }
                >
                  {t.text}
                </div>
              ))}
              {busy && (
                <div className="mr-auto rounded-2xl bg-black/5 px-3 py-2 text-sm dark:bg-white/10">
                  Robo is thinking…
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-black/10 p-3 dark:border-white/10">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Ask for a hint…"
                className="flex-1 rounded-full bg-black/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40 dark:bg-white/10"
              />
              <button
                onClick={ask}
                disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
