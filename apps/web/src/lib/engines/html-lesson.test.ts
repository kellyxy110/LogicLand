import { describe, expect, it } from "vitest";
import type { FsNode, HtmlLessonStep } from "@/types/studio";
import { checkStep, currentStepIndex, findFile, isClassComplete } from "./html-lesson";

const folder = (id: string, name: string): FsNode => ({
  id,
  name,
  kind: "folder",
  parentId: null,
  content: "",
});
const file = (id: string, name: string, content = ""): FsNode => ({
  id,
  name,
  kind: "file",
  parentId: "f1",
  content,
});

const steps: HtmlLessonStep[] = [
  { id: "s1", instruction: "", hint: "", check: { type: "has-folder" } },
  { id: "s2", instruction: "", hint: "", check: { type: "has-file", name: "index.html" } },
  { id: "s3", instruction: "", hint: "", check: { type: "content-has", file: "index.html", needle: "<h1" } },
];

describe("checkStep", () => {
  it("detects a folder", () => {
    expect(checkStep([], { type: "has-folder" })).toBe(false);
    expect(checkStep([folder("f1", "site")], { type: "has-folder" })).toBe(true);
  });
  it("detects a file by name, case-insensitively", () => {
    const nodes = [file("x", "Index.HTML")];
    expect(checkStep(nodes, { type: "has-file", name: "index.html" })).toBe(true);
    expect(checkStep(nodes, { type: "has-file", name: "style.css" })).toBe(false);
  });
  it("detects content inside a file", () => {
    const nodes = [file("x", "index.html", "<H1>Hi</H1>")];
    expect(checkStep(nodes, { type: "content-has", file: "index.html", needle: "<h1" })).toBe(true);
    expect(checkStep(nodes, { type: "content-has", file: "index.html", needle: "<p" })).toBe(false);
  });
  it("counts occurrences for content-count (meaning, not exact match)", () => {
    const nodes = [file("x", "index.html", "<li>Milk</li>\n<LI>Bread</LI>\n<li>Eggs</li>")];
    expect(checkStep(nodes, { type: "content-count", file: "index.html", needle: "<li", min: 3 })).toBe(true);
    expect(checkStep(nodes, { type: "content-count", file: "index.html", needle: "<li", min: 4 })).toBe(false);
    // whitespace/newlines between tags don't matter — three items either way
    const spaced = [file("y", "index.html", "<li>\n  a\n</li> <li>b</li> <li>c</li>")];
    expect(checkStep(spaced, { type: "content-count", file: "index.html", needle: "<li", min: 3 })).toBe(true);
  });
});

describe("findFile", () => {
  it("ignores folders and matches files by name", () => {
    expect(findFile([folder("f1", "index.html")], "index.html")).toBeUndefined();
    expect(findFile([file("x", "index.html")], "index.html")?.id).toBe("x");
  });
});

describe("lesson progression", () => {
  it("walks forward as the tree is built, then completes", () => {
    expect(currentStepIndex([], steps)).toBe(0);
    const withFolder = [folder("f1", "site")];
    expect(currentStepIndex(withFolder, steps)).toBe(1);
    const withFile = [...withFolder, file("a", "index.html")];
    expect(currentStepIndex(withFile, steps)).toBe(2);
    const withH1 = [folder("f1", "site"), file("a", "index.html", "<h1>Hi</h1>")];
    expect(currentStepIndex(withH1, steps)).toBe(3);
    expect(isClassComplete(withH1, steps)).toBe(true);
    expect(isClassComplete(withFile, steps)).toBe(false);
  });

  it("does not restart: extra content past the last step stays complete", () => {
    const rich = [
      folder("f1", "site"),
      file("a", "index.html", "<h1>Hi</h1>\n<h2>More</h2>\n<p>Even more.</p>"),
    ];
    expect(currentStepIndex(rich, steps)).toBe(steps.length);
    expect(isClassComplete(rich, steps)).toBe(true);
  });
});

describe("validation semantics", () => {
  it("accepts valid HTML regardless of spacing/newlines/case", () => {
    const tight = [file("a", "index.html", "<h1>Cat</h1>")];
    const loose = [file("b", "index.html", "  <H1>\n   Cat\n  </H1>  ")];
    const check = { type: "content-has", file: "index.html", needle: "<h1" } as const;
    expect(checkStep(tight, check)).toBe(true);
    expect(checkStep(loose, check)).toBe(true);
  });

  it("fails when a required closing tag is missing", () => {
    const open = [file("a", "index.html", "<h1>Cat")];
    const closed = [file("b", "index.html", "<h1>Cat</h1>")];
    const needsClose = { type: "content-has", file: "index.html", needle: "</h1>" } as const;
    expect(checkStep(open, needsClose)).toBe(false);
    expect(checkStep(closed, needsClose)).toBe(true);
  });

  it("checks required accessibility attributes (alt text on images)", () => {
    const noAlt = [file("a", "index.html", '<img src="cat.png">')];
    const withAlt = [file("b", "index.html", '<img src="cat.png" alt="my cat">')];
    const needsAlt = { type: "content-has", file: "index.html", needle: "alt" } as const;
    expect(checkStep(noAlt, needsAlt)).toBe(false);
    expect(checkStep(withAlt, needsAlt)).toBe(true);
  });
});
