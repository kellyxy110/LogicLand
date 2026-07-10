// Visual identity for each World theme. The engine only ever sends a `theme`
// key (never colors) — this is where the frontend turns that key into art and
// palette. Keeping it in one map means a new World is a data change on the
// server plus one entry here; no component edits.
import type { LucideIcon } from "lucide-react";
import { Building2, Crown, Factory, Mountain, Rocket, TreePine } from "lucide-react";
import type { WorldTheme } from "@/types/world";

export interface WorldSkin {
  /** Icon crest shown on the World card + home banner. */
  emblem: LucideIcon;
  /** Tailwind gradient for the card face (unlocked). */
  gradient: string;
  /** Solid accent used for text/edges over light surfaces. */
  accent: string;
  /** Soft tint used for the mission list background on the World home. */
  wash: string;
  /** A short, magical one-liner shown when the World is still locked. */
  teaser: string;
}

export const WORLD_SKINS: Record<WorldTheme, WorldSkin> = {
  forest: {
    emblem: TreePine,
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    accent: "text-emerald-600",
    wash: "bg-emerald-50 dark:bg-emerald-500/10",
    teaser: "Where every path hides a puzzle.",
  },
  kingdom: {
    emblem: Crown,
    gradient: "from-amber-300 via-yellow-500 to-orange-500",
    accent: "text-amber-600",
    wash: "bg-amber-50 dark:bg-amber-500/10",
    teaser: "Count the crowns. Rule the numbers.",
  },
  city: {
    emblem: Building2,
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    accent: "text-sky-600",
    wash: "bg-sky-50 dark:bg-sky-500/10",
    teaser: "Build streets of pure logic.",
  },
  factory: {
    emblem: Factory,
    gradient: "from-slate-400 via-slate-500 to-orange-500",
    accent: "text-orange-600",
    wash: "bg-orange-50 dark:bg-orange-500/10",
    teaser: "Assemble robots, one command at a time.",
  },
  mountain: {
    emblem: Mountain,
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    accent: "text-violet-600",
    wash: "bg-violet-50 dark:bg-violet-500/10",
    teaser: "Climb toward thinking machines.",
  },
  space: {
    emblem: Rocket,
    gradient: "from-indigo-500 via-purple-600 to-slate-900",
    accent: "text-indigo-500",
    wash: "bg-indigo-50 dark:bg-indigo-500/10",
    teaser: "Invent something no one has dreamed.",
  },
};

export function worldSkin(theme: WorldTheme): WorldSkin {
  return WORLD_SKINS[theme] ?? WORLD_SKINS.forest;
}
