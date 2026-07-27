"use client";
// The learner's skill map (ADR-011/017) — the concept dependency graph under the
// three foundations, with each skill lit up by real evidence. Today the evidence
// source is mastered Math Fix topics; as missions, Studio projects and quizzes
// learn to report evidence, more skills light up with no change here.
import { Card } from "@logicland/ui";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, Circle, Code2, Lock, Sigma } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FOUNDATIONS } from "@/data/academies";
import { SKILLS, mathEvidenceKey } from "@/data/skills";
import type { FoundationId } from "@/types/academy";
import {
  masteredIdsFromEvidence,
  skillDepth,
  skillStatus,
  type Skill,
  type SkillStatus,
} from "@/lib/engines/skill-graph";
import { getMyMathMastery } from "@/app/actions/math-fix";
import { loadMyStudioProject } from "@/app/actions/studio";
import { detectCodeSkills } from "@/lib/engines/code-skills";

const FOUNDATION_ICON: Record<FoundationId, LucideIcon> = {
  programming: Code2,
  mathematics: Sigma,
  ai: Brain,
};

export function SkillMap() {
  const [achieved, setAchieved] = useState<ReadonlySet<string> | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getMyMathMastery(), loadMyStudioProject()])
      .then(([rows, studio]) => {
        if (!alive) return;
        const keys = new Set<string>();
        // Maths skills: mastered Math Fix topics.
        for (const r of rows) if (r.mastered) keys.add(mathEvidenceKey(r.topicId));
        // Programming skills: concepts the learner's Studio code actually uses.
        if (studio.project) {
          for (const k of detectCodeSkills(studio.project.files)) keys.add(k);
        }
        setAchieved(keys);
      })
      .catch(() => alive && setAchieved(new Set()));
    return () => {
      alive = false;
    };
  }, []);

  const masteredIds = useMemo(
    () => masteredIdsFromEvidence(SKILLS, achieved ?? new Set()),
    [achieved],
  );

  const masteredCount = masteredIds.size;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your skill map
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg opacity-75">
          Every concept sits on the ones before it. You earn a skill by showing it
          — mastering practice, building projects — not by watching a video.
        </p>
        {achieved !== null && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-meadow/10 px-3 py-1 text-sm font-semibold text-meadow">
            <CheckCircle2 className="h-4 w-4" />
            {masteredCount} {masteredCount === 1 ? "skill" : "skills"} mastered so far
          </p>
        )}
      </header>

      <div className="space-y-10">
        {FOUNDATIONS.map((f) => {
          const Icon = FOUNDATION_ICON[f.id];
          const skills = SKILLS.filter((s) => s.foundation === f.id).sort(
            (a, b) => skillDepth(SKILLS, a.id) - skillDepth(SKILLS, b.id),
          );
          return (
            <section key={f.id} aria-labelledby={`skills-${f.id}`}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 id={`skills-${f.id}`} className="font-display text-xl font-extrabold">
                  {f.name}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((s, i) => (
                  <SkillCard
                    key={s.id}
                    skill={s}
                    status={skillStatus(s, masteredIds)}
                    index={i}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm opacity-55">
        Skills light up from real evidence — mastered Math Fix™ topics and the
        concepts your Studio code actually uses. Build something in Studio and
        watch more of the map come alive.
      </p>
    </main>
  );
}

const STATUS_META: Record<
  SkillStatus,
  { icon: LucideIcon; label: string; className: string }
> = {
  mastered: {
    icon: CheckCircle2,
    label: "Mastered",
    className: "border-meadow/40 bg-meadow/5",
  },
  unlocked: {
    icon: Circle,
    label: "Ready to learn",
    className: "border-brand/30",
  },
  locked: {
    icon: Lock,
    label: "Locked",
    className: "border-black/10 opacity-70 dark:border-white/10",
  },
};

function mathTopicHref(skill: Skill): string | null {
  const key = skill.evidence?.find((e) => e.startsWith("math:"));
  return key ? `/academies/math-fix/${key.slice("math:".length)}` : null;
}

function SkillCard({
  skill,
  status,
  index,
}: {
  skill: Skill;
  status: SkillStatus;
  index: number;
}) {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const href = status !== "locked" ? mathTopicHref(skill) : null;

  const inner = (
    <Card className={`h-full border-2 ${meta.className}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-bold leading-tight">{skill.name}</h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 text-[0.7rem] font-bold ${
            status === "mastered"
              ? "text-meadow"
              : status === "unlocked"
                ? "text-brand"
                : "opacity-55"
          }`}
        >
          <StatusIcon className="h-3.5 w-3.5" /> {meta.label}
        </span>
      </div>
      <p className="mt-1 text-sm opacity-70">{skill.blurb}</p>
    </Card>
  );

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="h-full"
    >
      {inner}
    </motion.div>
  );

  return href ? (
    <Link
      href={href}
      className="block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
    >
      {body}
    </Link>
  ) : (
    body
  );
}
