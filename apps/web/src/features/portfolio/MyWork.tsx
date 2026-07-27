"use client";
// "My Work" — the learner's private in-app portfolio: what they've built (their
// Studio project, with a live preview) and what they've mastered (skills earned
// from real evidence + their treasure). Private by design: it lives under the
// Clerk-gated /student area and has no public URL. A *public*, shareable version
// would need explicit parent/teacher consent and PII scrubbing first — deferred.
import { Card, RoboAvatar } from "@logicland/ui";
import { Award, Code2, Coins, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStudent } from "@/lib/student-store";
import { getMyMathMastery } from "@/app/actions/math-fix";
import { loadMyStudioProject } from "@/app/actions/studio";
import { detectCodeSkills } from "@/lib/engines/code-skills";
import { buildRunnableDoc } from "@/lib/engines/studio-project";
import { SKILLS, mathEvidenceKey } from "@/data/skills";
import { masteredIdsFromEvidence } from "@/lib/engines/skill-graph";
import type { FsNode } from "@/types/studio";

interface Studio {
  name: string;
  files: { name: string; content: string }[];
}

export function MyWork() {
  const { state, ready } = useStudent();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [achieved, setAchieved] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let alive = true;
    Promise.all([getMyMathMastery(), loadMyStudioProject()])
      .then(([rows, load]) => {
        if (!alive) return;
        const keys = new Set<string>();
        for (const r of rows) if (r.mastered) keys.add(mathEvidenceKey(r.topicId));
        if (load.project) {
          setStudio(load.project);
          for (const k of detectCodeSkills(load.project.files)) keys.add(k);
        }
        setAchieved(keys);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const masteredSkills = useMemo(() => {
    const ids = masteredIdsFromEvidence(SKILLS, achieved);
    return SKILLS.filter((s) => ids.has(s.id));
  }, [achieved]);

  const previewDoc = useMemo(() => {
    if (!studio) return null;
    const nodes: FsNode[] = studio.files.map((f) => ({
      id: f.name,
      name: f.name,
      kind: "file",
      parentId: null,
      content: f.content,
    }));
    return buildRunnableDoc(nodes);
  }, [studio]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6 flex items-center gap-4">
        <RoboAvatar mood="happy" size={64} />
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            {ready ? `${state.name}'s work` : "My work"}
          </h1>
          <p className="opacity-70">Everything you&apos;ve built and mastered, in one place.</p>
        </div>
      </header>

      {/* Treasure */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
          <span className="flex items-center gap-1.5 text-brand">
            <Sparkles className="h-4 w-4" /> Level {state.level}
          </span>
          <span className="flex items-center gap-1.5 text-sunburst">
            <Star className="h-4 w-4 fill-sunburst" /> {state.stars} stars
          </span>
          <span className="flex items-center gap-1.5 text-sunburst">
            <Coins className="h-4 w-4" /> {state.coins} coins
          </span>
          <Link
            href="/student/achievements"
            className="flex items-center gap-1.5 text-brand hover:underline"
          >
            <Award className="h-4 w-4" /> {state.badges.length} badges
          </Link>
        </div>
      </Card>

      {/* The build */}
      <h2 className="mb-2 font-display text-lg font-bold">What I&apos;m building</h2>
      {studio ? (
        <Card className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold">
              <Code2 className="h-4 w-4 text-brand" /> {studio.name}
              <span className="opacity-55">· {studio.files.length} files</span>
            </span>
            <Link
              href="/studio"
              className="rounded-full bg-brand px-3 py-1 text-sm font-bold text-white hover:opacity-90"
            >
              Open in Studio
            </Link>
          </div>
          {previewDoc ? (
            <iframe
              title="My project preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={previewDoc}
              className="h-56 w-full rounded-xl border border-black/10 bg-white dark:border-white/10"
            />
          ) : (
            <p className="text-sm opacity-60">
              Add an <b className="font-mono">index.html</b> in Studio to see your page here.
            </p>
          )}
        </Card>
      ) : (
        <Link href="/studio" className="mb-6 block">
          <Card className="flex items-center gap-4 transition-transform hover:scale-[1.01]">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold">Start building in Studio</h3>
              <p className="text-sm opacity-70">Your first project will show up here.</p>
            </div>
          </Card>
        </Link>
      )}

      {/* Skills mastered */}
      <h2 className="mb-2 font-display text-lg font-bold">Skills I&apos;ve mastered</h2>
      <Card>
        {masteredSkills.length === 0 ? (
          <p className="text-sm opacity-60">
            None yet — master a Math Fix topic or build something in Studio and your skills light
            up here. See the{" "}
            <Link href="/skills" className="font-semibold text-brand hover:underline">
              skill map
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {masteredSkills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-meadow/10 px-3 py-1 text-sm font-semibold text-meadow"
              >
                <Sparkles className="h-3.5 w-3.5" /> {s.name}
              </span>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
