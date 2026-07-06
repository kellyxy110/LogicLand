"use client";
// Student home — the launchpad. Robo greeting, XP/level, streak, and the
// adventure map. Reads demo student state + the journey from the engine.
import {
  Button,
  Card,
  CardTitle,
  MissionMap,
  RoboAvatar,
  Skeleton,
  StreakFlame,
  XpMeter,
  type MissionNode,
} from "@logicland/ui";
import { Award, Coins, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiHelper } from "@/components/AiHelper";
import { engine, type Journey } from "@/lib/engine";
import { useStudent } from "@/lib/student-store";

export default function StudentHome() {
  const { state, ready } = useStudent();
  const [journey, setJourney] = useState<Journey | null>(null);
  const router = useRouter();

  useEffect(() => {
    engine.getJourney().then(setJourney).catch(() => setJourney(null));
  }, []);

  if (!ready || !journey) return <StudentHomeSkeleton />;

  const missions = journey.worlds.flatMap((w) => w.missions);
  const firstIncomplete = missions.find(
    (m) => !state.completedMissions.includes(m.slug),
  );
  const nodes: MissionNode[] = missions.map((m) => {
    const done = state.completedMissions.includes(m.slug);
    const current = m.slug === firstIncomplete?.slug;
    return {
      slug: m.slug,
      title: m.title,
      skill: m.skill,
      state: done ? "done" : current ? "current" : "locked",
    };
  });
  const levelProgress = (state.xp % 250) / 250;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6 flex items-center gap-4">
        <RoboAvatar mood="happy" size={72} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold">
            Hi {state.name}! 👋
          </h1>
          <p className="opacity-70">Ready for today&apos;s adventure?</p>
        </div>
        <StreakFlame days={state.dailyStreak} />
      </header>

      <Card className="mb-6">
        <XpMeter level={state.level} progress={levelProgress} />
        <div className="mt-4 flex items-center gap-6 text-sm font-semibold">
          <span className="flex items-center gap-1.5 text-sunburst">
            <Star className="h-4 w-4 fill-sunburst" /> {state.stars} stars
          </span>
          <span className="flex items-center gap-1.5 text-sunburst">
            <Coins className="h-4 w-4" /> {state.coins} coins
          </span>
          <Link
            href="/student/achievements"
            className="ml-auto flex items-center gap-1.5 text-brand hover:underline"
          >
            <Award className="h-4 w-4" /> {state.badges.length} badges
          </Link>
        </div>
      </Card>

      {firstIncomplete ? (
        <Card className="mb-6 bg-gradient-to-br from-brand to-brand-soft text-white">
          <CardTitle className="text-white">Today&apos;s Adventure</CardTitle>
          <p className="mt-1 text-lg font-semibold">{firstIncomplete.title}</p>
          <p className="opacity-90">Skill: {firstIncomplete.skill}</p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-4 bg-white text-brand"
            onClick={() => router.push(`/student/mission/${firstIncomplete.slug}`)}
          >
            Start Mission →
          </Button>
        </Card>
      ) : (
        <Card className="mb-6 text-center">
          <CardTitle>You did it! 🎉</CardTitle>
          <p className="mt-1 opacity-80">
            You&apos;ve completed every mission. You&apos;re a LogicLand Graduate!
          </p>
        </Card>
      )}

      <h2 className="mb-3 font-display text-xl font-bold">Your Adventure Map</h2>
      <MissionMap
        nodes={nodes}
        onSelect={(slug) => router.push(`/student/mission/${slug}`)}
      />

      <AiHelper missionSlug={firstIncomplete?.slug} />
    </main>
  );
}

function StudentHomeSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Skeleton className="mb-6 h-20" />
      <Skeleton className="mb-6 h-28" />
      <Skeleton className="mb-6 h-40" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </main>
  );
}
