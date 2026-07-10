// Keyboard Kingdom (Typing Town) — the world that builds real keyboard fluency
// before children type code in Coding City. One live mission today ("Meet the
// Keyboard"), an 8-level ladder that grows Discovery → Mastery: single keys →
// words → sentences → the coding keywords that bridge into Coding City. Two more
// missions are on the roadmap (honest "soon", never a fake button).
//
// The catalog here augments the engine's world list (see lib/worlds.ts) so the
// world is playable immediately; when the engine ships the same slug it wins.
import type { GameLevel, KeyQuestData, KeyQuestLevel } from "@/types/game";
import type { LandWorld } from "@/types/world";

function level(
  id: string,
  title: string,
  objective: string,
  content: KeyQuestLevel,
): GameLevel<KeyQuestLevel> {
  return { id, title, objective, content };
}

/** The live keyboard game: eight levels of steadily harder typing. */
export const KEYBOARD_QUEST: KeyQuestData = {
  kind: "key-quest",
  levels: [
    level("kb-1", "Discovery", "Meet the home row — press each key you see.", {
      prompt: "Rest your fingers and press each key!",
      targets: ["a", "s", "d", "f", "j", "k", "l"],
      starThreshold: 3,
    }),
    level("kb-2", "Guided", "Hunt for letters all over the keyboard.", {
      prompt: "Find and press each letter!",
      targets: ["e", "i", "o", "u", "r", "t", "n", "m"],
      starThreshold: 3,
    }),
    level("kb-3", "Independent", "Numbers and the space bar.", {
      prompt: "Press the numbers, then the big space bar!",
      targets: ["1", "2", "3", "4", "5", " "],
      starThreshold: 2,
    }),
    level("kb-4", "Combination", "Build your first little words.", {
      prompt: "Type each whole word!",
      targets: ["sun", "cat", "fish"],
      starThreshold: 3,
    }),
    level("kb-5", "Problem-Solving", "Longer words, one letter at a time.", {
      prompt: "Type each word carefully.",
      targets: ["book", "tree", "apple", "water"],
      starThreshold: 4,
    }),
    level("kb-6", "Accuracy", "Whole sentences — mind the spaces and the dot.", {
      prompt: "Type the whole sentence, spaces and all!",
      targets: ["the dog runs.", "i like apples."],
      starThreshold: 3,
    }),
    level("kb-7", "Speed", "Say it, then type it.", {
      prompt: "Type each sentence.",
      targets: ["my name is sam.", "we can code today."],
      starThreshold: 4,
    }),
    level("kb-8", "Mastery", "The coding words that open Coding City.", {
      prompt: "Type the coding keywords!",
      targets: ["move", "jump", "turn", "start", "stop", "repeat"],
      starThreshold: 3,
    }),
  ],
};

/** Slug → keyboard game data. Registered into gameDataFor via data/missions.ts. */
export const KEYBOARD_GAME_DATA: Record<string, KeyQuestData> = {
  "keyboard-basics": KEYBOARD_QUEST,
};

/** The Keyboard Kingdom world card + mission trail for the World Map. */
export const KEYBOARD_KINGDOM_WORLD: LandWorld = {
  slug: "keyboard-kingdom",
  title: "Keyboard Kingdom",
  subtitle: "Learn the keys. Type your way to real code.",
  theme: "keyboard",
  order: 2,
  locked: false,
  skills: ["Keyboard Fluency", "Accuracy", "Typing"],
  missions: [
    {
      slug: "keyboard-basics",
      title: "Meet the Keyboard",
      skill: "Keyboard Fluency",
      badge: "Key Explorer",
      game: "key-quest",
      order: 1,
      story:
        "The Keyboard Kingdom is waking up! Robo needs a friend who knows the keys. Will you learn them and help?",
      objective: "Find the keys and type your first letters, words, and sentences.",
      status: "live",
      estimatedMinutes: 6,
    },
    {
      slug: "keyboard-words",
      title: "Word Builder",
      skill: "Typing Speed",
      badge: "Word Wizard",
      game: "key-quest",
      order: 2,
      story: "Build bigger words and race the gentle clock.",
      objective: "Type longer words with speed and accuracy.",
      status: "soon",
      estimatedMinutes: 7,
    },
    {
      slug: "keyboard-coder",
      title: "Coding Keys",
      skill: "Coding Vocabulary",
      badge: "Keyboard Coder",
      game: "key-quest",
      order: 3,
      story: "Type the words real coders use — and open the gates to Coding City.",
      objective: "Type coding keywords to bridge into Coding City.",
      status: "soon",
      estimatedMinutes: 8,
    },
  ],
};
