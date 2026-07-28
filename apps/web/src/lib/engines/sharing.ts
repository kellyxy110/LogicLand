// Consent-gated sharing — the safeguarding policy engine (ADR-020).
//
// PURE and deterministic (ADR-015): no I/O, no dates-from-now baked in. It answers
// three questions the rest of the system builds on:
//   1. What approvals does raising a project to a given visibility require, for a
//      learner of a given age (and whether the account is school-managed)?
//   2. Given the approvals collected so far, is a consent grant satisfied?
//   3. What may a public page for a MINOR actually display (minor-safe redaction)?
//
// Nothing here publishes anything. Publication is gated by (a) this policy being
// satisfied, (b) moderation passing (see sharing-moderation.ts), and (c) the
// SHARING feature flag being on (see ../flags.ts). Private is always the default.

/** The bumped version stamped onto every consent record. Raise on policy change
 * so historic grants remain attributable to the exact rules they were made under
 * and can be re-requested when the policy materially changes. */
export const CONSENT_POLICY_VERSION = "2026-07-28.1";

export type Visibility =
  | "PRIVATE"
  | "TEACHER_ONLY"
  | "PARENT_ONLY"
  | "CLASSROOM"
  | "SCHOOL"
  | "UNLISTED_PORTFOLIO"
  | "ANONYMOUS_SHOWCASE"
  | "PUBLIC_SHOWCASE"
  | "COMPETITION_SHOWCASE";

export const ALL_VISIBILITIES: Visibility[] = [
  "PRIVATE",
  "TEACHER_ONLY",
  "PARENT_ONLY",
  "CLASSROOM",
  "SCHOOL",
  "UNLISTED_PORTFOLIO",
  "ANONYMOUS_SHOWCASE",
  "PUBLIC_SHOWCASE",
  "COMPETITION_SHOWCASE",
];

/** Ordered most-private → most-exposed. Used only for "is this a raise?" and for
 * rendering the ladder; approvals are policy-driven, not rank-driven. */
const VISIBILITY_RANK: Record<Visibility, number> = {
  PRIVATE: 0,
  TEACHER_ONLY: 1,
  PARENT_ONLY: 1,
  CLASSROOM: 2,
  SCHOOL: 3,
  UNLISTED_PORTFOLIO: 4,
  ANONYMOUS_SHOWCASE: 5,
  COMPETITION_SHOWCASE: 6,
  PUBLIC_SHOWCASE: 7,
};

export type AgeCategory = "under_13" | "teen_13_17" | "adult_18_plus";

export type ApproverRole =
  | "LEARNER"
  | "PARENT"
  | "GUARDIAN"
  | "TEACHER"
  | "SCHOOL_ADMIN"
  | "PLATFORM";

export type ConsentState =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED"
  | "EXPIRED";

/** Publicly discoverable to strangers (indexable / listed). The strongest gate. */
export function isPublicDiscovery(v: Visibility): boolean {
  return (
    v === "ANONYMOUS_SHOWCASE" ||
    v === "PUBLIC_SHOWCASE" ||
    v === "COMPETITION_SHOWCASE"
  );
}

/** Reachable by anyone with a link but never indexed/listed. Still needs consent
 * and minor-safe display, but is not open discovery. */
export function isLinkExposed(v: Visibility): boolean {
  return v === "UNLISTED_PORTFOLIO" || isPublicDiscovery(v);
}

/** A public page for this mode must hide the learner's identity entirely. */
export function requiresAnonymous(v: Visibility): boolean {
  return v === "ANONYMOUS_SHOWCASE";
}

export function ageCategory(ageYears: number | null | undefined): AgeCategory {
  if (ageYears == null || ageYears < 13) return "under_13";
  if (ageYears < 18) return "teen_13_17";
  return "adult_18_plus";
}

export function isRaise(from: Visibility, to: Visibility): boolean {
  return VISIBILITY_RANK[to] > VISIBILITY_RANK[from];
}

