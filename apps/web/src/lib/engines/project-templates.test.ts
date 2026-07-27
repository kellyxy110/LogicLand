import { describe, expect, it } from "vitest";
import {
  PROJECT_TEMPLATES,
  templateById,
  templatesByCategory,
} from "./project-templates";
import { evaluateBrief } from "./project-brief";

describe("project templates", () => {
  it("have unique ids and complete metadata", () => {
    const ids = PROJECT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of PROJECT_TEMPLATES) {
      expect(t.files.length).toBeGreaterThan(0);
      expect(t.objectives.length).toBeGreaterThan(0);
      expect(t.rubric.length).toBeGreaterThan(0);
      expect(t.brief.criteria.length).toBeGreaterThan(0);
      // brief id matches the template id (routing/persistence rely on this)
      expect(t.brief.id).toBe(t.id);
    }
  });

  it("each starter project already satisfies at least one criterion (a real start)", () => {
    for (const t of PROJECT_TEMPLATES) {
      const results = evaluateBrief(t.brief, t.files);
      expect(results.some((r) => r.passed), `${t.id} starter`).toBe(true);
    }
  });

  it("templateById resolves and templatesByCategory groups", () => {
    expect(templateById("py-guessing")?.title).toContain("Guessing");
    expect(templateById("nope")).toBeUndefined();
    const groups = templatesByCategory();
    const total = groups.reduce((n, g) => n + g.templates.length, 0);
    expect(total).toBe(PROJECT_TEMPLATES.length);
  });

  it("covers several foundations (python, web, ai, math at least)", () => {
    const cats = new Set(PROJECT_TEMPLATES.map((t) => t.category));
    for (const c of ["web", "python", "ai", "math"]) expect(cats.has(c as never)).toBe(true);
  });
});
