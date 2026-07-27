"use client";
// The MathLab hub grid. Renders the Mathematics ecosystem honestly: live labs
// you can enter now, roadmap labs badged "In development". Icons resolve from
// the registry's string keys so the data stays React-free.
import { Card } from "@logicland/ui";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Binary,
  Cpu,
  Hash,
  LineChart,
  PenLine,
  ScrollText,
  Shapes,
  Sigma,
  Target,
  Trophy,
  Variable,
} from "lucide-react";
import Link from "next/link";
import { sortedMathLabs, type MathLab } from "@/data/mathlab";

const ICON: Record<string, LucideIcon> = {
  target: Target,
  penline: PenLine,
  scroll: ScrollText,
  variable: Variable,
  shapes: Shapes,
  linechart: LineChart,
  hash: Hash,
  barchart: BarChart3,
  activity: Activity,
  trophy: Trophy,
  binary: Binary,
  cpu: Cpu,
};

export function MathLabGrid() {
  const labs = sortedMathLabs();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {labs.map((lab, i) => (
        <LabCard key={lab.id} lab={lab} index={i} />
      ))}
    </div>
  );
}

function LabCard({ lab, index }: { lab: MathLab; index: number }) {
  const Icon = ICON[lab.icon] ?? Sigma;
  const live = lab.status === "live";

  const inner = (
    <Card className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${lab.gradient} text-white shadow`}
          aria-hidden
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-extrabold leading-tight">{lab.name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-brand">{lab.tagline}</p>
        </div>
      </div>
      <p className="mt-2 flex-1 text-sm opacity-75">{lab.description}</p>
      <div className="mt-3 flex items-center justify-end border-t border-black/5 pt-2 dark:border-white/10">
        {live ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-sm font-bold text-white">
            Enter <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold opacity-60 dark:bg-white/10">
            In development
          </span>
        )}
      </div>
    </Card>
  );

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="h-full"
    >
      {inner}
    </motion.div>
  );

  return live && lab.href ? (
    <Link
      href={lab.href}
      className="block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      aria-label={`Enter ${lab.name}`}
    >
      {body}
    </Link>
  ) : (
    <div aria-disabled title={`${lab.name} is in development`} className="cursor-not-allowed">
      {body}
    </div>
  );
}
