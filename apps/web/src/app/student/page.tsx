"use client";
// The explorer's launchpad — LogicLand's warm front door. Greets the child by
// name, shows their treasure (XP, coins, stars, badges), and points them at the
// very next adventure. Content comes from the engine catalog (worlds) + the
// server-persisted student state; nothing is faked client-side.
import {
  Button,
  Card,
  RoboAvatar,
  Skeleton,
  StreakFlame,
  XpMeter,
} from "@logicland/ui";
import { motion } from "framer-motion";
import { Award, Coins, Compass, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiHelper } from "@/components/AiHelper";
import { worldSkin } from "@/features/worlds/theme";
import { getWorlds } from "@/lib/worlds";
import { useStudent } from "@/lib/student-store";
import type { LandWorld } from "@/types/world";

export default function StudentHome() {
  const { state, ready } = useStudent();
  const [worlds, setWorlds] = useState<LandWorld[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    getWorlds().then(setWorlds);
  }, []);

  if (!ready || worlds === null) return <StudentHomeSkeleton />;

  // The next adventure: the first live, not-yet-completed mission across the
  // unlocked worlds (ordered). Falls back to "all done" celebration.
  const done = new Set(state.completedMissions);
  const open = [...worlds]
    .filter((w) => !w.locked)
    .sort((a, b) => a.order - b.order);
  let nextWorld: LandWorld | undefined;
  let nextMissionSlug: string | undefined;
  let nextMissionTitle: string | undefined;
  let nextSkill: string | undefined;
  for (const w of open) {
    const m = [...w.missions]
      .sort((a, b) => a.order - b.order)
      .find((mm) => mm.status === "live" && !done.has(mm.slug));
    if (m) {
      nextWorld = w;
      nextMissionSlug = m.slug;
      nextMissionTitle = m.title;
      nextSkill = m.skill;
      break;
    }
  }
  const skin = worldSkin(nextWorld?.theme ?? "forest");
  const levelProgress = (state.xp % 250) / 250;

  return (
    <main className="relative mx-auto max-w-3xl overflow-hidden px-5 py-8">
      <ForestBackdrop />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 flex items-center gap-4"
      >
        <RoboAvatar mood="happy" size={72} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            Welcome, {state.name}! 👋
          </h1>
          <p className="opacity-70">Ready for today&apos;s adventure?</p>
        </div>
        <StreakFlame days={state.dailyStreak} />
      </motion.header>

      {/* Treasure chest: XP / coins / stars / badges */}
      <Card className="relative mb-6">
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

      {/* Today's adventure */}
      {nextMissionSlug && nextWorld ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br ${skin.gradient} p-6 text-white shadow-lg`}
        >
          <span className="text-sm font-bold uppercase tracking-wide opacity-90">
            Today&apos;s Mission
          </span>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-4xl" aria-hidden>
              {skin.emblem}
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold">{nextMissionTitle}</p>
              <p className="opacity-90">
                {nextWorld.title} · {nextSkill}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-5 bg-white text-brand hover:bg-white"
            onClick={() => router.push(`/play/${nextWorld.slug}/${nextMissionSlug}`)}
          >
            Continue Adventure →
          </Button>
        </motion.div>
      ) : (
        <Card className="relative mb-6 text-center">
          <RoboAvatar mood="happy" size={72} className="mx-auto" />
          <h2 className="mt-2 font-display text-2xl font-bold">You did it! 🎉</h2>
          <p className="mt-1 opacity-80">
            You&apos;ve cleared every open mission. New worlds are on the way!
          </p>
        </Card>
      )}

      {/* Explore all worlds */}
      <Link href="/worlds" className="relative block">
        <Card className="flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Compass className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">Explore the World Map</h3>
            <p className="text-sm opacity-70">
              Six magical worlds are waiting to be discovered.
            </p>
          </div>
          <span className="text-2xl">🗺️</span>
        </Card>
      </Link>

      <AiHelper missionSlug={nextMissionSlug} />
    </main>
  );
}

/** Gentle, decorative forest — a few drifting leaves/trees behind the content.
 *  Purely aesthetic (aria-hidden) and transform-only so it stays smooth. */
function ForestBackdrop() {
  const bits = ["🌲", "🍃", "⭐", "🌿", "✨", "🌲"];
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl opacity-20"
          style={{ left: `${(i * 17 + 5) % 90}%`, top: `${(i * 23 + 8) % 80}%` }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 5 + i,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        >
          {b}
        </motion.span>
      ))}
    </div>
  );
}

function StudentHomeSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Skeleton className="mb-6 h-20" />
      <Skeleton className="mb-6 h-28" />
      <Skeleton className="mb-6 h-40 rounded-3xl" />
      <Skeleton className="h-20 rounded-3xl" />
    </main>
  );
}
