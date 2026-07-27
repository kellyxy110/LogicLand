import { describe, expect, it } from "vitest";
import {
  atLeast,
  capabilities,
  DEFAULT_MODE,
  isAgeMode,
  modeForAge,
  term,
} from "./age-mode";

describe("age-mode", () => {
  it("maps age to a mode", () => {
    expect(modeForAge(5)).toBe("sprout");
    expect(modeForAge(8)).toBe("explorer");
    expect(modeForAge(11)).toBe("builder");
    expect(modeForAge(14)).toBe("developer");
    expect(modeForAge(20)).toBe("pro");
    expect(modeForAge(undefined)).toBe(DEFAULT_MODE);
  });

  it("atLeast orders modes youngest → most advanced", () => {
    expect(atLeast("pro", "builder")).toBe(true);
    expect(atLeast("sprout", "builder")).toBe(false);
    expect(atLeast("builder", "builder")).toBe(true);
  });

  it("reveals vocabulary progressively, real term always visible from builder up", () => {
    expect(term("commit", "sprout")).toBe("Save Point");
    expect(term("commit", "builder")).toBe("Save Point (Commit)");
    expect(term("commit", "developer")).toBe("Commit");
    expect(term("unknown-key", "pro")).toBe("unknown-key");
  });

  it("gates capabilities by mode (progressive disclosure + dev unlocks)", () => {
    expect(capabilities("sprout").terminal).toBe(false);
    expect(capabilities("builder").terminal).toBe(true);
    expect(capabilities("builder").developerMode).toBe(false);
    expect(capabilities("developer").developerMode).toBe(true);
    expect(capabilities("pro").difficulty).toBeGreaterThan(capabilities("sprout").difficulty);
  });

  it("isAgeMode validates stored values", () => {
    expect(isAgeMode("builder")).toBe(true);
    expect(isAgeMode("nope")).toBe(false);
  });
});
