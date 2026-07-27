// The Academy layer — LogicLand v2.0's top structural tier. The platform is an
// ecosystem of Academies; each Academy holds Courses → Worlds → Missions →
// Levels (the existing world/mission model plugs in beneath). This file is the
// contract only; the curated catalog lives in data/academies.ts. Keeping the
// icon as a string *key* (resolved in the UI, like GAME_ICON) means the catalog
// stays plain data and never imports React.

/** "live" is enterable today; "soon" is on the roadmap and honestly labelled —
 *  never a button that leads nowhere. */
export type AcademyStatus = "live" | "soon";

/** The three permanent foundations of LogicLand (ADR-010). Every academy belongs
 *  to one; programming is the core, and everything else *branches from* these
 *  three rather than sitting beside them as an equal. */
export type FoundationId = "programming" | "mathematics" | "ai";

/** Presentation metadata for a foundation section on the Academies hub. */
export interface Foundation {
  id: FoundationId;
  name: string;
  /** One-line hook for the section header. */
  tagline: string;
  /** A sentence framing what the foundation is about. */
  description: string;
  /** Lucide icon key, resolved in the UI (keeps data React-free). */
  icon: string;
  /** Tailwind gradient classes for the section emblem. */
  gradient: string;
}

/** The learner tiers from the v2.0 vision. "All Ages" spans several bands. */
export type AgeBand =
  | "Little Explorers" // 4–6
  | "Young Creators" // 7–10
  | "Future Innovators" // 11–15
  | "Senior Academy" // 16+
  | "All Ages";

export interface Academy {
  slug: string;
  name: string;
  /** One-line hook shown on the card. */
  tagline: string;
  /** A short paragraph of what the academy teaches / becomes. */
  description: string;
  /** Lucide icon key, resolved to a component in the UI (keeps data React-free). */
  icon: string;
  /** Tailwind gradient classes for the card's emblem + accent. */
  gradient: string;
  status: AcademyStatus;
  /** Which of the three permanent foundations this academy belongs to (ADR-010). */
  foundation: FoundationId;
  /** The core academy of its foundation — the one the others branch from. Exactly
   *  one academy per foundation is the core. */
  core?: boolean;
  /** Learner tiers this academy serves. */
  ageBands: AgeBand[];
  /** Planned number of courses/tracks — the roadmap ambition, not a live count. */
  plannedTracks: number;
  /** The flagship academy (Math Fix) gets pride of place. */
  flagship?: boolean;
  /** Where "Enter" navigates when the academy is live (e.g. Coding → /worlds). */
  href?: string;
  /** 2–4 signature capabilities, shown as bullets. */
  highlights: string[];
}
