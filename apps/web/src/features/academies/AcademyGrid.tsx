"use client";
// The Academies hub grid — LogicLand v2.0's front door. Renders the whole
// ecosystem honestly: live academies you can enter now, and the roadmap clearly
// badged "In development" so the vision is visible without faking a single
// feature. Icons are resolved here from the catalog's string keys so the data
// stays React-free.
import { Card } from "@logicland/ui";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  Brain,
  Clapperboard,
  Code2,
  Cpu,
  FlaskConical,
  Keyboard,
  Palette,
  Rocket,
  Sigma,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { Academy } from "@/types/academy";

const ACADEMY_ICON: Record<string, LucideIcon> = {
  code: Code2,
  sigma: Sigma,
  trophy: Trophy,
  flask: FlaskConical,
  bot: Bot,
  cpu: Cpu,
  brain: Brain,
  palette: Palette,
  clapperboard: Clapperboard,
  rocket: Rocket,
  keyboard: Keyboard,
};

export function AcademyGrid({ academies }: { academies: Academy[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {academies.map((a, i) => (
        <AcademyCard key={a.slug} academy={a} index={i} />
      ))}
    </div>
  );
}

function AcademyCard({ academy, index }: { academy: Academy; index: number }) {
  const Icon = ACADEMY_ICON[academy.icon] ?? Sparkles;
  const live = academy.status === "live";

  const inner = (
    <Card
      className={`flex h-full flex-col ${
        academy.flagship ? "ring-2 ring-rose-400/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${academy.gradient} text-white shadow-md`}
          aria-hidden
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display text-lg font-extrabold leading-tight">
              {academy.name}
            </h3>
            {academy.flagship && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                <Star className="h-2.5 w-2.5 fill-current" /> Flagship
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-brand">{academy.tagline}</p>
        </div>
      </div>

      <p className="mt-3 text-sm opacity-75">{academy.description}</p>

      <ul className="mt-3 space-y-1.5 text-sm">
        {academy.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand/70" aria-hidden />
            <span className="opacity-80">{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {academy.ageBands.map((b) => (
          <span
            key={b}
            className="rounded-full bg-black/5 px-2 py-0.5 text-[0.7rem] font-semibold opacity-70 dark:bg-white/10"
          >
            {b}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
        <span className="text-xs font-semibold opacity-55">
          {academy.plannedTracks} tracks planned
        </span>
        {live ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-sm font-bold text-white">
            Enter <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-bold opacity-60 dark:bg-white/10">
            In development
          </span>
        )}
      </div>
    </Card>
  );

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={live ? { scale: 1.015 } : undefined}
      className="h-full"
    >
      {inner}
    </motion.div>
  );

  if (live && academy.href) {
    return (
      <Link
        href={academy.href}
        className="block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        aria-label={`Enter ${academy.name}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      aria-disabled
      title={`${academy.name} is in development`}
      className={live ? "" : "cursor-not-allowed opacity-95"}
    >
      {body}
    </div>
  );
}
