"use client";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "../cn";

/** Idle-animated streak flame that grows warmer with a longer streak. */
export function StreakFlame({
  days,
  className,
}: {
  days: number;
  className?: string;
}) {
  const active = days > 0;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <motion.span
        animate={active ? { scale: [1, 1.12, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      >
        <Flame
          className={cn(
            "h-6 w-6",
            active ? "fill-sunburst text-sunburst" : "text-black/30 dark:text-white/30",
          )}
        />
      </motion.span>
      <span className="font-display text-lg font-bold">{days}</span>
    </div>
  );
}
