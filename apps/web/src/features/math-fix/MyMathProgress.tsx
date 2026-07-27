"use client";
// The learner's own Math Fix progress on their home launchpad. Parents and
// teachers already see mastery on their dashboards; this closes the loop by
// showing the *child* how far they've climbed — the pull back into practice.
// Self-fetches via the same server action the practice screen writes to.
import { Card } from "@logicland/ui";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sigma, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MathMasteryView } from "@logicland/database";
import { getMyMathMastery } from "@/app/actions/math-fix";
import { mathTopicById } from "@/lib/engines/math-fix";

export function MyMathProgress() {
  const [rows, setRows] = useState<MathMasteryView[] | null>(null);

  useEffect(() => {
    let alive = true;
    getMyMathMastery()
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  // While loading, render nothing (keeps the launchpad calm). Empty → a gentle
  // invite to try Math Fix rather than an empty panel.
  if (rows === null) return null;

  if (rows.length === 0) {
    return (
      <Link href="/academies/math-fix" className="relative mt-6 block">
        <Card className="flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white">
            <Sigma className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">Try Math Fix™</h3>
            <p className="text-sm opacity-70">
              Practice that finds exactly what tripped you up — and helps you fix it.
            </p>
          </div>
          <ArrowRight className="h-6 w-6 shrink-0 text-brand" aria-hidden />
        </Card>
      </Link>
    );
  }

  const masteredCount = rows.filter((r) => r.mastered).length;

  return (
    <section className="relative mt-6">
      <div className="mb-2 flex items-center gap-2">
        <Sigma className="h-5 w-5 text-rose-500" aria-hidden />
        <h3 className="font-display text-lg font-bold">My Math Fix progress</h3>
        {masteredCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            <Trophy className="h-3 w-3 fill-current" /> {masteredCount} mastered
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {rows.map((r, i) => {
          const topic = mathTopicById(r.topicId);
          const name = topic?.name ?? r.topicId;
          const maxTier = topic?.maxDifficulty ?? 6;
          const pct = r.mastered
            ? 100
            : Math.round((Math.min(r.difficulty, maxTier) / maxTier) * 100);
          return (
            <motion.div
              key={r.topicId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Link
                href={`/academies/math-fix/${r.topicId}`}
                className="block rounded-2xl border-2 border-brand/10 p-3.5 transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
                  {r.mastered ? (
                    <span className="shrink-0 text-xs font-bold text-amber-600 dark:text-amber-300">
                      Mastered!
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold opacity-60">
                      Level {r.difficulty} / {maxTier}
                    </span>
                  )}
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs font-semibold opacity-70">
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" aria-hidden /> {r.accuracy}% right
                  </span>
                  {r.bestStreak > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" aria-hidden /> best streak {r.bestStreak}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
