// Command parser — turns a child's typed text into a list of known commands,
// and turns mistakes into *friendly* hints (never scary errors). Pure and
// grammar-driven: the same parser serves any world that defines a grammar.
import type { CommandGrammar, CommandId, ParseIssue, ParseResult } from "@/types/game";

/** Split on whitespace, commas, and newlines; drop empties. */
function tokenize(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Classic Levenshtein edit distance — small inputs, so the simple DP is fine. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

interface Lookup {
  byWord: Map<string, CommandId>;
  words: string[];
  wordToId: Map<string, CommandId>;
}

function buildLookup(grammar: CommandGrammar): Lookup {
  const byWord = new Map<string, CommandId>();
  const wordToId = new Map<string, CommandId>();
  for (const def of grammar) {
    const forms = [def.id.toLowerCase(), def.label.toLowerCase(), ...def.aliases];
    for (const form of forms) {
      byWord.set(form, def.id);
      wordToId.set(form, def.id);
    }
  }
  return { byWord, words: [...wordToId.keys()], wordToId };
}

/** Nearest known command within a small edit distance, else null. */
function suggest(word: string, lookup: Lookup): CommandId | null {
  let best: { id: CommandId; dist: number } | null = null;
  for (const form of lookup.words) {
    const dist = editDistance(word, form);
    if (best === null || dist < best.dist) {
      best = { id: lookup.wordToId.get(form)!, dist };
    }
  }
  // Only suggest when it's a plausible typo (not a wild guess).
  const threshold = word.length <= 3 ? 1 : 2;
  return best && best.dist <= threshold ? best.id : null;
}

/** Parse typed text into commands + friendly issues. */
export function parseCommands(input: string, grammar: CommandGrammar): ParseResult {
  const lookup = buildLookup(grammar);
  const tokens: CommandId[] = [];
  const issues: ParseIssue[] = [];

  for (const raw of tokenize(input)) {
    const word = raw.toLowerCase();
    const id = lookup.byWord.get(word);
    if (id) {
      tokens.push(id);
    } else {
      issues.push({ word: raw, suggestion: suggest(word, lookup) });
    }
  }

  return { tokens, issues, ok: issues.length === 0 && tokens.length > 0 };
}

/** A warm, encouraging message for the first issue (or null if all good). */
export function friendlyHint(result: ParseResult): string | null {
  if (result.issues.length === 0) {
    return result.tokens.length === 0
      ? "Type a command like GO or RIGHT to start!"
      : null;
  }
  const first = result.issues[0];
  if (first.suggestion) {
    return `Hmm, I don't know "${first.word}". Did you mean ${first.suggestion}?`;
  }
  return `I don't know "${first.word}" yet. Try a command from the list below!`;
}
