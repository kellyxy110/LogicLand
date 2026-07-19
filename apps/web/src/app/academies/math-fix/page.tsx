// Math Fix™ — the Mathematics Academy's first live topic. A thin Server Component
// shell around the client practice experience. One topic is live today (Solving
// Linear Equations); the surrounding copy is honest that more are on the way.
import { ArrowLeft, Sigma } from "lucide-react";
import Link from "next/link";
import { MathFixTopic } from "@/features/math-fix/MathFixTopic";

export const metadata = {
  title: "Math Fix™ · Solving Linear Equations · LogicLand",
  description:
    "Math Fix diagnoses the exact misconception behind a wrong answer, repairs the idea, and adapts practice to mastery — starting with solving linear equations.",
};

export default function MathFixPage() {
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
          <p className="text-sm font-semibold text-brand">Solving Linear Equations</p>
        </div>
      </div>

      <p className="mb-6 rounded-2xl bg-brand/5 p-4 text-sm opacity-80">
        This isn&apos;t just marking. When an answer is wrong, Math Fix works out the
        exact idea that slipped, explains it kindly, and adjusts the next question
        to help you master it. <span className="font-semibold">Solving Linear
        Equations</span> is live now — more topics are on the way.
      </p>

      <MathFixTopic />
    </main>
  );
}
