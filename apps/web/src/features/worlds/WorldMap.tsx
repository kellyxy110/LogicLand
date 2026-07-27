"use client";
// The World Map: LogicLand's home galaxy. Six realms, only the first open. The
// server hands us the catalog (source of truth for lock state + missions); we
// layer the signed-in explorer's progress on top. If the engine is unreachable
// the server passes [] and we show a warm retry, never a blank crash.
import { Button, RoboAvatar, Skeleton } from "@logicland/ui";
import { motion } from "framer-motion";
import { ArrowRight, Code2 } from "lucide-react";
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
            Welcome, {ready ? state.name : "Explorer"}!
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

      <StudioInvite />
    </main>
  );
}

/** Bridge from the Coding Academy's guided worlds to free building in Studio —
 *  the "now make your own" step (ADR-011: Academy teaches, Studio builds). */
function StudioInvite() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8"
    >
      <Link
        href="/studio"
        className="group flex items-center gap-4 rounded-3xl border-2 border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-violet-600/5 p-5 transition-colors hover:border-indigo-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
      >
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
          <Code2 className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold">
            Ready to build your own?
          </h2>
          <p className="text-sm opacity-70">
            Open <b>LogicLand Studio</b> — a real code editor where you can make
            anything and run it.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white">
          Open Studio
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
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
