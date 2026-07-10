import { describe, expect, it } from "vitest";
import { findUnsafeHtml, isHtmlSafe } from "./html-safety";

describe("findUnsafeHtml", () => {
  it("passes ordinary, well-formed markup a child would write", () => {
    expect(isHtmlSafe("<h1>My Cat</h1><p>Fluffy is soft.</p>")).toBe(true);
    expect(isHtmlSafe('<img src="cat.png" alt="my cat">')).toBe(true);
    expect(isHtmlSafe('<a href="https://example.com">A link</a>')).toBe(true);
    expect(findUnsafeHtml("")).toEqual([]);
  });

  it("flags a <script> tag (script injection prevented)", () => {
    const findings = findUnsafeHtml('<script>alert("x")</script>');
    expect(findings.some((f) => f.kind === "script-tag")).toBe(true);
    expect(isHtmlSafe("<SCRIPT src=evil.js></SCRIPT>")).toBe(false);
  });

  it("flags inline event handlers like onclick / onerror", () => {
    expect(isHtmlSafe('<img src=x onerror="steal()">')).toBe(false);
    expect(isHtmlSafe('<button onclick="go()">Go</button>')).toBe(false);
  });

  it("flags javascript: URLs", () => {
    expect(isHtmlSafe('<a href="javascript:alert(1)">x</a>')).toBe(false);
  });

  it("flags iframes, objects/embeds, and srcdoc", () => {
    expect(isHtmlSafe('<iframe src="http://evil"></iframe>')).toBe(false);
    expect(isHtmlSafe("<object data=x></object>")).toBe(false);
    expect(isHtmlSafe('<iframe srcdoc="<script>x</script>"></iframe>')).toBe(false);
  });

  it("does not confuse safe attributes for handlers", () => {
    // 'son'/'one' substrings and normal attrs must not trip the on* rule.
    expect(isHtmlSafe('<p class="lesson one">hi</p>')).toBe(true);
    expect(isHtmlSafe('<img alt="a person" src="p.png">')).toBe(true);
  });
});
