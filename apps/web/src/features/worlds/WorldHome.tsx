"use client";
// A World's home — the mission trail. Themed banner, the explorer's progress in
// this realm, and the ordered list of missions. Live missions launch the game;
// "soon" ones stay visible to show the road ahead.
import { Card, RoboAvatar, Skeleton } from "@logicland/ui";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { LandWorld } from "@/types/world";
import { useStudent } from "@/lib/student-store";
import { MissionCard } from "./MissionCard";
import { worldSkin } from "./theme";

export function WorldHome({ world }: { world: LandWorld }) {
  const { state, ready } = useStudent();
  const skin = worldSkin(world.theme);

  const missions = [...world.missions].sort((a, b) => a.order - b.order);
  const done = new Set(state.completedMissions);
  const playable = missions.filter((m) => m.status === "live");
  const completedCount = playable.filter((m) => done.has(m.slug)).length;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link
        href="/worlds"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> World Map
      </Link>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br ${skin.gradient} p-6 text-white shadow-lg`}
      >
        <div className="flex items-center gap-4">
          <span className="text-6xl drop-shadow" aria-hidden>
            {skin.emblem}
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold">{world.title}</h1>
            <p className="opacity-90">{world.subtitle}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-sm font-semibold">
            <span>Your progress</span>
            <span>
              {ready ? completedCount : 0}/{playable.length} missions
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{
                width: `${
                  playable.length ? ((ready ? completedCount : 0) / playable.length) * 100 : 0
                }%`,
              }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Mission trail */}
      <div className="space-y-3">
        {missions.map((m, i) => (
          <MissionCard
            key={m.slug}
            mission={m}
            worldSlug={world.slug}
            skin={skin}
            completed={ready && done.has(m.slug)}
            index={i}
          />
        ))}
      </div>

      {/* Word Wall — learn the world's coding words */}
      <Link href={`/worlds/${world.slug}/vocabulary`} className="mt-6 block">
        <Card className="flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${skin.wash}`}>
            📚
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">Word Wall</h3>
            <p className="text-sm opacity-70">
              Learn the coding words of {world.title} — with pictures and voice.
            </p>
          </div>
          <span className="text-2xl">🔊</span>
        </Card>
      </Link>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-black/5 p-4 dark:bg-white/5">
        <RoboAvatar mood="idle" size={44} />
        <p className="text-sm opacity-80">
          Finish every mission to earn all of {world.title}&apos;s badges!
        </p>
      </div>
    </main>
  );
}

/** Skeleton mirror for a World home, used by the route's loading.tsx. */
export function WorldHomeSkeleton() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Skeleton className="mb-4 h-5 w-28" />
      <Skeleton className="mb-6 h-40 rounded-3xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
    </main>
  );
}
