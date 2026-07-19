// Keyboard Kingdom (Typing Town) — the world that builds real keyboard fluency
// before children type code in Coding City. One live mission today ("Meet the
// Keyboard"), a 12-level ladder that grows Discovery → Mastery: single keys →
// words → sentences → the coding keywords that bridge into Coding City. Two more
// missions are on the roadmap (honest "soon", never a fake button).
//
// The catalog here augments the engine's world list (see lib/worlds.ts) so the
// world is playable immediately; when the engine ships the same slug it wins.
import type {
  BalloonPopData,
  BalloonPopLevel,
  CodeRacerData,
  CodeRacerLevel,
  FallingWordsData,
  FallingWordsLevel,
  GameLevel,
  KeyQuestData,
  KeyQuestLevel,
} from "@/types/game";
import type { LandWorld } from "@/types/world";

function level(
  id: string,
  title: string,
  objective: string,
  content: KeyQuestLevel,
): GameLevel<KeyQuestLevel> {
  return { id, title, objective, content };
}

function bp(
  id: string,
  title: string,
  objective: string,
  content: BalloonPopLevel,
): GameLevel<BalloonPopLevel> {
  return { id, title, objective, content };
}

function fw(
  id: string,
  title: string,
  objective: string,
  content: FallingWordsLevel,
): GameLevel<FallingWordsLevel> {
  return { id, title, objective, content };
}

function cr(
  id: string,
  title: string,
  objective: string,
  content: CodeRacerLevel,
): GameLevel<CodeRacerLevel> {
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
    level("kb-8", "Coding Keys", "The coding words that open Coding City.", {
      prompt: "Type the coding keywords!",
      targets: ["move", "jump", "turn", "start", "stop", "repeat"],
      starThreshold: 3,
    }),
    level("kb-9", "Speed Words", "Bigger words — type them smoothly.", {
      prompt: "Type each longer word.",
      targets: ["orange", "yellow", "purple", "rocket", "planet"],
      starThreshold: 4,
    }),
    level("kb-10", "Storyteller", "Full sentences with capitals and dots.", {
      prompt: "Type each whole sentence.",
      targets: ["robo can jump.", "i type really fast."],
      starThreshold: 3,
    }),
    level("kb-11", "Code Lines", "Type real two-word commands.", {
      prompt: "Type each command line.",
      targets: ["move forward", "turn left", "repeat three"],
      starThreshold: 4,
    }),
    level("kb-12", "Mastery", "The words real coders type every day.", {
      prompt: "Type like a real coder!",
      targets: ["if", "else", "loop", "print", "function", "hello world"],
      starThreshold: 3,
    }),
  ],
};

/** Balloon Pop — an arcade typing mini-game. A balloon floats up with a letter;
 *  press it before it escapes. Seven levels speed the balloons up and widen the
 *  alphabet. Misses are gentle (a balloon just drifts away — never game over). */
export const BALLOON_POP: BalloonPopData = {
  kind: "balloon-pop",
  levels: [
    bp("bp-1", "Warm Up", "Pop the home-row balloons.", {
      prompt: "Press the letter on each balloon!",
      letters: ["a", "s", "d", "f", "j", "k", "l"],
      secondsPerBalloon: 6,
      starThreshold: 3,
    }),
    bp("bp-2", "Steady", "A few more letters, a little faster.", {
      prompt: "Pop them before they float away!",
      letters: ["a", "e", "i", "o", "u", "r", "t", "n"],
      secondsPerBalloon: 5.5,
      starThreshold: 3,
    }),
    bp("bp-3", "Faster", "Balloons are rising quicker now.", {
      prompt: "Quick — pop each balloon!",
      letters: ["b", "c", "g", "h", "m", "p", "s", "w"],
      secondsPerBalloon: 5,
      starThreshold: 3,
    }),
    bp("bp-4", "Quick Fingers", "More letters across the keyboard.", {
      prompt: "Keep popping!",
      letters: ["a", "e", "r", "t", "y", "u", "i", "o", "p", "l"],
      secondsPerBalloon: 4.5,
      starThreshold: 3,
    }),
    bp("bp-5", "Speedy", "Fewer misses allowed — stay sharp!", {
      prompt: "Fast balloons — don't let them escape!",
      letters: ["q", "w", "e", "d", "f", "g", "h", "j", "k", "z"],
      secondsPerBalloon: 4,
      starThreshold: 2,
    }),
    bp("bp-6", "Rapid", "Twelve balloons, rising fast.", {
      prompt: "Pop, pop, pop!",
      letters: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
      secondsPerBalloon: 3.5,
      starThreshold: 2,
    }),
    bp("bp-7", "Pop Master", "The whole keyboard, at top speed.", {
      prompt: "Master popper — catch them all!",
      letters: ["q", "w", "e", "r", "t", "y", "z", "x", "c", "v", "b", "n", "m"],
      secondsPerBalloon: 3,
      starThreshold: 2,
    }),
  ],
};

