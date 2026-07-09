"use client";
// Robo's speech bubble, shared by the tap games. Announces the current prompt or
// encouragement, and voices it on tap for early readers.
import { RoboAvatar } from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import { SpeakerButton } from "@/features/voice/SpeakerButton";

type Mood = "idle" | "happy" | "thinking";

export function GameSpeech({ text, mood = "idle" }: { text: string; mood?: Mood }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-brand/5 p-3">
      <RoboAvatar mood={mood} size={44} />
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex-1 text-sm font-semibold"
        >
          {text}
        </motion.p>
      </AnimatePresence>
      <SpeakerButton text={text} label="Hear Robo" size="sm" />
    </div>
  );
}

/** Little step dots so the child can see how far they've come. */
export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            i < current ? "bg-meadow" : i === current ? "bg-brand" : "bg-black/15 dark:bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}
