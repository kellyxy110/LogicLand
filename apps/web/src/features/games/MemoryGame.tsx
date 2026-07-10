"use client";
// Memory Game — flip cards to find matching pairs. Classic working-memory play,
// forest-themed. A 7-level ladder (LeveledGame) growing from 3 pairs to 8; this
// file plays ONE level and reports its stars when the board is cleared. Cards are
// dealt after mount (the shuffle is random, so dealing during SSR would cause a
// hydration mismatch); LeveledGame remounts this per level with a fresh key.
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  boardCleared,
  dealMemoryCards,
  isPair,
  starForMistakes,
  type MemoryCard,
} from "@/lib/engines/minigames";
import type { MemoryData, MemoryLevel } from "@/types/game";
import { GameSpeech } from "./GameSpeech";
import { LeveledGame } from "./LeveledGame";

interface MemoryGameProps {
  slug: string;
  data: MemoryData;
  onWin: (stars: number) => void;
}

export function MemoryGame({ slug, data, onWin }: MemoryGameProps) {
  return (
    <LeveledGame
      slug={slug}
      levels={data.levels}
      onWin={onWin}
      renderLevel={(content, onComplete) => (
        <MemoryBoard content={content} onComplete={onComplete} />
      )}
    />
  );
}

function MemoryBoard({
  content,
  onComplete,
}: {
  content: MemoryLevel;
  onComplete: (stars: number) => void;
}) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const mistakes = useRef(0);
  const notified = useRef(false);

  useEffect(() => {
    setCards(dealMemoryCards(content.faces));
  }, [content.faces]);

  useEffect(() => {
    if (
      cards.length > 0 &&
      boardCleared(matched.size / 2, content.faces.length) &&
      !notified.current
    ) {
      notified.current = true;
      setDone(true);
      onComplete(starForMistakes(mistakes.current, content.starThreshold));
    }
  }, [matched, cards, content.faces.length, content.starThreshold, onComplete]);

  function flip(card: MemoryCard) {
    if (locked || done || matched.has(card.id) || flipped.includes(card.id)) return;
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length < 2) return;

    setLocked(true);
    const [a, b] = next.map((id) => cards.find((c) => c.id === id)!);
    if (isPair(a, b)) {
      window.setTimeout(() => {
        setMatched((prev) => new Set([...prev, a.id, b.id]));
        setFlipped([]);
        setLocked(false);
      }, 480);
    } else {
      mistakes.current += 1;
      window.setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 850);
    }
  }

  const speech = done
    ? "You found every pair! 🎉"
    : "Flip two cards. Can you find a matching pair?";

  return (
    <div className="space-y-5">
      <GameSpeech text={speech} mood={done ? "happy" : "idle"} />

      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2.5">
        {(cards.length ? cards : Array.from({ length: content.faces.length * 2 })).map(
          (card, i) => {
            const c = card as MemoryCard | undefined;
            const faceUp = !!c && (flipped.includes(c.id) || matched.has(c.id));
            const isMatched = !!c && matched.has(c.id);
            return (
              <motion.button
                key={c ? c.id : i}
                type="button"
                disabled={!c || faceUp || locked}
                onClick={() => c && flip(c)}
                aria-label={faceUp && c ? `Card ${c.face}` : "Hidden card"}
                whileTap={{ scale: 0.94 }}
                className={`grid aspect-square place-items-center rounded-2xl text-4xl shadow-sm transition-colors ${
                  faceUp
                    ? "bg-white dark:bg-white/10"
                    : "bg-gradient-to-br from-emerald-400 to-green-600"
                } ${isMatched ? "ring-2 ring-meadow" : ""}`}
              >
                <motion.span
                  key={faceUp && c ? `${c.id}-up` : "down"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  aria-hidden
                >
                  {faceUp && c ? c.face : "🍃"}
                </motion.span>
              </motion.button>
            );
          },
        )}
      </div>
    </div>
  );
}
