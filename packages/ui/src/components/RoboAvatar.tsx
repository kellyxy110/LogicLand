"use client";
import { motion } from "framer-motion";
import { cn } from "../cn";

type Mood = "idle" | "happy" | "thinking";

/** Robo — LogicLand's friendly guide. A lightweight inline-SVG mascot so it
 *  ships with zero external image assets. Mood drives a small animation. */
export function RoboAvatar({
  mood = "idle",
  size = 96,
  className,
}: {
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  const anim =
    mood === "happy"
      ? { y: [0, -8, 0] }
      : mood === "thinking"
        ? { rotate: [-4, 4, -4] }
        : { y: [0, -3, 0] };
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={anim}
      transition={{ repeat: Infinity, duration: mood === "happy" ? 0.6 : 2.4, ease: "easeInOut" }}
      style={{ width: size, height: size }}
      aria-label={`Robo is ${mood}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} role="img">
        <rect x="22" y="28" width="56" height="46" rx="14" className="fill-brand" />
        <circle cx="40" cy="50" r="7" className="fill-white" />
        <circle cx="60" cy="50" r="7" className="fill-white" />
        <circle cx="40" cy="51" r="3" className="fill-brand" />
        <circle cx="60" cy="51" r="3" className="fill-brand" />
        <rect x="44" y="63" width="12" height="4" rx="2" className="fill-white/80" />
        <line x1="50" y1="16" x2="50" y2="28" className="stroke-brand" strokeWidth="3" />
        <circle cx="50" cy="14" r="4" className="fill-sunburst" />
      </svg>
    </motion.div>
  );
}
