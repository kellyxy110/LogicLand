import { describe, expect, it } from "vitest";
import { detectDependencies } from "./dependencies";

describe("detectDependencies", () => {
  it("finds external CDN resources in HTML (by host), ignoring local files", () => {
    const deps = detectDependencies([
      {
        name: "index.html",
        content: `<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/thing/x.css">
<script src="script.js"></script>
<script src="https://unpkg.com/confetti.js"></script>`,
      },
    ]);
    const web = deps.filter((d) => d.kind === "web").map((d) => d.name);
    expect(web).toContain("cdn.jsdelivr.net");
    expect(web).toContain("unpkg.com");
    // Local files are not dependencies.
    expect(web.some((n) => n.includes("style.css"))).toBe(false);
  });

  it("finds Python imports", () => {
    const deps = detectDependencies([
      { name: "main.py", content: "import math\nfrom random import randint\nimport json" },
    ]);
    const py = deps.filter((d) => d.kind === "python").map((d) => d.name);
    expect(py).toEqual(expect.arrayContaining(["math", "random", "json"]));
  });

  it("reads package.json dependencies", () => {
    const deps = detectDependencies([
      {
        name: "package.json",
        content: JSON.stringify({
          dependencies: { react: "^18" },
          devDependencies: { vitest: "^2" },
        }),
      },
    ]);
    const npm = deps.filter((d) => d.kind === "npm").map((d) => d.name);
    expect(npm).toEqual(expect.arrayContaining(["react", "vitest"]));
  });

  it("returns nothing for a project with no external deps", () => {
    expect(
      detectDependencies([
        { name: "index.html", content: '<link href="style.css"><script src="app.js"></script>' },
        { name: "app.js", content: "console.log('hi');" },
      ]),
    ).toEqual([]);
  });
});
