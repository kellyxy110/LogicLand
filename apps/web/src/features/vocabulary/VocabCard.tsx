"use client";
// A single Word Wall card. Front shows the word + its picture; tap to flip and
// reveal the meaning with an example. A speaker button reads it aloud so a child
// who can't read yet still learns the word. Fully keyboard-operable.
import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "@logicland/ui";
import { SpeakerButton } from "@/features/voice/SpeakerButton";
import type { VocabWord } from "@/types/vocabulary";

export function VocabCard({ entry, index }: { entry: VocabWord; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const spoken = `${entry.word}. ${entry.meaning}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="[perspective:1200px]"
    >
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={`${entry.word}. Tap to ${flipped ? "hide" : "see"} what it means.`}
        className="block h-52 w-full rounded-3xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          {/* Front */}
          <Card className="absolute inset-0 flex flex-col items-center justify-center gap-2 [backface-visibility:hidden]">
            <span className="text-6xl" aria-hidden>
              {entry.emoji}
            </span>
            <span className="font-display text-2xl font-extrabold">{entry.word}</span>
            <div className="mt-1 flex items-center gap-2">
              <SpeakerButton text={spoken} label={`Hear the word ${entry.word}`} size="sm" />
              <span className="text-xs font-semibold opacity-50">tap to flip</span>
            </div>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 flex flex-col justify-center gap-3 bg-brand/5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                {entry.emoji}
              </span>
              <span className="font-display text-lg font-bold text-brand">{entry.word}</span>
              <SpeakerButton
                text={spoken}
                label={`Hear the word ${entry.word}`}
                size="sm"
                className="ml-auto"
              />
            </div>
            <p className="text-sm font-semibold leading-snug">{entry.meaning}</p>
            <p className="text-xs italic opacity-70">“{entry.example}”</p>
          </Card>
        </motion.div>
      </button>
    </motion.div>
  );
}