/** Falling Words (Word Rain) — words drift down one at a time; type each one
 *  fully before it lands. Twelve levels climb from single letters → short words
 *  → longer words → the coding keywords that lead into Coding City, with the fall
 *  speeding up. Landing a word is gentle (no game over) — it just costs a star. */
export const FALLING_WORDS: FallingWordsData = {
  kind: "falling-words",
  levels: [
    fw("fw-1", "First Drops", "Catch single letters as they fall.", {
      prompt: "Type each letter before it lands!",
      words: ["a", "s", "d", "f", "j", "k"],
      secondsToFall: 7,
      starThreshold: 3,
    }),
    fw("fw-2", "More Letters", "Letters from all over the keyboard.", {
      prompt: "Quick — type the falling letter!",
      words: ["e", "r", "t", "n", "o", "i", "u"],
      secondsToFall: 6.5,
      starThreshold: 3,
    }),
    fw("fw-3", "Tiny Words", "Your first little falling words.", {
      prompt: "Type the whole word as it drops!",
      words: ["cat", "sun", "dog", "top", "hat"],
      secondsToFall: 6.5,
      starThreshold: 2,
    }),
    fw("fw-4", "Four Letters", "A little longer now.", {
      prompt: "Type each word before it lands!",
      words: ["fish", "book", "tree", "jump", "star"],
      secondsToFall: 6,
      starThreshold: 2,
    }),
    fw("fw-5", "Growing", "Five-letter words falling down.", {
      prompt: "Catch the bigger words!",
      words: ["apple", "happy", "smile", "water", "robot"],
      secondsToFall: 6,
      starThreshold: 2,
    }),
    fw("fw-6", "Colors", "Colorful words, a touch faster.", {
      prompt: "Type each color word!",
      words: ["yellow", "orange", "purple", "green", "silver"],
      secondsToFall: 5.5,
      starThreshold: 2,
    }),
    fw("fw-7", "Code Words", "The words that lead to Coding City.", {
      prompt: "Type each coding word!",
      words: ["move", "turn", "stop", "jump", "start"],
      secondsToFall: 5.5,
      starThreshold: 2,
    }),
    fw("fw-8", "More Code", "Bigger coding words.", {
      prompt: "Catch the coding words!",
      words: ["repeat", "print", "loop", "robot", "level"],
      secondsToFall: 5,
      starThreshold: 2,
    }),
    fw("fw-9", "Quick Catch", "Short words, falling faster.", {
      prompt: "Fast fingers — type quickly!",
      words: ["run", "hop", "map", "key", "win", "fun"],
      secondsToFall: 4.5,
      starThreshold: 1,
    }),
    fw("fw-10", "Speed Words", "Medium words at speed.", {
      prompt: "Keep up with the rain!",
      words: ["rocket", "planet", "coder", "player", "puzzle"],
      secondsToFall: 4.5,
      starThreshold: 1,
    }),
    fw("fw-11", "Keywords", "Real coding keywords.", {
      prompt: "Type the keywords real coders use!",
      words: ["if", "else", "loop", "print", "true"],
      secondsToFall: 4,
      starThreshold: 1,
    }),
    fw("fw-12", "Word Rain Master", "The fastest rain of all.", {
      prompt: "Master the rain — catch them all!",
      words: ["function", "return", "value", "hello", "world"],
      secondsToFall: 4,
      starThreshold: 1,
    }),
  ],
};

/** Code Racer — the culminating typing game that bridges into Coding City. Type
 *  each coding keyword to send Robo dashing toward the finish flag. Twelve levels
 *  climb from one-word commands → real code lines → the keywords professional
 *  coders type daily. Stars reward accuracy (few misses), never raw speed, so no
 *  child is ever punished for typing carefully. */
