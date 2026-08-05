// Geometry Lab engine (ADR-029) — pure, deterministic construction, measurement
// and transformation of polygons in the plane. No trig black box hidden from
// the learner: distance, angle, area and every transform is a small closed-
// form computation, exposed as labelled steps (ADR-015 — the engine computes,
// AI never grades). No eval, no network.

export interface Point {
  x: number;
  y: number;
}

const EPS = 1e-6;

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Interior angle at vertex b, formed by rays b->a and b->c, in degrees (0-180). */
export function angleDeg(a: Point, b: Point, c: Point): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (mag < EPS) return 0;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Sum of |x_i*y_i+1 - x_i+1*y_i| / 2 — the shoelace formula, works for any simple polygon. */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonPerimeter(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) sum += distance(points[i], points[(i + 1) % points.length]);
  return sum;
}

export function sideLengths(points: Point[]): number[] {
  return points.map((p, i) => distance(p, points[(i + 1) % points.length]));
}

/** Interior angle at each vertex, using its two neighbours around the polygon. */
export function interiorAngles(points: Point[]): number[] {
  const n = points.length;
  return points.map((_, i) => angleDeg(points[(i - 1 + n) % n], points[i], points[(i + 1) % n]));
}

export type SideClass = "equilateral" | "isosceles" | "scalene";
export type AngleClass = "right" | "acute" | "obtuse";

export function classifyTriangleBySides(sides: number[]): SideClass {
  const [a, b, c] = sides;
  const eq = (x: number, y: number) => Math.abs(x - y) < 1e-3;
  if (eq(a, b) && eq(b, c)) return "equilateral";
  if (eq(a, b) || eq(b, c) || eq(a, c)) return "isosceles";
  return "scalene";
}

export function classifyTriangleByAngles(angles: number[]): AngleClass {
  const maxAngle = Math.max(...angles);
  if (Math.abs(maxAngle - 90) < 0.5) return "right";
  if (maxAngle > 90) return "obtuse";
  return "acute";
}

// --- Transforms --------------------------------------------------------------
export function translate(points: Point[], dx: number, dy: number): Point[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

export function rotate(points: Point[], center: Point, degrees: number): Point[] {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  });
}

export type ReflectAxis = "x-axis" | "y-axis" | "y=x" | "y=-x";

export function reflect(points: Point[], axis: ReflectAxis): Point[] {
  return points.map((p) => {
    switch (axis) {
      case "x-axis":
        return { x: p.x, y: -p.y };
      case "y-axis":
        return { x: -p.x, y: p.y };
      case "y=x":
        return { x: p.y, y: p.x };
      case "y=-x":
        return { x: -p.y, y: -p.x };
    }
  });
}

export function scale(points: Point[], center: Point, factor: number): Point[] {
  return points.map((p) => ({ x: center.x + (p.x - center.x) * factor, y: center.y + (p.y - center.y) * factor }));
}

// --- Steps (mirrors Algebra Studio's contract: never just an answer) --------
export interface Step {
  label: string;
  expr: string;
}

const VERTEX_NAMES = "ABCDEFGH";
const fmt = (n: number): string => (Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : n.toFixed(2));
const ptStr = (p: Point): string => `(${fmt(p.x)}, ${fmt(p.y)})`;

export function measureShape(points: Point[]): { steps: Step[]; result: string } {
  const steps: Step[] = [];
  const names = points.map((_, i) => VERTEX_NAMES[i] ?? `P${i}`);
  points.forEach((p, i) => steps.push({ label: `Vertex ${names[i]}`, expr: ptStr(p) }));

  const sides = sideLengths(points);
  sides.forEach((s, i) => {
    const a = names[i];
    const b = names[(i + 1) % names.length];
    steps.push({ label: `Side ${a}${b}`, expr: fmt(s) });
  });
  const perimeter = polygonPerimeter(points);
  steps.push({ label: "Perimeter", expr: fmt(perimeter) });

  const angles = interiorAngles(points);
  angles.forEach((a, i) => steps.push({ label: `Angle at ${names[i]}`, expr: `${fmt(a)}°` }));

  const area = polygonArea(points);
  steps.push({ label: "Area (shoelace formula)", expr: fmt(area) });

  let result = `Perimeter ${fmt(perimeter)} · Area ${fmt(area)}`;
  if (points.length === 3) {
    const bySides = classifyTriangleBySides(sides);
    const byAngles = classifyTriangleByAngles(angles);
    steps.push({ label: "Classify by sides", expr: bySides });
    steps.push({ label: "Classify by angles", expr: byAngles });
    result = `${byAngles[0].toUpperCase()}${byAngles.slice(1)} ${bySides} triangle · Perimeter ${fmt(perimeter)} · Area ${fmt(area)}`;
  }
  return { steps, result };
}

export interface TransformResult {
  before: Point[];
  after: Point[];
  steps: Step[];
}

export type Transform =
  | { kind: "translate"; dx: number; dy: number }
  | { kind: "rotate"; center: Point; degrees: number }
  | { kind: "reflect"; axis: ReflectAxis }
  | { kind: "scale"; center: Point; factor: number };

export function applyTransform(points: Point[], t: Transform): TransformResult {
  const names = points.map((_, i) => VERTEX_NAMES[i] ?? `P${i}`);
  let after: Point[];
  let label: string;
  switch (t.kind) {
    case "translate":
      after = translate(points, t.dx, t.dy);
      label = `Translate by (${fmt(t.dx)}, ${fmt(t.dy)})`;
      break;
    case "rotate":
      after = rotate(points, t.center, t.degrees);
      label = `Rotate ${fmt(t.degrees)}° about ${ptStr(t.center)}`;
      break;
    case "reflect":
      after = reflect(points, t.axis);
      label = `Reflect across ${t.axis}`;
      break;
    case "scale":
      after = scale(points, t.center, t.factor);
      label = `Scale by ${fmt(t.factor)}× about ${ptStr(t.center)}`;
      break;
  }
  const steps: Step[] = points.map((p, i) => ({ label: `${names[i]}: ${ptStr(p)} →`, expr: ptStr(after[i]) }));
  steps.unshift({ label: "Transformation", expr: label });
  return { before: points, after, steps };
}

// --- Presets (kid-facing starting shapes) -----------------------------------
export interface ShapePreset {
  label: string;
  points: Point[];
}

function regularPolygon(n: number, radius: number, center: Point = { x: 0, y: 0 }): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / n; // start pointing up
    return { x: Math.round((center.x + radius * Math.cos(theta)) * 1000) / 1000, y: Math.round((center.y + radius * Math.sin(theta)) * 1000) / 1000 };
  });
}

export const SHAPE_PRESETS: ShapePreset[] = [
  // Half-base = height * 2/sqrt(3), kept at full precision so all three sides
  // measure exactly equal (a rounded half-base would misclassify as isosceles).
  { label: "Equilateral triangle", points: [{ x: 0, y: 4 }, { x: -(6 * (2 / Math.sqrt(3))) / 2, y: -2 }, { x: (6 * (2 / Math.sqrt(3))) / 2, y: -2 }] },
  { label: "Right triangle (3-4-5)", points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }] },
  { label: "Scalene triangle", points: [{ x: 0, y: 0 }, { x: 5, y: 1 }, { x: 2, y: 4 }] },
  { label: "Square", points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }] },
  { label: "Rectangle", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 3 }, { x: 0, y: 3 }] },
  { label: "Regular pentagon", points: regularPolygon(5, 4) },
];
