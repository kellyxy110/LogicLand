"use client";
// The celebration. Shown when a mission is completed — the emotional payoff that
// makes learning feel like winning. Reads the server-computed reward (never
// invented client-side) and shows exactly what was earned.
import { BadgeChip, Button, RewardBurst, RoboAvatar } from "@logicland/ui";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MissionReward } from "@/lib/engine";

interface RewardModalProps {
  reward: MissionReward;
  /** Badge for this mission (from the catalog), for a guaranteed display. */
  badge: string;
  starsCollected: number;
  worldSlug: string;
  worldTitle: string;
  /** The next playable mission in this world, for a forward "keep going" flow. */
  nextMission: { slug: string; title: string } | null;
  /** Replay the same mission (resets the game). */
  onReplay: () => void;
}

export function RewardModal({
  reward,
  badge,
  starsCollected,
  worldSlug,
  worldTitle,
  nextMission,
  onReplay,
}: RewardModalProps) {
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBurst(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const badgeName = reward.badges[0]?.name ?? badge;

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Mission complete"
    >
      <RewardBurst show={burst} />
      <motion.div
        initial={{ scale: 0.8, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
        className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl dark:bg-slate-800"
      >
        <RoboAvatar mood="happy" size={104} className="mx-auto" />
        <h2 className="mt-3 font-display text-3xl font-extrabold">Mission Complete!</h2>
        <p className="mt-1 opacity-70">You&apos;re a true Logic Forest explorer.</p>

        <div className="my-6 flex justify-center gap-5 font-display text-xl font-bold">
          <span className="text-brand">+{reward.xp_awarded} XP</span>
          <span className="text-sunburst">+{reward.stars_awarded} ⭐</span>
          <span className="text-sunburst">+{reward.coins_awarded} 🪙</span>
        </div>

        {starsCollected > 0 && (
          <p className="-mt-3 mb-4 text-sm font-semibold opacity-70">
            You grabbed {starsCollected} bonus star{starsCollected > 1 ? "s" : ""} on the way! ✨
          </p>
        )}

        <div className="mx-auto mb-6 w-40">
          <BadgeChip name={badgeName} />
          <p className="mt-1 text-xs font-semibold opacity-60">New badge earned!</p>
        </div>

        {nextMission ? (
          <p className="mb-3 text-sm font-semibold opacity-70">
            Next up: <span className="text-brand">{nextMission.title}</span>
          </p>
        ) : (
          <p className="mb-3 text-sm font-semibold opacity-70">
            You&apos;ve cleared every mission in {worldTitle}! 🌟
          </p>
        )}

        <div className="flex flex-col gap-2">
          {nextMission ? (
            <Link href={`/play/${worldSlug}/${nextMission.slug}`}>
              <Button size="lg" className="w-full">
                Next Mission: {nextMission.title} →
              </Button>
            </Link>
          ) : (
            <Link href={`/worlds/${worldSlug}`}>
              <Button size="lg" className="w-full">
                Back to {worldTitle} →
              </Button>
            </Link>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onReplay}>
              Play Again
            </Button>
            {nextMission && (
              <Link href={`/worlds/${worldSlug}`} className="flex-1">
                <Button variant="ghost" className="w-full">
                  World Map
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
