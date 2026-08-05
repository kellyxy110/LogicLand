import { describe, expect, it } from "vitest";
import {
  computeProbability,
  describeDataset,
  experimentOutcomes,
  mean,
  median,
  modes,
  parseDataset,
  range,
  simulate,
  simulateSummary,
  stdDev,
  variance,
} from "./statistics";

describe("statistics engine (ADR-031)", () => {
  describe("parseDataset", () => {
    it("parses comma- and space-separated numbers", () => {
      expect(parseDataset("1, 2, 3")).toEqual([1, 2, 3]);
      expect(parseDataset("1 2 3")).toEqual([1, 2, 3]);
      expect(parseDataset("1,2,  3")).toEqual([1, 2, 3]);
    });

    it("rejects non-numeric input", () => {
      expect(parseDataset("1, two, 3")).toBeNull();
      expect(parseDataset("")).toBeNull();
    });
  });

  describe("descriptive statistics primitives", () => {
    const data = [4, 8, 6, 5, 3, 2, 8, 9, 2, 5];

    it("computes mean", () => {
      expect(mean(data)).toBeCloseTo(5.2);
    });

    it("computes median for even and odd counts", () => {
      expect(median(data)).toBe(5); // sorted: 2,2,3,4,5,5,6,8,8,9 → mid two are 5,5
      expect(median([1, 2, 3])).toBe(2);
    });

    it("finds all tied modes", () => {
      expect(modes(data)).toEqual([2, 5, 8]); // each occurs twice
      expect(modes([1, 2, 3])).toEqual([]); // no repeats — no mode
    });

    it("computes range", () => {
      expect(range(data)).toBe(7); // 9 - 2
    });

    it("computes population and sample variance/stdDev, sample > population", () => {
      const popVar = variance(data, "population");
      const sampVar = variance(data, "sample");
      expect(sampVar).toBeGreaterThan(popVar);
      expect(stdDev(data, "population")).toBeCloseTo(Math.sqrt(popVar));
    });
  });

  describe("describeDataset", () => {
    it("produces a full step trace", () => {
      const r = describeDataset("4, 8, 6, 5, 3, 2, 8, 9, 2, 5");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.steps.some((s) => s.label === "Count (n)" && s.expr === "10")).toBe(true);
        expect(r.result).toContain("mean 5.2");
      }
    });

    it("rejects empty or single-value input", () => {
      expect(describeDataset("").ok).toBe(false);
      expect(describeDataset("5").ok).toBe(false);
    });

    it("rejects non-numeric input", () => {
      expect(describeDataset("a, b, c").ok).toBe(false);
    });
  });

  describe("experimentOutcomes", () => {
    it("has the right outcome counts", () => {
      expect(experimentOutcomes("coin")).toHaveLength(2);
      expect(experimentOutcomes("die")).toHaveLength(6);
      expect(experimentOutcomes("deck")).toHaveLength(52);
    });
  });

  describe("computeProbability", () => {
    it("computes an exact reduced fraction for a die event", () => {
      const r = computeProbability("die-even");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("P(Roll an even number) = 1/2");
    });

    it("computes probability for a card event", () => {
      const r = computeProbability("deck-heart");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("P(Draw a heart) = 1/4");
    });

    it("computes probability for an ace (4/52 reduced)", () => {
      const r = computeProbability("deck-ace");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("P(Draw an ace) = 1/13");
    });

    it("rejects an unknown event id", () => {
      expect(computeProbability("nope").ok).toBe(false);
    });
  });

  describe("simulate", () => {
    it("is deterministic for a given seed", () => {
      const a = simulate("die", 200, 42);
      const b = simulate("die", 200, 42);
      expect(a.outcomes).toEqual(b.outcomes);
    });

    it("produces different results for a different seed", () => {
      const a = simulate("die", 200, 1);
      const b = simulate("die", 200, 2);
      expect(a.outcomes).not.toEqual(b.outcomes);
    });

    it("counts sum to the number of trials", () => {
      const r = simulate("coin", 500, 7);
      const total = r.outcomes.reduce((s, o) => s + o.count, 0);
      expect(total).toBe(500);
    });

    it("empirical frequency approaches theoretical over many trials", () => {
      const r = simulate("coin", 20000, 99);
      for (const o of r.outcomes) expect(Math.abs(o.empirical - o.theoretical)).toBeLessThan(0.02);
    });

    it("summarizes with a step trace including drift", () => {
      const run = simulate("die", 300, 5);
      const r = simulateSummary(run);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.steps.some((s) => s.label === "Largest drift from theoretical")).toBe(true);
    });
  });
});
