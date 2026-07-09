"use client";
// A single World on the map. Unlocked worlds are vivid and tappable; locked
// worlds stay visible (so the journey ahead feels real) but wear a padlock and
// a teaser instead of a fake entrance. Never a dead button.
import { Card } from "@logicland/ui";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { LandWorld } from "@/types/world";
import { worldSkin } from "./theme";

interface WorldCardProps {
  world: LandWorld;
  /** Live missions the explorer has already finished, for the progress ring. */
  completed: number;
  /** How many missions are playable now (status "live"). */
  playable: number;
  index: number;
}

export function WorldCard({ world, completed, playable, index }: WorldCardProps) {
  const skin = worldSkin(world.theme);
  const total = world.missions.length;
  const pct = playable > 0 ? Math.round((completed / playable) * 100) : 0;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 220, damping: 22 }}
      whileHover={world.locked ? undefined : { y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Card
        className={`relative flex h-full flex-col overflow-hidden border-0 p-0 ${
          world.locked ? "opacity-90" : ""
        }`}
      >
        {/* Themed banner */}
        <div
          className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${skin.gradient}`}
        >
          <span className="text-6xl drop-shadow-lg" aria-hidden>
            {skin.emblem}
          </span>
          {!world.locked && completed >= playable && playable > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-emerald-600 shadow">
              Complete ✓
            </span>
          )}
          {world.locked && (
            <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-1 text-white">
                <Lock className="h-8 w-8" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Locked
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-xl font-extrabold">{world.title}</h3>
          <p className="mt-0.5 text-sm opacity-70">
            {world.locked ? skin.teaser : world.subtitle}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {world.skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className={`rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold dark:bg-white/10 ${skin.accent}`}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4">
            {world.locked ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold opacity-60">
                <Sparkles className="h-4 w-4" /> Coming soon
              </p>
            ) : (
              <>
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold opacity-70">
                  <span>
                    {completed}/{playable} missions
                  </span>
                  <span>{total - playable > 0 ? `+${total - playable} soon` : ""}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${skin.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: index * 0.06 + 0.2, duration: 0.6 }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (world.locked) {
    return (
      <div
        aria-disabled
        title={`${world.title} unlocks as you explore`}
        className="cursor-not-allowed"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/worlds/${world.slug}`}
      className="rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      aria-label={`Enter ${world.title}`}
    >
      {inner}
    </Link>
  );
}
