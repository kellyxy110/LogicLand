// Math Fix™ — the Mathematics Academy hub. Lists the live topics; each opens its
// own adaptive practice session. Deterministic misconception diagnosis is the
// through-line: every topic names *why* an answer is wrong, then repairs it.
import { ArrowLeft, ArrowRight, Sigma } from "lucide-react";
import Link from "next/link";
import { MATH_TOPICS } from "@/lib/engines/math-fix";

export const metadata = {
  title: "Math Fix™ · LogicLand",
  description:
    "Math Fix diagnoses the exact misconception behind a wrong answer, repairs the idea, and adapts practice to mastery. Pick a topic to begin.",
};

export default function MathFixHome() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-5">
        <Link
          href="/academies"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Academies
        </Link>
      </header>

      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md">
          <Sigma className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Math Fix™</h1>
          <p className="text-sm font-semibold text-brand">
            Repairs misconceptions, not just marks answers.
          </p>
        </div>
      </div>

      <p className="mb-6 rounded-2xl bg-brand/5 p-4 text-sm opacity-80">
        Pick a topic. When an answer is wrong, Math Fix works out the exact idea
        that slipped, explains it kindly, and adapts the next question so you truly
        master it. More topics are on the way.
      </p>

      <div className="space-y-3">
        {MATH_TOPICS.map((t) => (
          <Link
            key={t.id}
            href={`/academies/math-fix/${t.id}`}
            className="group flex items-center gap-4 rounded-3xl border-2 border-brand/10 p-4 transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 font-mono text-lg font-extrabold text-rose-600 dark:text-rose-300">
              {t.id === "order-of-operations" ? "×+" : "x"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold">{t.name}</h2>
              <p className="text-sm opacity-70">{t.blurb}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </main>
  );
}
