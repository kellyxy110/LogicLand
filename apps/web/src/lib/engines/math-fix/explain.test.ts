import { describe, expect, it } from "vitest";
import { workedExample, workedExampleText } from "./explain";

describe("workedExample", () => {
  it("produces a fully worked analogous example for a live topic", () => {
    const w = workedExample("percentages-of-amount", 3, () => 0.5);
    expect(w).not.toBeNull();
    expect(w!.prompt.length).toBeGreaterThan(0);
    expect(w!.steps.length).toBeGreaterThan(0);
    expect(Number.isInteger(w!.answer)).toBe(true);
  });

  it("returns null for an unknown topic", () => {
    expect(workedExample("nope")).toBeNull();
  });

  it("workedExampleText is a non-empty string for every live topic", () => {
    for (const id of [
      "linear-equations",
      "order-of-operations",
      "fractions-of-amount",
      "percentages-of-amount",
    ]) {
      expect(workedExampleText(id).length).toBeGreaterThan(10);
    }
  });
});
