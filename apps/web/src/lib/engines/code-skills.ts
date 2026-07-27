// Deterministic code → skill evidence (ADR-015; the Graphify-style idea, kept
// simple). Reads a learner's Studio files and emits skill-graph evidence keys
// for the programming concepts their code actually uses — no LLM, no grading by
// AI. This is how PROGRAMMING skills light up on /skills: earned by building,
// not by watching. Syntactic heuristics over JS/TS/Python; intentionally
// forgiving (a false positive just lights a skill a little early, never wrong
// output). Extend RULES as more concepts/languages are taught.
export interface CodeFile {
  name: string;
  content: string;
}

interface Rule {
  /** Skill id in data/skills.ts. */
  skill: string;
  test: RegExp;
}

const RULES: Rule[] = [
  // Any code at all shows sequencing — the first programming skill.
  { skill: "sequence", test: /\S/ },
  { skill: "variables", test: /\b(let|const|var)\s+\w+|^\s*\w+\s*=\s*[^=]/m },
  { skill: "loops", test: /\b(for|while)\b/ },
  { skill: "conditions", test: /\b(if|elif|else)\b/ },
  { skill: "functions", test: /\bfunction\b|=>|^\s*def\s+\w+\s*\(/m },
  { skill: "events", test: /addEventListener|\.on[A-Z]\w+\s*=/ },
  { skill: "data-structures", test: /\[[^\]]*\]|\{[^}]*\}|\b(list|dict|set|tuple)\s*\(/ },
];

const CODE_FILE = /\.(js|mjs|cjs|ts|tsx|py)$/i;

/** Evidence keys ("code:<skill>") for the programming concepts the given files
 *  demonstrate. Only real code files (JS/TS/Python) are inspected. */
export function detectCodeSkills(files: CodeFile[]): Set<string> {
  const code = files
    .filter((f) => CODE_FILE.test(f.name))
    .map((f) => f.content)
    .join("\n");
  const out = new Set<string>();
  if (!code.trim()) return out;
  for (const r of RULES) {
    if (r.test.test(code)) out.add(codeEvidenceKey(r.skill));
  }
  return out;
}

/** Evidence key format shared with data/skills.ts. */
export function codeEvidenceKey(skillId: string): string {
  return `code:${skillId}`;
}
