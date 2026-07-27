// The `logic` CLI engine (ADR-016) — pure and testable. It teaches the terminal
// and, crucially, is a BRIDGE to real tools rather than a fictional toolset:
// every `logic git …` command shows the real Git command underneath, so the
// scaffolding can fall away later and the learner already knows `git`. No side
// effects here — the UI executes nothing; it just renders these lines.

export type CliTone = "cmd" | "info" | "real" | "error" | "muted";

export interface CliLine {
  tone: CliTone;
  text: string;
}

export interface CliResult {
  lines: CliLine[];
  /** When true, the terminal clears its scrollback. */
  clear?: boolean;
}

/** Split a command line into tokens, keeping "quoted phrases" together. */
export function tokenize(input: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) out.push(m[1] ?? m[2]);
  return out;
}

const CONCEPTS: Record<string, string> = {
  loops: "A loop repeats steps so you don't rewrite them — e.g. JS: for (…) {…}",
  functions: "A function is a named block of steps you can reuse — e.g. Python: def greet(): …",
  variables: "A variable stores a value with a name, like score = 0.",
  conditions: "A condition chooses what happens next — if this, do that; else do the other.",
  events: "An event runs code when something happens, like a click or a key press.",
};

// logic git <sub> [arg]  ->  the real Git command(s) it stands for.
const GIT_MAP: Record<string, (arg: string) => string> = {
  save: (arg) => `git add .\ngit commit -m "${arg || "Save point"}"`,
  status: () => "git status",
  history: () => "git log --oneline",
  branch: (arg) => `git branch ${arg || "<name>"}`,
  switch: (arg) => `git switch ${arg || "<name>"}`,
  publish: () => "git push origin main",
};

const HELP: CliLine[] = [
  { tone: "muted", text: "LogicLand CLI — try:" },
  { tone: "info", text: "help                 show this list" },
  { tone: "info", text: "run                  run your project" },
  { tone: "info", text: "explain <concept>    loops, functions, variables…" },
  { tone: "info", text: 'git save "message"   save your work (a commit)' },
  { tone: "info", text: "git status|history|branch|switch|publish" },
  { tone: "info", text: "clear                clear the screen" },
];

/** Run one CLI line and return the lines to print. Pure — no execution. */
export function runLogicCommand(input: string): CliResult {
  const tokens = tokenize(input.trim());
  if (tokens.length === 0) return { lines: [] };
  // Be forgiving if the learner types the "logic" prefix inside the prompt.
  if (tokens[0] === "logic") tokens.shift();
  const [cmd, ...rest] = tokens;
  if (!cmd) return { lines: [] };

  switch (cmd) {
    case "help":
      return { lines: HELP };
    case "clear":
      return { lines: [], clear: true };
    case "run":
      return { lines: [{ tone: "info", text: "Press the Run button (▶) to run your project." }] };
    case "explain": {
      const c = rest[0];
      const text =
        c && CONCEPTS[c]
          ? CONCEPTS[c]
          : `Try a concept: ${Object.keys(CONCEPTS).join(", ")}.`;
      return { lines: [{ tone: "info", text }] };
    }
    case "new":
      return {
        lines: [
          { tone: "info", text: "Add files with the Files panel (＋). Project templates are coming soon." },
        ],
      };
    case "git": {
      const sub = rest[0] ?? "";
      const arg = rest.slice(1).join(" ");
      const build = GIT_MAP[sub];
      if (!build) {
        return {
          lines: [
            { tone: "error", text: `Unknown git command "${sub}".` },
            { tone: "muted", text: `Try: ${Object.keys(GIT_MAP).join(", ")}` },
          ],
        };
      }
      const real = build(arg);
      return {
        lines: [
          { tone: "muted", text: "The real Git command:" },
          ...real.split("\n").map((t): CliLine => ({ tone: "real", text: t })),
        ],
      };
    }
    default:
      return {
        lines: [
          { tone: "error", text: `I don't know "${cmd}" yet.` },
          { tone: "muted", text: 'Type "help" to see what I can do.' },
        ],
      };
  }
}
