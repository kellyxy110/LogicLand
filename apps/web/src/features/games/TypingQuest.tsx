"use client";
// Typing Quest — the same maze engine, but the explorer *types* commands instead
// of tapping. This builds keyboard confidence and real coding muscle memory. The
// parser turns typos into gentle hints ("Did you mean RIGHT?") — never red errors.
import { Button, RoboAvatar } from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMMAND_GRAMMAR } from "@/data/commands";
import { friendlyHint, parseCommands } from "@/lib/engines/command-parser";
import type { TypingQuestData } from "@/types/game";
import { SpeakerButton } from "@/features/voice/SpeakerButton";
import { CommandChip } from "./CommandChip";
import { MazeBoard } from "./MazeBoard";
import { useMazeRun } from "./useMazeRun";

interface TypingQuestProps {
  slug: string;
  data: TypingQuestData;
  onWin: (starsCollected: number) => void;
}

export function TypingQuest({ slug, data, onWin }: TypingQuestProps) {
  const run = useMazeRun(slug, data.maze);
  const [text, setText] = useState("");
  const notified = useRef(false);

  const parsed = useMemo(() => parseCommands(text, COMMAND_GRAMMAR), [text]);
  const hint = friendlyHint(parsed);

  useEffect(() => {
    if (run.phase === "won" && !notified.current) {
      notified.current = true;
      onWin(run.result?.starsCollected ?? 0);
    }
    if (run.phase === "building") notified.current = false;
  }, [run.phase, run.result, onWin]);

  const building = run.phase === "building";
  const example = data.sequence.slice(0, 3).join(" ");
  const speech =
    run.message ??
    (run.phase === "won"
      ? "Amazing typing! 🎉"
      : run.phase === "failed"
        ? "Nice try! Check the path and type again."
        : data.maze.hint ?? `Try typing: ${example}…`);

  function handleRun() {
    if (parsed.tokens.length === 0) return;
    run.run(parsed.tokens);
  }

  function reset() {
    setText("");
    run.edit();
  }

  return (
    <div className="space-y-4">
      <MazeBoard
        maze={data.maze}
        robot={run.robot}
        visitedStars={run.visitedStars}
        won={run.phase === "won"}
      />

      <div className="flex items-center gap-3 rounded-2xl bg-brand/5 p-3">
        <RoboAvatar
          mood={run.phase === "won" ? "happy" : run.phase === "playing" ? "thinking" : "idle"}
          size={44}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={speech}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex-1 text-sm font-semibold"
          >
            {speech}
          </motion.p>
        </AnimatePresence>
        <SpeakerButton text={speech} label="Hear Robo" size="sm" />
      </div>

      {building && (
        <>
          <label htmlFor="typing-input" className="sr-only">
            Type your commands
          </label>
          <textarea
            id="typing-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            spellCheck={false}
            autoCapitalize="characters"
            placeholder={`e.g. ${example}`}
            className="w-full resize-none rounded-2xl border-2 border-brand/25 bg-white p-4 text-lg font-semibold uppercase tracking-wide text-brand shadow-inner outline-none focus:border-brand/60 dark:bg-white/10"
          />

          {/* Live recognized tokens */}
          {parsed.tokens.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {parsed.tokens.map((cmd, i) => (
                <CommandChip key={`${cmd}-${i}`} id={cmd} variant="token" />
              ))}
            </div>
          )}

          {/* Friendly hint (typos, empty) */}
          {hint && (
            <p className="rounded-xl bg-sunburst/10 px-3 py-2 text-sm font-semibold text-sunburst">
              💡 {hint}
            </p>
          )}
        </>
      )}

      <div className="flex items-center justify-center gap-3">
        {building ? (
          <Button size="lg" onClick={handleRun} disabled={parsed.tokens.length === 0}>
            <Play className="h-5 w-5 fill-white" /> Send Robo
          </Button>
        ) : run.phase === "playing" ? (
          <p className="py-2 text-sm font-semibold opacity-60">Robo is moving…</p>
        ) : run.phase === "failed" ? (
          <Button size="lg" onClick={reset}>
            <RotateCcw className="h-5 w-5" /> Try Again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
