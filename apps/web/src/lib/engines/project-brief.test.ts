import { describe, expect, it } from "vitest";
import {
  briefProgress,
  checkCriterion,
  DEFAULT_BRIEF,
  evaluateBrief,
} from "./project-brief";
import { defaultStudioProject } from "./studio-project";

const files = [
  { name: "index.html", content: "<h1>Hi</h1><button>Go</button>" },
  { name: "script.js", content: "btn.addEventListener('click', () => console.log('hi'));" },
];

describe("checkCriterion", () => {
  it("has-file / content-has / any-content-has", () => {
    expect(checkCriterion({ type: "has-file", name: "index.html" }, files)).toBe(true);
    expect(checkCriterion({ type: "has-file", name: "style.css" }, files)).toBe(false);
    expect(checkCriterion({ type: "content-has", file: "index.html", needle: "<button" }, files)).toBe(true);
    expect(checkCriterion({ type: "any-content-has", needle: "addEventListener" }, files)).toBe(true);
  });

  it("content-count respects the minimum", () => {
    const two = [{ name: "index.html", content: "<button>a</button><button>b</button>" }];
    expect(checkCriterion({ type: "content-count", file: "index.html", needle: "<button", min: 2 }, two)).toBe(true);
    expect(checkCriterion({ type: "content-count", file: "index.html", needle: "<button", min: 2 }, files)).toBe(false);
  });
});

describe("DEFAULT_BRIEF against the starter project", () => {
  it("passes the core criteria and leaves the stretch goals to do", () => {
    const proj = defaultStudioProject().map((f) => ({ name: f.name, content: f.content }));
    const results = evaluateBrief(DEFAULT_BRIEF, proj);
    const passed = new Set(results.filter((r) => r.passed).map((r) => r.id));
    expect(passed.has("html")).toBe(true);
    expect(passed.has("button")).toBe(true);
    expect(passed.has("listen")).toBe(true);
    expect(passed.has("log")).toBe(true);
    // Stretch goals not yet met by the starter.
    expect(passed.has("reset")).toBe(false);
    expect(passed.has("input")).toBe(false);
    // So progress is partial, never 0 or 100 for the starter.
    const pct = briefProgress(results);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});
