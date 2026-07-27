import { describe, expect, it } from "vitest";
import { codeEvidenceKey, detectCodeSkills } from "./code-skills";

describe("detectCodeSkills", () => {
  it("detects concepts in a JavaScript file", () => {
    const ev = detectCodeSkills([
      {
        name: "script.js",
        content: `const items = [1, 2, 3];
function total(list) {
  let sum = 0;
  for (const n of list) {
    if (n > 0) sum += n;
  }
  return sum;
}
document.getElementById("go").addEventListener("click", () => total(items));`,
      },
    ]);
    expect(ev.has(codeEvidenceKey("variables"))).toBe(true);
    expect(ev.has(codeEvidenceKey("loops"))).toBe(true);
    expect(ev.has(codeEvidenceKey("conditions"))).toBe(true);
    expect(ev.has(codeEvidenceKey("functions"))).toBe(true);
    expect(ev.has(codeEvidenceKey("events"))).toBe(true);
    expect(ev.has(codeEvidenceKey("data-structures"))).toBe(true);
    expect(ev.has(codeEvidenceKey("sequence"))).toBe(true);
  });

  it("detects loops and functions in Python", () => {
    const ev = detectCodeSkills([
      { name: "main.py", content: "def greet(n):\n    for i in range(n):\n        print(i)" },
    ]);
    expect(ev.has(codeEvidenceKey("functions"))).toBe(true);
    expect(ev.has(codeEvidenceKey("loops"))).toBe(true);
  });

  it("ignores non-code files and returns nothing for empty input", () => {
    expect(detectCodeSkills([{ name: "style.css", content: "body { color: red; }" }]).size).toBe(0);
    expect(detectCodeSkills([{ name: "main.py", content: "   " }]).size).toBe(0);
    expect(detectCodeSkills([]).size).toBe(0);
  });
});
