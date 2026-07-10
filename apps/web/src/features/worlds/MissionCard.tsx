"use client";
// One mission on a World's home. Live missions are tappable and show a badge +
// time; completed ones wear a checkmark; "soon" missions are honestly labelled
// (visible on the map, not yet playable) — never a button that does nothing.
import { Card } from "@logicland/ui";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bot,
  Brain,
  Check,
  Clock,
  Code2,
  Keyboard,
  Lock,
  Palette,
  Play,
  Shapes,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { LandMission } from "@/types/world";
import type { WorldSkin } from "./theme";

const GAME_ICON: Record<string, LucideIcon> = {
  "robot-maze": Bot,
  "typing-quest": Keyboard,
  "shape-match": Shapes,
  memory: Brain,
  "pattern-builder": Palette,
  "html-studio": Code2,
};

interface MissionCardProps {
  mission: LandMission;
  worldSlug: string;
  skin: WorldSkin;
  completed: boolean;
  index: number;
}

export function MissionCard({
  mission,
  worldSlug,
  skin,
  completed,
  index,
}: MissionCardProps) {
  const live = mission.status === "live";
  const GameIcon = GAME_ICON[mission.game] ?? Sparkles;

  const body = (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={live ? { scale: 1.015 } : undefined}
    >
      <Card
        className={`flex items-center gap-4 ${live ? "" : "opacity-70"} ${
          completed ? "ring-2 ring-emerald-400/60" : ""
        }`}
      >
        <div
          className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${skin.wash} ${skin.accent}`}
          aria-hidden
        >
          <GameIcon className="h-8 w-8" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold">
              {mission.title}
            </h3>
            {completed && (
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <Check className="h-3 w-3" /> Done
              </span>
            )}
          </div>
          <p className="truncate text-sm opacity-70">{mission.objective}</p>
          <div className="mt-1.5 flex items-center gap-3 text-xs font-semibold opacity-60">
            <span className={skin.accent}>{mission.skill}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {mission.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3" /> {mission.badge}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {live ? (
            <span
              className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${skin.gradient} text-white shadow-md`}
            >
              {completed ? <Check className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
            </span>
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/40">
              <Lock className="h-5 w-5" />
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );

  if (!live) {
    return (
      <div aria-disabled title="This mission unlocks soon" className="cursor-not-allowed">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/play/${worldSlug}/${mission.slug}`}
      className="block rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      aria-label={`Play ${mission.title}`}
    >
      {body}
    </Link>
  );
}
