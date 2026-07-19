// The Academies hub — LogicLand v2.0's top-level map of the ecosystem. A Server
// Component: the catalog is plain data, rendered through a client grid for the
// entrance animations. Live academies (today: Coding) are enterable; the rest of
// the vision is shown honestly as "in development".
import { GraduationCap, Sparkles } from "lucide-react";
import { AcademyGrid } from "@/features/academies/AcademyGrid";
import { sortedAcademies } from "@/data/academies";

export const metadata = {
  title: "Academies · LogicLand",
  description:
    "The LogicLand ecosystem — Coding, Mathematics (Math Fix), Olympiad, Science, Robotics, AI and more. Learn through play, guided by AI.",
};

export default function AcademiesPage() {
  const academies = sortedAcademies();
  const liveCount = academies.filter((a) => a.status === "live").length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">
          <GraduationCap className="h-4 w-4" /> LogicLand Academies
        </span>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          One ecosystem.
          <br className="hidden sm:block" /> A lifetime of learning.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg opacity-75">
          LogicLand is growing from a coding classroom into a full AI-powered
          learning ecosystem. Every academy teaches through play, projects and an
          intelligent tutor that adapts to how you think.
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-meadow/10 px-3 py-1 text-sm font-semibold text-meadow">
          <Sparkles className="h-4 w-4" />
          {liveCount} academy live now · more arriving on the roadmap
        </p>
      </header>

      <AcademyGrid academies={academies} />

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm opacity-60">
        Roadmap academies are shown so the vision is transparent — each unlocks as
        it&apos;s built, never as an empty promise. Start with the Coding Academy
        today; Math Fix™ leads what&apos;s next.
      </p>
    </main>
  );
}
