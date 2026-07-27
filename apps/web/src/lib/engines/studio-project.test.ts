import { describe, expect, it } from "vitest";
import {
  buildRunnableDoc,
  CONSOLE_BRIDGE,
  defaultStudioProject,
  entryHtml,
  isPythonFile,
  languageForFile,
  pythonEntry,
} from "./studio-project";
import type { FsNode } from "@/types/studio";

const file = (name: string, content: string): FsNode => ({
  id: name,
  name,
  kind: "file",
  parentId: null,
  content,
});

describe("languageForFile", () => {
  it("maps extensions to Monaco language ids", () => {
    expect(languageForFile("index.html")).toBe("html");
    expect(languageForFile("style.css")).toBe("css");
    expect(languageForFile("script.js")).toBe("javascript");
    expect(languageForFile("main.ts")).toBe("typescript");
    expect(languageForFile("data.json")).toBe("json");
    expect(languageForFile("app.py")).toBe("python");
    expect(languageForFile("README")).toBe("plaintext");
  });
});

describe("entryHtml", () => {
  it("prefers index.html, else the first .html, else null", () => {
    const nodes = [file("about.html", ""), file("index.html", "<h1>hi</h1>")];
    expect(entryHtml(nodes)?.name).toBe("index.html");
    expect(entryHtml([file("about.html", "x")])?.name).toBe("about.html");
    expect(entryHtml([file("style.css", "x")])).toBeNull();
  });
});

describe("buildRunnableDoc", () => {
  const nodes = [
    file(
      "index.html",
      `<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Hi</h1><script src="script.js"></script></body></html>`,
    ),
    file("style.css", "h1 { color: red; }"),
    file("script.js", "console.log('hello');"),
  ];

  it("returns null when there is no HTML entry", () => {
    expect(buildRunnableDoc([file("style.css", "x")])).toBeNull();
  });

  it("inlines css into a <style> and js into a <script>", () => {
    const doc = buildRunnableDoc(nodes)!;
    expect(doc).toContain("<style>");
    expect(doc).toContain("h1 { color: red; }");
    expect(doc).toContain("console.log('hello');");
  });

  it("strips local <link> and <script src> so nothing 404s in the sandbox", () => {
    const doc = buildRunnableDoc(nodes)!;
    expect(doc).not.toContain('href="style.css"');
    expect(doc).not.toContain('src="script.js"');
  });

  it("injects the console bridge before the user's script", () => {
    const doc = buildRunnableDoc(nodes)!;
    expect(doc).toContain("__logicland_studio");
    expect(doc.indexOf(CONSOLE_BRIDGE)).toBeLessThan(doc.indexOf("console.log('hello');"));
  });

  it("keeps http(s) stylesheet/script references intact", () => {
    const doc = buildRunnableDoc([
      file(
        "index.html",
        `<html><head><link rel="stylesheet" href="https://cdn.example/x.css"></head><body></body></html>`,
      ),
    ])!;
    expect(doc).toContain("https://cdn.example/x.css");
  });
});

describe("python entry", () => {
  it("prefers main.py, else the first .py, else null", () => {
    expect(pythonEntry([file("a.py", ""), file("main.py", "x")])?.name).toBe("main.py");
    expect(pythonEntry([file("solve.py", "x")])?.name).toBe("solve.py");
    expect(pythonEntry([file("index.html", "x")])).toBeNull();
  });

  it("isPythonFile detects .py", () => {
    expect(isPythonFile("main.py")).toBe(true);
    expect(isPythonFile("index.html")).toBe(false);
  });
});

describe("defaultStudioProject", () => {
  it("is a real runnable multi-file project with web files and Python", () => {
    const proj = defaultStudioProject();
    const names = proj.map((f) => f.name);
    expect(names).toEqual(["index.html", "style.css", "script.js", "main.py"]);
    const nodes: FsNode[] = proj.map((f, i) => ({
      id: String(i),
      parentId: null,
      ...f,
    }));
    const doc = buildRunnableDoc(nodes)!;
    expect(doc).toContain("My LogicLand App");
    expect(doc).toContain("addEventListener");
  });
});
