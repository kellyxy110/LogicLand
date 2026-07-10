"use client";
// The Word Wall — the coding vocabulary for a world, as a grid of flip cards.
// Each card teaches one word with a picture, a meaning, and a voice. This is how
// early readers pick up the language of coding before they can read it.
import { RoboAvatar } from "@logicland/ui";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SpeakerButton } from "@/features/voice/SpeakerButton";
import type { VocabWord } from "@/types/vocabulary";
import { VocabCard } from "./VocabCard";

interface VocabularyDeckProps {
  worldSlug: string;
  worldTitle: string;
  words: VocabWord[];
}

export function VocabularyDeck({ worldSlug, worldTitle, words }: VocabularyDeckProps) {
  const intro = `Welcome to the ${worldTitle} Word Wall. Tap a card to learn a new coding word!`;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href={`/worlds/${worldSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {worldTitle}
      </Link>

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-4"
      >
        <RoboAvatar mood="happy" size={60} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold">Word Wall</h1>
          <p className="opacity-70">The coding words of {worldTitle}.</p>
        </div>
        <SpeakerButton text={intro} label="Hear the introduction" />
      </motion.header>

      {words.length === 0 ? (
        <p className="rounded-2xl bg-black/5 p-6 text-center opacity-70 dark:bg-white/5">
          New words are coming to this world soon!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((entry, i) => (
            <VocabCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
