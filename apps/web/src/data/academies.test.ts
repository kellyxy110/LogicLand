import { describe, expect, it } from "vitest";
import { ACADEMIES, academyBySlug, sortedAcademies } from "./academies";

// Guards the Academy catalog: honest live/soon wiring (a live academy must lead
// somewhere real), unique slugs, and the flagship/live ordering the hub relies on.

describe("Academy catalog", () => {
  it("has unique slugs and non-empty core fields", () => {
    const slugs = ACADEMIES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of ACADEMIES) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.tagline.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.highlights.length).toBeGreaterThan(0);
      expect(a.ageBands.length).toBeGreaterThan(0);
      expect(a.plannedTracks).toBeGreaterThan(0);
    }
  });

  it("every LIVE academy points somewhere real; SOON ones never fake a link", () => {
    for (const a of ACADEMIES) {
      if (a.status === "live") {
        expect(a.href, `${a.slug} is live`).toBeTruthy();
        expect(a.href!.startsWith("/")).toBe(true);
      } else {
        expect(a.href, `${a.slug} is soon`).toBeUndefined();
      }
    }
  });

  it("has at least one live academy and exactly one flagship", () => {
    expect(ACADEMIES.some((a) => a.status === "live")).toBe(true);
    expect(ACADEMIES.filter((a) => a.flagship).length).toBe(1);
  });

  it("sorts live academies first, then the flagship among the rest", () => {
    const sorted = sortedAcademies();
    const firstSoon = sorted.findIndex((a) => a.status === "soon");
    // Everything before the first "soon" is live.
    expect(sorted.slice(0, firstSoon).every((a) => a.status === "live")).toBe(true);
    // The flagship leads the roadmap group.
    expect(sorted[firstSoon].flagship).toBe(true);
  });

  it("academyBySlug resolves known slugs and rejects unknown", () => {
    expect(academyBySlug("coding")?.name).toContain("Coding");
    expect(academyBySlug("nope")).toBeUndefined();
  });
});