export interface ApprovalRequirement {
  /** Roles that must each APPROVE before the grant is satisfied. */
  approverRoles: ApproverRole[];
  /** The learner must acknowledge (understands it will be shared). */
  learnerAckRequired: boolean;
  /** If false, a rejection by any required approver is final — the learner
   * cannot self-override (enforced for under-13 public modes). */
  learnerCanOverrideRejection: boolean;
  /** Automated privacy/secret/PII + prohibited-content moderation must pass. */
  moderationRequired: boolean;
  /** Human moderation review required in addition to automated checks. */
  humanReviewRequired: boolean;
  /** Convenience: this target is publicly discoverable. */
  publicDiscovery: boolean;
}

export interface RequirementContext {
  ageYears: number | null | undefined;
  /** The account is managed by a school/teacher (adds teacher/school approval). */
  schoolManaged: boolean;
}

/**
 * The core policy table. Returns exactly what is required to move a project to
 * `target` for this learner. Private and trusted-circle modes need no elevated
 * consent; link-exposed and public modes require verified adult approval, scale
 * with age, and always require moderation.
 */
export function requiredApprovals(
  target: Visibility,
  ctx: RequirementContext,
): ApprovalRequirement {
  const cat = ageCategory(ctx.ageYears);
  const publicDiscovery = isPublicDiscovery(target);
  const linkExposed = isLinkExposed(target);

  // Trusted circle: sharing to the learner's own people. No elevated consent.
  if (target === "PRIVATE" || target === "TEACHER_ONLY" || target === "PARENT_ONLY") {
    return {
      approverRoles: [],
      learnerAckRequired: false,
      learnerCanOverrideRejection: true,
      moderationRequired: false,
      humanReviewRequired: false,
      publicDiscovery: false,
    };
  }

  // Classroom / school: within the managed circle, not public discovery.
  if (target === "CLASSROOM" || target === "SCHOOL") {
    const roles: ApproverRole[] = [];
    if (ctx.schoolManaged) roles.push("TEACHER");
    return {
      approverRoles: roles,
      learnerAckRequired: cat === "under_13",
      learnerCanOverrideRejection: true,
      moderationRequired: false,
      humanReviewRequired: false,
      publicDiscovery: false,
    };
  }

  // Link-exposed (UNLISTED_PORTFOLIO) and public showcases: consent scales by age.
  const roles: ApproverRole[] = [];
  let learnerAckRequired = false;
  let learnerCanOverrideRejection = true;

  if (cat === "adult_18_plus") {
    // Adults publish their own work directly, subject to moderation.
  } else {
    // Both minor bands require verified parent/guardian approval.
    roles.push("PARENT");
    if (ctx.schoolManaged) roles.push("SCHOOL_ADMIN");
    if (cat === "under_13") {
      learnerAckRequired = true;
      // Under-13s cannot override an adult's rejection.
      learnerCanOverrideRejection = false;
    }
  }

  return {
    approverRoles: roles,
    learnerAckRequired,
    learnerCanOverrideRejection,
    moderationRequired: linkExposed,
    // Human review is required before a MINOR's work is openly discoverable.
    humanReviewRequired: publicDiscovery && cat !== "adult_18_plus",
    publicDiscovery,
  };
}

/** True when an adult learner may set this visibility with no approver besides
 * moderation. */
export function canPublishDirectly(
  target: Visibility,
  ctx: RequirementContext,
): boolean {
  return requiredApprovals(target, ctx).approverRoles.length === 0;
}

export interface CollectedApproval {
  role: ApproverRole;
  approved: boolean; // false = an explicit rejection
}

export interface ConsentEvaluation {
  state: ConsentState;
  /** Roles still needed to reach APPROVED. */
  missingRoles: ApproverRole[];
  /** True when a required approver rejected and the learner can't override. */
  blockedByRejection: boolean;
  reason: string;
}