export const CODE_RACER: CodeRacerData = {
  kind: "code-racer",
  levels: [
    cr("cr-1", "Start Line", "Type your first coding commands.", {
      prompt: "Type each word to move Robo forward!",
      words: ["go", "move", "turn", "stop"],
      starThreshold: 2,
    }),
    cr("cr-2", "Warm Lap", "A few more commands.", {
      prompt: "Keep Robo racing — type each command!",
      words: ["jump", "run", "left", "right", "up"],
      starThreshold: 3,
    }),
    cr("cr-3", "Loops", "The words that make code repeat.", {
      prompt: "Type the repeating words!",
      words: ["loop", "repeat", "again", "times"],
      starThreshold: 2,
    }),
    cr("cr-4", "Choices", "Words that let code decide.", {
      prompt: "Type each decision word!",
      words: ["if", "else", "then", "true", "false"],
      starThreshold: 3,
    }),
    cr("cr-5", "Output", "Make the computer talk.", {
      prompt: "Type the words that show things!",
      words: ["print", "show", "say", "draw"],
      starThreshold: 2,
    }),
    cr("cr-6", "Values", "Words for the things code remembers.", {
      prompt: "Type each value word!",
      words: ["value", "number", "word", "list", "count"],
      starThreshold: 3,
    }),
    cr("cr-7", "Command Lines", "Two-word commands — mind the space.", {
      prompt: "Type each whole command line!",
      words: ["move forward", "turn left", "jump high"],
      starThreshold: 3,
    }),
    cr("cr-8", "Functions", "Name the little machines in code.", {
      prompt: "Type each function word!",
      words: ["function", "return", "call", "start", "end"],
      starThreshold: 3,
    }),
    cr("cr-9", "Speed Lap", "Short keywords, typed quickly.", {
      prompt: "Fast fingers — race Robo home!",
      words: ["let", "var", "int", "for", "add"],
      starThreshold: 2,
    }),
    cr("cr-10", "Code Line", "A real line of code.", {
      prompt: "Type the code line!",
      words: ["let x be 5", "add one more"],
      starThreshold: 3,
    }),
    cr("cr-11", "Pro Words", "The words real coders type.", {
      prompt: "Type like a real coder!",
      words: ["import", "export", "class", "object", "array"],
      starThreshold: 3,
    }),
    cr("cr-12", "Grand Prix", "The finish line into Coding City!", {
      prompt: "Final race — type it all!",
      words: ["hello world", "print value", "loop ten times"],
      starThreshold: 3,
    }),
  ],
};

/** Slug → keyboard game data. Registered into gameDataFor via data/missions.ts. */
export const KEYBOARD_GAME_DATA: Record<
  string,
  KeyQuestData | BalloonPopData | FallingWordsData | CodeRacerData
> = {
  "keyboard-basics": KEYBOARD_QUEST,
  "keyboard-balloons": BALLOON_POP,
  "keyboard-words": FALLING_WORDS,
  "keyboard-coder": CODE_RACER,
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
      slug: "keyboard-balloons",
      title: "Balloon Pop",
      skill: "Key Speed",
      badge: "Balloon Popper",
      game: "balloon-pop",
      order: 2,
      story:
        "Balloons are floating up over the Kingdom, each with a letter. Pop them by pressing the right key before they drift away!",
      objective: "Press each balloon's letter before it floats off the top.",
      status: "live",
      estimatedMinutes: 5,
    },
    {
      slug: "keyboard-words",
      title: "Word Builder",
      skill: "Typing Speed",
      badge: "Word Wizard",
      game: "falling-words",
      order: 3,
      story:
        "Words are raining over the Kingdom! Type each one before it lands to keep the sky clear.",
      objective: "Type each falling word before it reaches the ground.",
      status: "live",
      estimatedMinutes: 7,
    },
    {
      slug: "keyboard-coder",
      title: "Code Racer",
      skill: "Coding Vocabulary",
      badge: "Keyboard Coder",
      game: "code-racer",
      order: 4,
      story:
        "The gates to Coding City are ahead! Type each coding keyword to send Robo racing across the finish line.",
      objective: "Type coding keywords to race Robo into Coding City.",
      status: "live",
      estimatedMinutes: 8,
    },
  ],
};
