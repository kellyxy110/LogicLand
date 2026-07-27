// Error anatomy (ADR-015, deterministic). Turns a raw runtime error into three
// layers so learners read REAL errors instead of being shielded from them:
//   1. original  — the exact message (kept, never hidden)
//   2. technical — a precise interpretation
//   3. learning  — the same idea in plain, kind words
// Pattern-matched over common JS and Python errors; unknown errors still get a
// useful generic explanation. No LLM.
export interface ErrorAnatomy {
  kind: string;
  original: string;
  technical: string;
  learning: string;
}

interface Pattern {
  kind: string;
  test: RegExp;
  technical: (m: RegExpMatchArray) => string;
  learning: (m: RegExpMatchArray) => string;
}

const PATTERNS: Pattern[] = [
  {
    kind: "TypeError",
    test: /(\S+)\.(\w+) is not a function/,
    technical: (m) => `${m[2]}() was called on ${m[1]}, which isn't the right kind of value.`,
    learning: () =>
      "You used a command that only works on a certain kind of value. Check that value is what you expect — text, a number, or a list.",
  },
  {
    kind: "TypeError",
    test: /Cannot read propert(?:y|ies) of (undefined|null) \(reading '([^']+)'\)/,
    technical: (m) => `Tried to read ".${m[2]}" on a value that is ${m[1]} — it doesn't exist yet.`,
    learning: () =>
      "The program looked inside something that isn't there yet. Make sure it was created or found before you use it.",
  },
  {
    kind: "TypeError",
    test: /Assignment to constant variable/,
    technical: () => "A value declared with const was reassigned.",
    learning: () =>
      "You tried to change something you said should never change (const). Use let if it needs to change.",
  },
  {
    kind: "NameError",
    test: /NameError: name '([^']+)' is not defined/,
    technical: (m) => `The name "${m[1]}" is used before it is defined.`,
    learning: (m) =>
      `Python doesn't know "${m[1]}" yet. Check the spelling, and set it before you use it.`,
  },
  {
    kind: "TypeError",
    test: /can only concatenate str \(not "(\w+)"\) to str/,
    technical: (m) => `Tried to join text with a ${m[1]} without converting it first.`,
    learning: () =>
      "You mixed text and a number. Turn the number into text first, like str(number).",
  },
  {
    kind: "ZeroDivisionError",
    test: /ZeroDivisionError/,
    technical: () => "A number was divided by zero.",
    learning: () => "You can't divide by zero — check the number you're dividing by isn't 0.",
  },
  {
    kind: "IndentationError",
    test: /IndentationError/,
    technical: () => "The indentation (leading spaces) doesn't line up.",
    learning: () =>
      "Python uses spacing to group code. Line up the steps inside a block with the same spaces.",
  },
  {
    kind: "IndexError",
    test: /IndexError: list index out of range/,
    technical: () => "Asked for a list position that doesn't exist.",
    learning: () =>
      "You asked for an item that isn't in the list. Remember the first item is number 0.",
  },
  {
    kind: "KeyError",
    test: /KeyError: (.+)/,
    technical: (m) => `Looked up a key that isn't in the data: ${m[1].trim()}.`,
    learning: () => "That label isn't in your data. Check the key exists — and its spelling.",
  },
  {
    kind: "ReferenceError",
    test: /(\w+) is not defined/,
    technical: (m) => `The name "${m[1]}" is used but was never declared (or is out of scope).`,
    learning: (m) =>
      `The program doesn't know what "${m[1]}" is. Spell it the same everywhere, and create it before using it.`,
  },
  {
    kind: "SyntaxError",
    test: /SyntaxError|Unexpected token|invalid syntax/,
    technical: () => "The code couldn't be understood — a punctuation or spelling slip.",
    learning: () =>
      "Something's typed slightly wrong. Look for a missing bracket, quote, colon or comma near the spot it names.",
  },
];

export function explainError(raw: string): ErrorAnatomy {
  const original = raw.trim();
  for (const p of PATTERNS) {
    const m = original.match(p.test);
    if (m) {
      return { kind: p.kind, original, technical: p.technical(m), learning: p.learning(m) };
    }
  }
  return {
    kind: "Error",
    original,
    technical: original,
    learning:
      "Read the message and find the file and line it points to. Then check what the program expected there versus what it actually got.",
  };
}
