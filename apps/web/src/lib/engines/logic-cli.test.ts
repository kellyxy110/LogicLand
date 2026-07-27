import { describe, expect, it } from "vitest";
import { runLogicCommand, tokenize } from "./logic-cli";

describe("tokenize", () => {
  it("keeps quoted phrases together", () => {
    expect(tokenize('git save "Created the navbar"')).toEqual([
      "git",
      "save",
      "Created the navbar",
    ]);
  });
});

describe("runLogicCommand", () => {
  it("git save shows the real git commands underneath", () => {
    const res = runLogicCommand('git save "Created the navbar"');
    const real = res.lines.filter((l) => l.tone === "real").map((l) => l.text);
    expect(real).toContain("git add .");
    expect(real).toContain('git commit -m "Created the navbar"');
  });

  it("tolerates a leading 'logic' prefix", () => {
    const res = runLogicCommand("logic git status");
    expect(res.lines.some((l) => l.tone === "real" && l.text === "git status")).toBe(true);
  });

  it("explains a known concept and guides on an unknown one", () => {
    expect(runLogicCommand("explain loops").lines[0].text).toMatch(/loop/i);
    expect(runLogicCommand("explain zzz").lines[0].text).toMatch(/Try a concept/);
  });

  it("help lists commands; clear requests a clear", () => {
    expect(runLogicCommand("help").lines.length).toBeGreaterThan(3);
    expect(runLogicCommand("clear").clear).toBe(true);
  });

  it("unknown git subcommand and unknown command both error kindly", () => {
    expect(runLogicCommand("git frobnicate").lines[0].tone).toBe("error");
    expect(runLogicCommand("teleport").lines[0].tone).toBe("error");
  });

  it("empty input is a no-op", () => {
    expect(runLogicCommand("   ").lines).toEqual([]);
  });
});
