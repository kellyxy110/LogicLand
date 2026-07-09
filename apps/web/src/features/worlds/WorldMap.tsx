"use client";
// The World Map: LogicLand's home galaxy. Six realms, only the first open. The
// server hands us the catalog (source of truth for lock state + missions); we
// layer the signed-in explorer's progress on top. If the engine is unreachable
// the server passes [] and we show a warm retry, never a blank crash.
import { Button, RoboAvatar, Skeleton } from "@logicland/ui";
import { motion } from "framer-motion";
import Link from "next/link";
import type { LandWorld } from "@/types/world";
import { useStudent } from "@/lib/student-store";
import { WorldCard } from "./WorldCard";

export function WorldMap({ worlds }: { worlds: LandWorld[] }) {
  const { state, ready } = useStudent();

  if (worlds.length === 0) return <WorldMapEmpty />;

  const done = new Set(state.completedMissions);
  const sorted = [...worlds].sort((a, b) => a.order - b.order);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <RoboAvatar mood="happy" size={64} />
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Welcome, {ready ? state.name : "Explorer"}! 🌟
          </h1>
          <p className="opacity-70">Pick a world and begin your adventure.</p>
        </div>
      </motion.header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((world, i) => {
          const playable = world.missions.filter((m) => m.status === "live");
          const completed = playable.filter((m) => done.has(m.slug)).length;
          return (
            <WorldCard
              key={world.slug}
              world={world}
              completed={ready ? completed : 0}
              playable={playable.length}
              index={i}
            />
          );
        })}
      </div>
    </main>
  );
}

function WorldMapEmpty() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-5 text-center">
      <div>
        <RoboAvatar mood="thinking" size={96} className="mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          The map is loading its magic…
        </h1>
        <p className="mt-2 opacity-70">
          Robo can&apos;t reach the worlds right now. Let&apos;s try again in a moment.
        </p>
        <Link href="/worlds">
          <Button className="mt-6">Try again</Button>
        </Link>
      </div>
    </main>
  );
}

/** Skeleton mirror for the map, used by the route's loading.tsx. */
export function WorldMapSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Skeleton className="mb-8 h-16 w-80" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-3xl" />
        ))}
      </div>
    </main>
  );
}
