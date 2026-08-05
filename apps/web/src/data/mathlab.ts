// MathLab — the Mathematics foundation's ecosystem (Phase 1 #3). A registry of
// "labs" presented honestly: what's live is enterable now; the rest is the
// roadmap, clearly badged, never a fake button (same discipline as the academy
// catalog). Each lab flips to `status: "live"` with an `href` as it ships.
export type MathLabStatus = "live" | "soon";

export interface MathLab {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Lucide icon key, resolved in the UI (keeps data React-free). */
  icon: string;
  gradient: string;
  status: MathLabStatus;
  href?: string;
}

export const MATHLABS: MathLab[] = [
  {
    id: "math-fix",
    name: "Math Fix™",
    tagline: "Practice that repairs the exact misconception.",
    description:
      "Adaptive practice across Linear Equations, Order of Operations, Fractions and Percentages — it names why an answer is wrong and repairs the idea.",
    icon: "target",
    gradient: "from-rose-500 to-orange-500",
    status: "live",
    href: "/academies/math-fix",
  },
  {
    id: "sketchpad",
    name: "Math Sketchpad",
    tagline: "Work it out by hand on a canvas.",
    description:
      "A visual workspace where you solve a problem by hand and get the same deterministic feedback in place.",
    icon: "penline",
    gradient: "from-fuchsia-500 to-rose-500",
    status: "live",
    href: "/academies/math-fix/sketchpad",
  },
  {
    id: "proof-workshop",
    name: "Proof Workshop",
    tagline: "Build a real argument, step by step.",
    description:
      "Assemble assumptions and reasoning into a proof the system checks structurally — the differentiator that teaches genuine mathematical reasoning.",
    icon: "scroll",
    gradient: "from-indigo-500 to-violet-600",
    status: "live",
    href: "/mathlab/proof",
  },
  {
    id: "algebra-studio",
    name: "Algebra Studio",
    tagline: "Manipulate expressions with confidence.",
    description: "Expand, factor, simplify and solve — with each step explained.",
    icon: "variable",
    gradient: "from-violet-500 to-purple-600",
    status: "live",
    href: "/mathlab/algebra",
  },
  {
    id: "geometry-lab",
    name: "Geometry Lab",
    tagline: "Construct, measure and transform.",
    description: "Interactive constructions, angles, transformations and geometric proofs.",
    icon: "shapes",
    gradient: "from-sky-500 to-cyan-600",
    status: "live",
    href: "/mathlab/geometry",
  },
  {
    id: "graph-explorer",
    name: "Graph Explorer",
    tagline: "See functions come alive.",
    description: "Type a function of x and plot it — lines, curves and waves, with x-intercepts marked.",
    icon: "linechart",
    gradient: "from-emerald-500 to-teal-600",
    status: "live",
    href: "/mathlab/graph",
  },
  {
    id: "number-theory",
    name: "Number Theory",
    tagline: "Primes, factors and patterns.",
    description: "Divisibility, primes, modular arithmetic and the beauty of whole numbers.",
    icon: "hash",
    gradient: "from-amber-500 to-yellow-500",
    status: "soon",
  },
  {
    id: "statistics-lab",
    name: "Statistics Lab",
    tagline: "Make sense of data.",
    description: "Averages, spread, probability and simulations you can run and see.",
    icon: "barchart",
    gradient: "from-lime-500 to-green-600",
    status: "soon",
  },
  {
    id: "calculus-visualizer",
    name: "Calculus Visualizer",
    tagline: "Watch change happen.",
    description: "Limits, gradients, areas under curves — the ideas of calculus, made visual.",
    icon: "activity",
    gradient: "from-orange-500 to-red-500",
    status: "soon",
  },
  {
    id: "olympiad",
    name: "Olympiad Challenges",
    tagline: "Train for the toughest problems.",
    description: "Curated competition problems with hints, multiple solutions and timing.",
    icon: "trophy",
    gradient: "from-yellow-500 to-amber-600",
    status: "soon",
  },
  {
    id: "computational-math",
    name: "Computational Mathematics",
    tagline: "Solve maths with code.",
    description: "Implement mathematical ideas as programs — the maths-to-code bridge.",
    icon: "binary",
    gradient: "from-slate-500 to-gray-600",
    status: "soon",
  },
  {
    id: "engineering-math",
    name: "Engineering Mathematics",
    tagline: "The maths engineers use.",
    description: "Vectors, matrices, and applied models for physics and engineering.",
    icon: "cpu",
    gradient: "from-cyan-500 to-blue-600",
    status: "soon",
  },
];

export function sortedMathLabs(): MathLab[] {
  return [...MATHLABS].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "live" ? -1 : 1,
  );
}

export function mathLabById(id: string): MathLab | undefined {
  return MATHLABS.find((l) => l.id === id);
}
