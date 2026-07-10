"use client";
// A single command tile — icon + label. Used both on the palette (tappable) and
// in the assembled program row (removable). Big, bright, and finger-friendly.
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Octagon,
  Rabbit,
  RotateCw,
  Wind,
  X,
} from "lucide-react";
import { commandDef } from "@/data/commands";
import type { CommandId } from "@/types/game";

/** Each command's tile icon. Replaces the emoji glyphs from the data file. */
const COMMAND_ICON: Record<CommandId, LucideIcon> = {
  GO: ArrowUp,
  UP: ChevronUp,
  DOWN: ChevronDown,
  LEFT: ChevronLeft,
  RIGHT: ChevronRight,
  TURN: RotateCw,
  JUMP: Rabbit,
  RUN: Wind,
  STOP: Octagon,
};

interface CommandChipProps {
  id: CommandId;
  onClick?: () => void;
  onRemove?: () => void;
  /** "palette" is a big tap target; "token" is compact for the program row. */
  variant?: "palette" | "token";
  disabled?: boolean;
  index?: number;
}

export function CommandChip({
  id,
  onClick,
  onRemove,
  variant = "palette",
  disabled,
  index = 0,
}: CommandChipProps) {
  const def = commandDef(id);
  if (!def) return null;
  const Icon = COMMAND_ICON[id] ?? ArrowUp;

  if (variant === "token") {
    return (
      <motion.span
        layout
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        className="inline-flex items-center gap-1 rounded-xl bg-brand/10 px-2.5 py-1.5 text-sm font-bold text-brand"
      >
        <Icon className="h-4 w-4" aria-hidden />
        {def.label}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${def.label}`}
            className="ml-0.5 rounded-full p-0.5 hover:bg-brand/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.span>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={def.hint}
      aria-label={`${def.label}: ${def.hint}`}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -3 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl border-2 border-brand/20 bg-white px-3 py-2.5 font-bold text-brand shadow-sm transition-colors hover:border-brand/50 disabled:opacity-40 dark:bg-white/10"
    >
      <Icon className="h-6 w-6" aria-hidden />
      <span className="text-xs">{def.label}</span>
    </motion.button>
  );
}
