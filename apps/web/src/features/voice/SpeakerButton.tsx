"use client";
// A round "hear it" button. Reads its text aloud and pulses while speaking. It
// renders nothing when speech isn't supported, so screens degrade gracefully.
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { cn } from "@logicland/ui";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import type { SpeakOptions } from "@/lib/voice/speak";

interface SpeakerButtonProps {
  text: string;
  /** Accessible label, e.g. "Hear the word Loop". */
  label?: string;
  size?: "sm" | "md";
  opts?: SpeakOptions;
  className?: string;
}

export function SpeakerButton({
  text,
  label = "Hear it",
  size = "md",
  opts,
  className,
}: SpeakerButtonProps) {
  const { say, speaking, supported } = useSpeaker();
  if (!supported) return null;

  const dims = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        say(text, opts);
      }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/20",
        dims,
        className,
      )}
    >
      <Volume2 className={cn(icon, speaking && "animate-pulse")} />
    </motion.button>
  );
}
