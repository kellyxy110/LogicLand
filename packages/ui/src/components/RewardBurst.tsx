"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";

/** Celebration burst shown on mission completion. Respects reduced motion by
 *  keeping the animation short and transform/opacity-only. */
export function RewardBurst({
  show,
  count = 12,
}: {
  show: boolean;
  count?: number;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * 180,
                  y: Math.sin(angle) * 180,
                  scale: 1,
                  opacity: 0,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Star className="h-6 w-6 fill-sunburst text-sunburst" />
              </motion.span>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
