// The skill graph engine (ADR-011/017) — pure, deterministic, testable. Every
// concept sits in a dependency graph; a learner "has" a skill through *evidence*
// (a mastered Math Fix topic, a completed mission, …), not by watching a lesson.
// This first slice computes structure + status from an achieved-evidence set;
// the DB-backed SkillEvidence model + migration is a deferred follow-up.
import type { FoundationId } from "@/types/academy";

export interface Skill {
  id: string;
  name: string;
  foundation: FoundationId;
  /** Kid-facing one-liner. */
  blurb: string;
  /** Skill ids that must be mastered before this one unlocks. */
  prereqs: string[];
  /** Evidence keys that, if achieved, mark this skill mastered — e.g.
   *  "math:percentages-of-amount". A skill with no evidence source can still be
   *  unlocked structurally, but only becomes "mastered" once a source reports in. */
  evidence?: string[];
}

export type SkillStatus = "mastered" | "unlocked" | "locked";

export function skillById(skills: Skill[], id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}

/** A skill is mastered if it's in the mastered set; unlocked if every prereq is
 *  mastered; otherwise locked. */
export function skillStatus(skill: Skill, masteredIds: ReadonlySet<string>): SkillStatus {
  if (masteredIds.has(skill.id)) return "mastered";
  return skill.prereqs.every((p) => masteredIds.has(p)) ? "unlocked" : "locked";
}

/** Which skills are mastered, given the evidence a learner has achieved. */
export function masteredIdsFromEvidence(
  skills: Skill[],
  achieved: ReadonlySet<string>,
): Set<string> {
  const out = new Set<string>();
  for (const s of skills) {
    if (s.evidence?.some((e) => achieved.has(e))) out.add(s.id);
  }
  return out;
}

export function prerequisitesOf(skills: Skill[], id: string): Skill[] {
  const s = skillById(skills, id);
  if (!s) return [];
  return s.prereqs.map((p) => skillById(skills, p)).filter((x): x is Skill => !!x);
}

export function dependentsOf(skills: Skill[], id: string): Skill[] {
  return skills.filter((s) => s.prereqs.includes(id));
}

/**
 * Depth of a skill = its longest prerequisite chain (roots are depth 0). Used to
 * lay the graph out in tiers. Guards against cycles by tracking the visit path
 * (a skill on its own path contributes no further depth).
 */
export function skillDepth(
  skills: Skill[],
  id: string,
  path: ReadonlySet<string> = new Set(),
): number {
  const s = skillById(skills, id);
  if (!s || s.prereqs.length === 0 || path.has(id)) return 0;
  const next = new Set(path).add(id);
  return 1 + Math.max(...s.prereqs.map((p) => skillDepth(skills, p, next)));
}

/** The skills grouped into dependency tiers (tier 0 = no prerequisites), each
 *  tier ordered as given. */
export function topologicalLayers(skills: Skill[]): Skill[][] {
  const layers: Skill[][] = [];
  for (const s of skills) {
    const d = skillDepth(skills, s.id);
    (layers[d] ??= []).push(s);
  }
  return layers.filter(Boolean);
}

/**
 * Structural checks for the catalog (run in tests so a bad edit fails CI):
 * duplicate ids, prereqs pointing at unknown skills, self-references, and
 * cycles. Returns a list of human-readable problems ([] when healthy).
 */
export function validateGraph(skills: Skill[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const s of skills) {
    if (ids.has(s.id)) problems.push(`duplicate skill id: ${s.id}`);
    ids.add(s.id);
  }
  for (const s of skills) {
    for (const p of s.prereqs) {
      if (p === s.id) problems.push(`${s.id} lists itself as a prerequisite`);
      else if (!ids.has(p)) problems.push(`${s.id} → unknown prerequisite ${p}`);
    }
  }
  // Cycle detection via DFS colouring.
  const WHITE = 0,
    GREY = 1,
    BLACK = 2;
  const colour = new Map<string, number>(skills.map((s) => [s.id, WHITE]));
  const byId = new Map(skills.map((s) => [s.id, s]));
  const visit = (id: string, stack: string[]): void => {
    colour.set(id, GREY);
    for (const p of byId.get(id)?.prereqs ?? []) {
      if (!byId.has(p)) continue;
      const c = colour.get(p);
      if (c === GREY) problems.push(`cycle: ${[...stack, id, p].join(" → ")}`);
      else if (c === WHITE) visit(p, [...stack, id]);
    }
    colour.set(id, BLACK);
  };
  for (const s of skills) if (colour.get(s.id) === WHITE) visit(s.id, []);

  return problems;
}
