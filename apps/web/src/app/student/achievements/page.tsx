"use client";
// Achievements wall — the child's pride board of earned badges.
import { BadgeChip, Card, CardTitle, RoboAvatar, Skeleton } from "@logicland/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { engine, type Journey } from "@/lib/engine";
import { useStudent } from "@/lib/student-store";

export default function Achievements() {
  const { state, ready } = useStudent();
  const [journey, setJourney] = useState<Journey | null>(null);

  useEffect(() => {
    engine.getJourney().then(setJourney).catch(() => setJourney(null));
  }, []);

  if (!ready || !journey) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </main>
    );
  }

  // Every mission badge in the journey, marked earned if the child has it.
  const allBadges = journey.worlds.flatMap((w) => w.missions.map((m) => m.badge));
  const earned = new Set(state.badges);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center gap-4">
        <RoboAvatar mood="happy" size={56} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold">My Achievements</h1>
          <p className="opacity-70">
            {earned.size} of {allBadges.length} badges earned
          </p>
        </div>
        <Link href="/student" className="text-sm text-brand hover:underline">
          ← Home
        </Link>
      </div>

      <Card>
        <CardTitle className="mb-4">Badge Collection</CardTitle>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {allBadges.map((name) => (
            <BadgeChip key={name} name={name} earned={earned.has(name)} />
          ))}
        </div>
      </Card>
    </main>
  );
}
