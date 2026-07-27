import { describe, expect, it } from "vitest";
import { MATHLABS, mathLabById, sortedMathLabs } from "./mathlab";

describe("MathLab registry", () => {
  it("has unique ids and non-empty fields", () => {
    const ids = MATHLABS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of MATHLABS) {
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.description.length).toBeGreaterThan(0);
    }
  });

  it("live labs link somewhere real; soon labs never fake a link", () => {
    for (const l of MATHLABS) {
      if (l.status === "live") {
        expect(l.href, l.id).toBeTruthy();
        expect(l.href!.startsWith("/")).toBe(true);
      } else {
        expect(l.href, l.id).toBeUndefined();
      }
    }
  });

  it("Math Fix and Sketchpad are live; sort puts live first", () => {
    expect(mathLabById("math-fix")?.status).toBe("live");
    expect(mathLabById("sketchpad")?.status).toBe("live");
    const sorted = sortedMathLabs();
    const firstSoon = sorted.findIndex((l) => l.status === "soon");
    expect(sorted.slice(0, firstSoon).every((l) => l.status === "live")).toBe(true);
  });
});
