// The project "operating system" (Phase 2) — a brief with acceptance criteria
// that are checked DETERMINISTICALLY against the project's files (ADR-015: no
// LLM decides done-ness). This is what turns Studio from a blank canvas into a
// real build task: a story to build toward and criteria that tick off as the
// learner's code meets them. Reuses the spirit of the guided HTML Studio's
// StepCheck, generalised for the free-build Studio.
export type CriterionCheck =
  | { type: "has-file"; name: string }
  | { type: "content-has"; file: string; needle: string }
  | { type: "content-count"; file: string; needle: string; min: number }
  | { type: "any-content-has"; needle: string };

export interface Criterion {
  id: string;
  /** What to do, in kid words. */
  label: string;
  check: CriterionCheck;
}

export interface ProjectBrief {
  id: string;
  title: string;
  /** The user story — why we're building it. */
  story: string;
  criteria: Criterion[];
}

export interface CriterionResult {
  id: string;
  label: string;
  passed: boolean;
}

interface BriefFile {
  name: string;
  content: string;
}

function findFile(files: BriefFile[], name: string): BriefFile | undefined {
  return files.find((f) => f.name.toLowerCase() === name.toLowerCase());
}

function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let i = 0;
  for (;;) {
    const next = haystack.indexOf(needle, i);
    if (next === -1) break;
    count += 1;
    i = next + needle.length;
  }
  return count;
}

/** Evaluate a single criterion against the files. Deterministic; case-insensitive. */
export function checkCriterion(check: CriterionCheck, files: BriefFile[]): boolean {
  switch (check.type) {
    case "has-file":
      return !!findFile(files, check.name);
    case "content-has": {
      const f = findFile(files, check.file);
      return !!f && f.content.toLowerCase().includes(check.needle.toLowerCase());
    }
    case "content-count": {
      const f = findFile(files, check.file);
      if (!f) return false;
      return occurrences(f.content.toLowerCase(), check.needle.toLowerCase()) >= check.min;
    }
    case "any-content-has": {
      const needle = check.needle.toLowerCase();
      return files.some((f) => f.content.toLowerCase().includes(needle));
    }
  }
}

export function evaluateBrief(brief: ProjectBrief, files: BriefFile[]): CriterionResult[] {
  return brief.criteria.map((c) => ({
    id: c.id,
    label: c.label,
    passed: checkCriterion(c.check, files),
  }));
}

export function briefProgress(results: CriterionResult[]): number {
  if (results.length === 0) return 0;
  const done = results.filter((r) => r.passed).length;
  return Math.round((done / results.length) * 100);
}

/** The starter brief — matches the default web project, with two stretch goals
 *  that aren't met yet so there's always a next step. */
export const DEFAULT_BRIEF: ProjectBrief = {
  id: "click-counter",
  title: "Build a Click Counter",
  story: "Make a web page with a button that counts how many times it's clicked.",
  criteria: [
    { id: "html", label: "Have an index.html page", check: { type: "has-file", name: "index.html" } },
    { id: "button", label: "Put a button on the page", check: { type: "content-has", file: "index.html", needle: "<button" } },
    { id: "listen", label: "Make the button respond to a click", check: { type: "any-content-has", needle: "addEventListener" } },
    { id: "log", label: "Log something to the console", check: { type: "any-content-has", needle: "console.log" } },
    // Stretch goals (not met by the starter — the next thing to build):
    { id: "reset", label: "Add a second button to reset the count", check: { type: "content-count", file: "index.html", needle: "<button", min: 2 } },
    { id: "input", label: "Add a text box (an <input>) to the page", check: { type: "content-has", file: "index.html", needle: "<input" } },
  ],
};
