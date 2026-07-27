// MathLab — the Mathematics foundation's hub (ADR-010/011). A Server Component:
// the registry is plain data rendered through a client grid for the entrance
// animations. Live labs (Math Fix, Sketchpad) are enterable; the rest is shown
// honestly as "in development".
import { Sigma, Sparkles } from "lucide-react";
import { MathLabGrid } from "@/features/mathlab/MathLabGrid";
import { MATHLABS } from "@/data/mathlab";

export const metadata = {
  title: "MathLab · LogicLand",
  description:
    "LogicLand's Mathematics ecosystem — Math Fix, the Sketchpad, Proof Workshop, Geometry, Graphs, Statistics, Calculus and more.",
};

export default function MathLabPage() {
  const live = MATHLABS.filter((l) => l.status === "live").length;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-sm font-bold text-rose-600 dark:text-rose-300">
          <Sigma className="h-4 w-4" /> MathLab
        </span>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Understand it. Visualise it. Compute it.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg opacity-75">
          The Mathematics foundation — from repairing misconceptions with Math Fix™ to
          proofs, geometry, graphs, statistics and computational maths.
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-meadow/10 px-3 py-1 text-sm font-semibold text-meadow">
          <Sparkles className="h-4 w-4" />
          {live} labs live now · more on the roadmap
        </p>
      </header>

      <MathLabGrid />
    </main>
  );
}
