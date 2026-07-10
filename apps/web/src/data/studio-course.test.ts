import { describe, expect, it } from "vitest";
import { STUDIO_MODULE_SLUGS, studioDataFor } from "./studio";

// Acceptance criteria for the HTML course shape: a full, playable ladder that
// does NOT stop after <h1>/<h2>, with every module having real activities and a
// final project. These are data-integrity guards so the course can't silently
// regress to the old "restarts after headings" bug.

describe("HTML course structure", () => {
  it("has at least 15 modules, in order, with unique slugs", () => {
    expect(STUDIO_MODULE_SLUGS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(STUDIO_MODULE_SLUGS).size).toBe(STUDIO_MODULE_SLUGS.length);
  });

  it("continues well beyond <h1> and <h2> (headings is early, not the end)", () => {
    const headings = STUDIO_MODULE_SLUGS.indexOf("headings");
    expect(headings).toBeGreaterThanOrEqual(0);
    // Many modules come AFTER headings — the course does not stop there.
    expect(STUDIO_MODULE_SLUGS.length - 1 - headings).toBeGreaterThanOrEqual(10);
  });

  it("ends with the final website project", () => {
    expect(STUDIO_MODULE_SLUGS.at(-1)).toBe("website-project");
  });

  it("every module is playable: real steps and a preview file", () => {
    for (const slug of STUDIO_MODULE_SLUGS) {
      const data = studioDataFor(slug);
      expect(data, `module ${slug} should exist`).not.toBeNull();
      // "playable" = has classwork steps and a preview target, not a placeholder.
      expect(data!.steps.length, `module ${slug} steps`).toBeGreaterThanOrEqual(1);
      expect(data!.previewFile.length, `module ${slug} previewFile`).toBeGreaterThan(0);
    }
  });

  it("has at least 105 total core activities across the course", () => {
    const total = STUDIO_MODULE_SLUGS.reduce(
      (sum, slug) => sum + (studioDataFor(slug)?.steps.length ?? 0),
      0,
    );
    expect(total).toBeGreaterThanOrEqual(105);
  });
});
