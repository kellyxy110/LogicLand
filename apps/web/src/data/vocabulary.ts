// The Word Wall content, keyed by world. Vocabulary is presentation content
// (word + picture + meaning), so — like commands and mazes — it lives in
// frontend config, not the engine. Add a world's words here; no code changes.
import type { VocabWord } from "@/types/vocabulary";

const LOGIC_FOREST: VocabWord[] = [
  {
    id: "command",
    word: "Command",
    meaning: "A word that tells the robot what to do.",
    emoji: "📣",
    example: "RIGHT is a command that moves Robo to the right.",
  },
  {
    id: "sequence",
    word: "Sequence",
    meaning: "Steps that happen in order, one after another.",
    emoji: "🔢",
    example: "First UP, then RIGHT — that is a sequence!",
  },
  {
    id: "instruction",
    word: "Instruction",
    meaning: "One step that tells the robot exactly what to do.",
    emoji: "👉",
    example: "Each command you tap is one instruction for Robo.",
  },
  {
    id: "program",
    word: "Program",
    meaning: "A whole list of commands the robot follows.",
    emoji: "📜",
    example: "You built a program to help Robo find the treasure.",
  },
  {
    id: "loop",
    word: "Loop",
    meaning: "Doing something again and again.",
    emoji: "🔁",
    example: "Going UP, UP, UP is like a loop of the same step.",
  },
  {
    id: "pattern",
    word: "Pattern",
    meaning: "Something that repeats in a special order.",
    emoji: "🎨",
    example: "Red, blue, red, blue is a pattern.",
  },
  {
    id: "direction",
    word: "Direction",
    meaning: "Which way to go: up, down, left, or right.",
    emoji: "🧭",
    example: "Pick the right direction to reach the star.",
  },
  {
    id: "debug",
    word: "Debug",
    meaning: "Finding and fixing a mistake.",
    emoji: "🐞",
    example: "If Robo bumps a tree, debug your plan and try again.",
  },
];

const BY_WORLD: Record<string, VocabWord[]> = {
  "logic-forest": LOGIC_FOREST,
};

/** The Word Wall for a world, or [] if none is defined yet. */
export function vocabularyFor(worldSlug: string): VocabWord[] {
  return BY_WORLD[worldSlug] ?? [];
}
