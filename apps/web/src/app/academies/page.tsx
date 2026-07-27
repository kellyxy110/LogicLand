// The Academies hub — LogicLand's top-level map. Grouped under the three
// permanent foundations (ADR-010): Programming, Mathematics, AI. LogicLand is a
// programming platform first, so Coding leads; every other subject is shown as a
// branch of one of the three foundations. A Server Component: the catalog is
// plain data, rendered through a client grid for the entrance animations. Live
// academies (today: Coding, Math Fix) are enterable; the rest is shown honestly
// as "in development".
import { Brain, Code2, GraduationCap, Sigma, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AcademyGrid } from "@/features/academies/AcademyGrid";
import { academiesByFoundation, ACADEMIES } from "@/data/academies";
import type { FoundationId } from "@/types/academy";

export const metadata = {
  title: "Academies · LogicLand",
  description:
    "LogicLand's three foundations — Programming, Mathematics and AI — and the academies that branch from them. Learn to build real software, guided by AI.",
};

const FOUNDATION_ICON: Record<FoundationId, LucideIcon> = {
  programming: Code2,
  mathematics: Sigma,
  ai: Brain,
};

export default function AcademiesPage() {
  const groups = academiesByFoundation();
  const liveCount = ACADEMIES.filter((a) => a.status === "live").length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      <header className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">
          <GraduationCap className="h-4 w-4" /> LogicLand Academies
        </span>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Three foundations.
          <br className="hidden sm:block" /> One path to real engineering.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg opacity-75">
          LogicLand is a programming platform first. Everything is built on three
          foundations — <strong>Programming</strong>, <strong>Mathematics</strong>{" "}
          and <strong>AI</strong> — and every other subject branches from them,
          taking you from your first instruction to building real software.
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-meadow/10 px-3 py-1 text-sm font-semibold text-meadow">
          <Sparkles className="h-4 w-4" />
          {liveCount} academies live now · more arriving on the roadmap
        </p>
      </header>

      <div className="space-y-12">
        {groups.map(({ foundation, academies }) => {
          const Icon = FOUNDATION_ICON[foundation.id];
          return (
            <section key={foundation.id} aria-labelledby={`foundation-${foundation.id}`}>
              <div className="mb-5 flex items-start gap-3">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${foundation.gradient} text-white shadow-md`}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2
                    id={`foundation-${foundation.id}`}
                    className="font-display text-xl font-extrabold sm:text-2xl"
                  >
                    {foundation.name}
                  </h2>
                  <p className="text-sm opacity-70">{foundation.description}</p>
                </div>
              </div>
              <AcademyGrid academies={academies} />
            </section>
          );
        })}
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-sm opacity-60">
        Roadmap academies are shown so the vision is transparent — each unlocks as
        it&apos;s built, never as an empty promise. Start with the Coding Academy
        today; Math Fix™ leads what&apos;s next.
      </p>
    </main>
  );
}
