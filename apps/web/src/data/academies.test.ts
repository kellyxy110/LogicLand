import { describe, expect, it } from "vitest";
import {
  ACADEMIES,
  academyBySlug,
  academiesByFoundation,
  FOUNDATIONS,
  sortedAcademies,
} from "./academies";
import type { FoundationId } from "@/types/academy";

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

  it("sorts live academies first, with the flagship leading", () => {
    const sorted = sortedAcademies();
    const firstSoon = sorted.findIndex((a) => a.status === "soon");
    // Everything before the first "soon" is live.
    expect(sorted.slice(0, firstSoon).every((a) => a.status === "live")).toBe(true);
    // The flagship leads overall (it is live and flagged).
    expect(sorted[0].flagship).toBe(true);
    expect(sorted[0].status).toBe("live");
  });

  it("academyBySlug resolves known slugs and rejects unknown", () => {
    expect(academyBySlug("coding")?.name).toContain("Coding");
    expect(academyBySlug("nope")).toBeUndefined();
  });
});

describe("Foundations (ADR-010)", () => {
  const foundationIds = new Set<FoundationId>(FOUNDATIONS.map((f) => f.id));

  it("every academy names a known foundation", () => {
    for (const a of ACADEMIES) {
      expect(foundationIds.has(a.foundation), `${a.slug} → ${a.foundation}`).toBe(
        true,
      );
    }
  });

  it("each foundation has exactly one core academy", () => {
    for (const f of FOUNDATIONS) {
      const cores = ACADEMIES.filter((a) => a.foundation === f.id && a.core);
      expect(cores.length, `${f.id} cores`).toBe(1);
    }
  });

  it("coding is the programming core; math-fix the mathematics core", () => {
    expect(academyBySlug("coding")?.foundation).toBe("programming");
    expect(academyBySlug("coding")?.core).toBe(true);
    expect(academyBySlug("math-fix")?.foundation).toBe("mathematics");
    expect(academyBySlug("math-fix")?.core).toBe(true);
  });

  it("groups the whole catalog, in foundation order, core-first within each", () => {
    const groups = academiesByFoundation();
    expect(groups.map((g) => g.foundation.id)).toEqual([
      "programming",
      "mathematics",
      "ai",
    ]);
    // No academy lost or duplicated in the grouping.
    const grouped = groups.flatMap((g) => g.academies);
    expect(grouped.length).toBe(ACADEMIES.length);
    expect(new Set(grouped.map((a) => a.slug)).size).toBe(ACADEMIES.length);
    // The core academy leads each non-empty group.
    for (const g of groups) {
      if (g.academies.length > 0) expect(g.academies[0].core).toBe(true);
    }
  });
});
