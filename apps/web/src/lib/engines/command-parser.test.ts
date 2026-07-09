import { describe, expect, it } from "vitest";
import { COMMAND_GRAMMAR } from "@/data/commands";
import { editDistance, friendlyHint, parseCommands } from "./command-parser";

const parse = (input: string) => parseCommands(input, COMMAND_GRAMMAR);

describe("editDistance", () => {
  it("measures single-edit typos", () => {
    expect(editDistance("go", "go")).toBe(0);
    expect(editDistance("goo", "go")).toBe(1);
    expect(editDistance("rihgt", "right")).toBe(2);
  });
});

describe("parseCommands", () => {
  it("parses clean commands, case- and separator-insensitive", () => {
    const r = parse("GO right\nup, DOWN");
    expect(r.tokens).toEqual(["GO", "RIGHT", "UP", "DOWN"]);
    expect(r.ok).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("accepts friendly aliases", () => {
    expect(parse("forward hop dash").tokens).toEqual(["GO", "JUMP", "RUN"]);
  });

  it("flags unknown words with a suggestion for typos", () => {
    const r = parse("go rihgt");
    expect(r.tokens).toEqual(["GO"]);
    expect(r.ok).toBe(false);
    expect(r.issues[0]).toEqual({ word: "rihgt", suggestion: "RIGHT" });
  });

  it("does not wild-guess a suggestion for gibberish", () => {
    const r = parse("go xyzzyplugh");
    expect(r.issues[0].suggestion).toBeNull();
  });

  it("is not ok on empty input", () => {
    expect(parse("   ").ok).toBe(false);
  });
});

describe("friendlyHint", () => {
  it("prompts when nothing is typed", () => {
    expect(friendlyHint(parse(""))).toMatch(/type a command/i);
  });

  it("suggests the intended command on a typo", () => {
    expect(friendlyHint(parse("go rihgt"))).toMatch(/did you mean RIGHT/i);
  });

  it("returns null when everything parses", () => {
    expect(friendlyHint(parse("go up"))).toBeNull();
  });
});
