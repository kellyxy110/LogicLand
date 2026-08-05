import { describe, expect, it } from "vitest";
import {
  SHAPE_PRESETS,
  angleDeg,
  applyTransform,
  classifyTriangleByAngles,
  classifyTriangleBySides,
  distance,
  interiorAngles,
  measureShape,
  midpoint,
  polygonArea,
  polygonPerimeter,
  reflect,
  rotate,
  scale,
  sideLengths,
  translate,
  type Point,
} from "./geometry";

describe("geometry engine (ADR-029)", () => {
  describe("primitives", () => {
    it("computes distance", () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it("computes midpoint", () => {
      expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 6 })).toEqual({ x: 2, y: 3 });
    });

    it("computes the angle at a vertex", () => {
      // Right angle at the origin: rays to (1,0) and (0,1).
      expect(angleDeg({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90);
      // Straight line: angle at b is 180.
      expect(angleDeg({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(180);
    });
  });

  describe("polygon measurement", () => {
    const square: Point[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
    const rightTriangle: Point[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }];

    it("computes area via the shoelace formula", () => {
      expect(polygonArea(square)).toBe(16);
      expect(polygonArea(rightTriangle)).toBe(6);
    });

    it("computes perimeter", () => {
      expect(polygonPerimeter(square)).toBe(16);
      expect(polygonPerimeter(rightTriangle)).toBe(4 + 3 + 5);
    });

    it("computes side lengths in order", () => {
      expect(sideLengths(square)).toEqual([4, 4, 4, 4]);
    });

    it("computes interior angles that sum to (n-2)*180", () => {
      const angles = interiorAngles(square);
      expect(angles.reduce((a, b) => a + b, 0)).toBeCloseTo(360);
      angles.forEach((a) => expect(a).toBeCloseTo(90));

      const triAngles = interiorAngles(rightTriangle);
      expect(triAngles.reduce((a, b) => a + b, 0)).toBeCloseTo(180);
    });
  });

  describe("triangle classification", () => {
    it("classifies by sides", () => {
      expect(classifyTriangleBySides([5, 5, 5])).toBe("equilateral");
      expect(classifyTriangleBySides([5, 5, 8])).toBe("isosceles");
      expect(classifyTriangleBySides([3, 4, 5])).toBe("scalene");
    });

    it("classifies by angles", () => {
      expect(classifyTriangleByAngles([90, 45, 45])).toBe("right");
      expect(classifyTriangleByAngles([120, 30, 30])).toBe("obtuse");
      expect(classifyTriangleByAngles([60, 60, 60])).toBe("acute");
    });
  });

  describe("transforms", () => {
    const tri: Point[] = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }];

    it("translates", () => {
      expect(translate(tri, 3, -1)).toEqual([{ x: 3, y: -1 }, { x: 5, y: -1 }, { x: 3, y: 1 }]);
    });

    it("rotates 90 degrees about the origin", () => {
      const r = rotate([{ x: 1, y: 0 }], { x: 0, y: 0 }, 90);
      expect(r[0].x).toBeCloseTo(0);
      expect(r[0].y).toBeCloseTo(1);
    });

    it("reflects across each axis", () => {
      const p: Point[] = [{ x: 2, y: 3 }];
      expect(reflect(p, "x-axis")).toEqual([{ x: 2, y: -3 }]);
      expect(reflect(p, "y-axis")).toEqual([{ x: -2, y: 3 }]);
      expect(reflect(p, "y=x")).toEqual([{ x: 3, y: 2 }]);
      expect(reflect(p, "y=-x")).toEqual([{ x: -3, y: -2 }]);
    });

    it("scales about a center", () => {
      const r = scale([{ x: 2, y: 2 }], { x: 0, y: 0 }, 2);
      expect(r).toEqual([{ x: 4, y: 4 }]);
    });

    it("preserves area under rotation (a rigid transform)", () => {
      const rotated = rotate(tri, { x: 0, y: 0 }, 37);
      expect(polygonArea(rotated)).toBeCloseTo(polygonArea(tri));
    });
  });

  describe("measureShape", () => {
    it("labels vertices and reports classification for a triangle", () => {
      const r = measureShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }]);
      expect(r.steps.some((s) => s.label === "Side AB" && s.expr === "4")).toBe(true);
      expect(r.steps.some((s) => s.label === "Classify by angles" && s.expr === "right")).toBe(true);
      expect(r.result).toContain("Right");
    });

    it("skips classification for non-triangles", () => {
      const r = measureShape([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }]);
      expect(r.steps.some((s) => s.label.startsWith("Classify"))).toBe(false);
    });
  });

  describe("SHAPE_PRESETS", () => {
    it("the equilateral triangle preset classifies as equilateral (full-precision coordinates)", () => {
      const preset = SHAPE_PRESETS.find((p) => p.label === "Equilateral triangle")!;
      const r = measureShape(preset.points);
      expect(r.steps.find((s) => s.label === "Classify by sides")?.expr).toBe("equilateral");
    });
  });

  describe("applyTransform", () => {
    it("shows a before → after step per vertex", () => {
      const r = applyTransform([{ x: 0, y: 0 }, { x: 2, y: 0 }], { kind: "translate", dx: 1, dy: 1 });
      expect(r.after).toEqual([{ x: 1, y: 1 }, { x: 3, y: 1 }]);
      expect(r.steps[0].label).toBe("Transformation");
      expect(r.steps.length).toBe(3); // header + 2 vertices
    });
  });
});