/**
 * Resolve a grant's state from its requirement + the approvals collected so far.
 * Deterministic and side-effect free — the caller persists the result.
 */
export function evaluateConsent(
  req: ApprovalRequirement,
  approvals: CollectedApproval[],
  opts: { learnerAcknowledged?: boolean; expired?: boolean; revoked?: boolean } = {},
): ConsentEvaluation {
  if (opts.revoked) {
    return { state: "REVOKED", missingRoles: [], blockedByRejection: false, reason: "revoked" };
  }
  if (opts.expired) {
    return { state: "EXPIRED", missingRoles: [], blockedByRejection: false, reason: "expired" };
  }

  const rejected = approvals.filter(
    (a) => !a.approved && req.approverRoles.includes(a.role),
  );
  if (rejected.length > 0 && !req.learnerCanOverrideRejection) {
    return {
      state: "REJECTED",
      missingRoles: [],
      blockedByRejection: true,
      reason: `rejected_by_${rejected[0].role.toLowerCase()}`,
    };
  }

  const approvedRoles = new Set(
    approvals.filter((a) => a.approved).map((a) => a.role),
  );
  const missingRoles = req.approverRoles.filter((r) => !approvedRoles.has(r));

  if (req.learnerAckRequired && !opts.learnerAcknowledged) {
    return {
      state: "PENDING",
      missingRoles,
      blockedByRejection: false,
      reason: "awaiting_learner_acknowledgement",
    };
  }
  if (missingRoles.length > 0) {
    return {
      state: "PENDING",
      missingRoles,
      blockedByRejection: false,
      reason: "awaiting_approval",
    };
  }
  return { state: "APPROVED", missingRoles: [], blockedByRejection: false, reason: "all_requirements_met" };
}

// --- Minor-safe public display -------------------------------------------------

/** The raw profile the app holds internally. Never rendered as-is on a public page
 * for a minor. */
export interface LearnerProfile {
  legalName?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastInitial?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  ageYears?: number | null;
  birthDate?: string | null;
  country?: string | null;
  preciseLocation?: string | null;
  schoolName?: string | null;
  className?: string | null;
  socialLinks?: string[] | null;
}

export interface PublicProfile {
  name: string;
  avatarUrl: string | null;
  ageBand: string | null;
  region: string | null;
}

const AGE_BANDS: [number, string][] = [
  [7, "5–7"],
  [10, "8–10"],
  [12, "11–12"],
  [14, "13–14"],
  [17, "15–17"],
];

export function ageBand(ageYears: number | null | undefined): string | null {
  if (ageYears == null) return null;
  for (const [ceiling, label] of AGE_BANDS) {
    if (ageYears <= ceiling) return label;
  }
  return "18+";
}

export interface RedactionOptions {
  /** Region was separately approved for display (broad country/region only). */
  regionApproved?: boolean;
}

/**
 * Produce the ONLY fields allowed to appear on a public page for a learner.
 * For anonymous modes, identity is dropped entirely. For named modes we still
 * expose only an approved display name (or first name + initial), an avatar, a
 * broad age band, and — only if separately approved — a broad region. Everything
 * else (legal name, email, phone, precise location, school/class, socials) is
 * never included.
 */
export function minorSafePublicProfile(
  profile: LearnerProfile,
  visibility: Visibility,
  opts: RedactionOptions = {},
): PublicProfile {
  if (requiresAnonymous(visibility)) {
    return { name: "Anonymous Builder", avatarUrl: profile.avatarUrl ?? null, ageBand: ageBand(profile.ageYears), region: null };
  }
  const name =
    (profile.displayName && profile.displayName.trim()) ||
    [profile.firstName, profile.lastInitial ? `${profile.lastInitial}.` : ""]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "LogicLand Builder";
  return {
    name,
    avatarUrl: profile.avatarUrl ?? null,
    ageBand: ageBand(profile.ageYears),
    region: opts.regionApproved ? profile.country ?? null : null,
  };
}
