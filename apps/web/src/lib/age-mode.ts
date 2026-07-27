// Age-adaptive modes (ADR-012). One continuous ecosystem, five presentation
// modes that change vocabulary, which tools are visible, and difficulty — never
// a separate product. Everything here is pure + data-driven so new terms and
// capabilities extend by adding to a map, not by editing call sites.
//
// The through-line: professional vocabulary is revealed progressively, and the
// real term is always visible underneath (see `term()` "friendly (real)" form
// for the middle mode).

export type AgeMode = "sprout" | "explorer" | "builder" | "developer" | "pro";

export interface AgeModeInfo {
  id: AgeMode;
  label: string;
  ages: string;
  blurb: string;
}

/** Ordered youngest → most advanced. Order matters for `atLeast()`. */
export const AGE_MODES: AgeModeInfo[] = [
  { id: "sprout", label: "Code Sprout", ages: "4–6", blurb: "Pictures, taps and first words." },
  { id: "explorer", label: "Code Explorer", ages: "7–9", blurb: "Blocks and short typed commands." },
  { id: "builder", label: "Code Builder", ages: "10–12", blurb: "Real files, code and a terminal." },
  { id: "developer", label: "Developer", ages: "13–15", blurb: "Projects, git and testing." },
  { id: "pro", label: "Engineer", ages: "16+", blurb: "Full professional tooling." },
];

export const MODE_ORDER: AgeMode[] = AGE_MODES.map((m) => m.id);
export const DEFAULT_MODE: AgeMode = "builder";

export function isAgeMode(v: unknown): v is AgeMode {
  return typeof v === "string" && (MODE_ORDER as string[]).includes(v);
}

/** Pick a sensible mode from a learner's age. */
export function modeForAge(age?: number | null): AgeMode {
  if (age == null || Number.isNaN(age)) return DEFAULT_MODE;
  if (age <= 6) return "sprout";
  if (age <= 9) return "explorer";
  if (age <= 12) return "builder";
  if (age <= 15) return "developer";
  return "pro";
}

/** True when `mode` is at least as advanced as `min`. */
export function atLeast(mode: AgeMode, min: AgeMode): boolean {
  return MODE_ORDER.indexOf(mode) >= MODE_ORDER.indexOf(min);
}

// --- Progressive vocabulary ------------------------------------------------
// For each term: the youngest-friendly word, and the real professional word.
// From `builder` up we show "Friendly (real)" so the real term is always in
// view; `developer`+ uses the real term alone.
interface Term {
  friendly: string;
  real: string;
}

const TERMS: Record<string, Term> = {
  commit: { friendly: "Save Point", real: "Commit" },
  terminal: { friendly: "Toolbox", real: "Terminal" },
  project: { friendly: "Mission", real: "Project" },
  branch: { friendly: "Experiment Path", real: "Branch" },
  pullRequest: { friendly: "Change Proposal", real: "Pull Request" },
  repository: { friendly: "Project Library", real: "Repository" },
  deploy: { friendly: "Publish", real: "Deploy" },
  function: { friendly: "Helper", real: "Function" },
  variable: { friendly: "Box", real: "Variable" },
};

export type TermKey = keyof typeof TERMS;

/** The label for a term in a given mode. Younger modes get the friendly word;
 *  `builder` shows "Friendly (Real)"; `developer`+ the real word. Unknown keys
 *  return the key unchanged (forgiving + extensible). */
export function term(key: TermKey | string, mode: AgeMode): string {
  const t = TERMS[key as TermKey];
  if (!t) return String(key);
  if (mode === "sprout" || mode === "explorer") return t.friendly;
  if (mode === "builder") return `${t.friendly} (${t.real})`;
  return t.real;
}

// --- Capabilities (progressive disclosure / developer unlocks) -------------
export interface Capabilities {
  /** Show the terminal / CLI. */
  terminal: boolean;
  /** Offer Python (vs. web-only). */
  python: boolean;
  /** Show git teaching commands. */
  git: boolean;
  /** Show raw error text (younger modes get only the plain-words layer). */
  rawErrors: boolean;
  /** Show the dependency/packages panel. */
  dependencies: boolean;
  /** "Developer mode" — advanced panels unlocked. */
  developerMode: boolean;
  /** Difficulty tier hint for generated content (1 easiest → 5). */
  difficulty: number;
}

const CAPS: Record<AgeMode, Capabilities> = {
  sprout: { terminal: false, python: false, git: false, rawErrors: false, dependencies: false, developerMode: false, difficulty: 1 },
  explorer: { terminal: false, python: false, git: false, rawErrors: false, dependencies: false, developerMode: false, difficulty: 2 },
  builder: { terminal: true, python: true, git: true, rawErrors: true, dependencies: true, developerMode: false, difficulty: 3 },
  developer: { terminal: true, python: true, git: true, rawErrors: true, dependencies: true, developerMode: true, difficulty: 4 },
  pro: { terminal: true, python: true, git: true, rawErrors: true, dependencies: true, developerMode: true, difficulty: 5 },
};

export function capabilities(mode: AgeMode): Capabilities {
  return CAPS[mode];
}
