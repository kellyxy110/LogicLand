"use client";
import { motion } from "framer-motion";
import { cn } from "../cn";

export interface XpMeterProps {
  level: number;
  /** 0.0 - 1.0 progress through the current level. */
  progress: number;
  className?: string;
}

/** Animated level + XP progress bar. Fills smoothly when XP is awarded. */
export function XpMeter({ level, progress, className }: XpMeterProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-bold text-white">
        {level}
      </span>
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand to-sunburst"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
