import { describe, expect, it } from "vitest";
import {
  ageBand,
  ageCategory,
  canPublishDirectly,
  CONSENT_POLICY_VERSION,
  evaluateConsent,
  isPublicDiscovery,
  isRaise,
  minorSafePublicProfile,
  requiredApprovals,
  type CollectedApproval,
} from "./sharing";

describe("age categories", () => {
  it("bands ages into policy categories", () => {
    expect(ageCategory(6)).toBe("under_13");
    expect(ageCategory(12)).toBe("under_13");
    expect(ageCategory(13)).toBe("teen_13_17");
    expect(ageCategory(17)).toBe("teen_13_17");
    expect(ageCategory(18)).toBe("adult_18_plus");
    expect(ageCategory(null)).toBe("under_13"); // unknown age = most protective
  });
});

describe("required approvals", () => {
  it("private and trusted-circle modes need no elevated consent", () => {
    for (const v of ["PRIVATE", "TEACHER_ONLY", "PARENT_ONLY"] as const) {
      const r = requiredApprovals(v, { ageYears: 8, schoolManaged: true });
      expect(r.approverRoles).toEqual([]);
      expect(r.publicDiscovery).toBe(false);
      expect(r.moderationRequired).toBe(false);
    }
  });

  it("under-13 public showcase needs parent (+school) approval, learner ack, no self-override, human review", () => {
    const r = requiredApprovals("PUBLIC_SHOWCASE", { ageYears: 9, schoolManaged: true });
    expect(r.approverRoles).toContain("PARENT");
    expect(r.approverRoles).toContain("SCHOOL_ADMIN");
    expect(r.learnerAckRequired).toBe(true);
    expect(r.learnerCanOverrideRejection).toBe(false);
    expect(r.moderationRequired).toBe(true);
    expect(r.humanReviewRequired).toBe(true);
    expect(r.publicDiscovery).toBe(true);
  });

  it("teen public showcase needs parent approval but allows self-advocacy", () => {
    const r = requiredApprovals("PUBLIC_SHOWCASE", { ageYears: 15, schoolManaged: false });
    expect(r.approverRoles).toEqual(["PARENT"]);
    expect(r.learnerAckRequired).toBe(false);
    expect(r.learnerCanOverrideRejection).toBe(true);
    expect(r.humanReviewRequired).toBe(true);
  });

  it("adults publish public work directly, subject to moderation", () => {
    const r = requiredApprovals("PUBLIC_SHOWCASE", { ageYears: 22, schoolManaged: false });
    expect(r.approverRoles).toEqual([]);
    expect(canPublishDirectly("PUBLIC_SHOWCASE", { ageYears: 22, schoolManaged: false })).toBe(true);
    expect(r.moderationRequired).toBe(true);
    expect(r.humanReviewRequired).toBe(false); // adult, not a minor
  });

  it("classroom/school for a school-managed minor needs teacher approval, not parent", () => {
    const r = requiredApprovals("CLASSROOM", { ageYears: 10, schoolManaged: true });
    expect(r.approverRoles).toEqual(["TEACHER"]);
    expect(r.publicDiscovery).toBe(false);
  });

  it("marks the discoverable modes", () => {
    expect(isPublicDiscovery("ANONYMOUS_SHOWCASE")).toBe(true);
    expect(isPublicDiscovery("PUBLIC_SHOWCASE")).toBe(true);
    expect(isPublicDiscovery("COMPETITION_SHOWCASE")).toBe(true);
    expect(isPublicDiscovery("UNLISTED_PORTFOLIO")).toBe(false);
    expect(isPublicDiscovery("SCHOOL")).toBe(false);
  });
});

describe("raise detection", () => {
  it("detects raising vs lowering visibility", () => {
    expect(isRaise("PRIVATE", "PUBLIC_SHOWCASE")).toBe(true);
    expect(isRaise("PUBLIC_SHOWCASE", "PRIVATE")).toBe(false);
    expect(isRaise("PRIVATE", "PRIVATE")).toBe(false);
  });
});

describe("consent evaluation", () => {
  const req = requiredApprovals("PUBLIC_SHOWCASE", { ageYears: 9, schoolManaged: true });

  it("is pending until every required role approves and the learner acknowledges", () => {
    const partial: CollectedApproval[] = [{ role: "PARENT", approved: true }];
    const e = evaluateConsent(req, partial, { learnerAcknowledged: true });
    expect(e.state).toBe("PENDING");
    expect(e.missingRoles).toContain("SCHOOL_ADMIN");
  });

  it("is pending while the learner has not acknowledged", () => {
    const all: CollectedApproval[] = [
      { role: "PARENT", approved: true },
      { role: "SCHOOL_ADMIN", approved: true },
    ];
    expect(evaluateConsent(req, all, { learnerAcknowledged: false }).reason).toBe(
      "awaiting_learner_acknowledgement",
    );
  });

  it("approves once all roles approve and the learner acknowledges", () => {
    const all: CollectedApproval[] = [
      { role: "PARENT", approved: true },
      { role: "SCHOOL_ADMIN", approved: true },
    ];
    expect(evaluateConsent(req, all, { learnerAcknowledged: true }).state).toBe("APPROVED");
  });

  it("a parent rejection is final for an under-13 (no self-override)", () => {
    const rej: CollectedApproval[] = [{ role: "PARENT", approved: false }];
    const e = evaluateConsent(req, rej, { learnerAcknowledged: true });
    expect(e.state).toBe("REJECTED");
    expect(e.blockedByRejection).toBe(true);
  });

  it("honours revoked and expired terminal states", () => {
    expect(evaluateConsent(req, [], { revoked: true }).state).toBe("REVOKED");
    expect(evaluateConsent(req, [], { expired: true }).state).toBe("EXPIRED");
  });
});

describe("minor-safe public profile", () => {
  const profile = {
    legalName: "Joanna Kelly Smith",
    displayName: "PixelFox",
    firstName: "Joanna",
    lastInitial: "S",
    email: "jo@example.com",
    phone: "555-123-9876",
    avatarUrl: "/a.png",
    ageYears: 9,
    birthDate: "2016-05-01",
    country: "Canada",
    preciseLocation: "12 Maple Street",
    schoolName: "Oak Primary",
    className: "3B",
    socialLinks: ["https://instagram.com/jo"],
  };

  it("anonymous mode drops all identity", () => {
    const p = minorSafePublicProfile(profile, "ANONYMOUS_SHOWCASE");
    expect(p.name).toBe("Anonymous Builder");
    expect(p.region).toBeNull();
  });

  it("named mode exposes only approved display name, avatar and age band", () => {
    const p = minorSafePublicProfile(profile, "PUBLIC_SHOWCASE");
    expect(p.name).toBe("PixelFox");
    expect(p.ageBand).toBe("8–10");
    expect(p.region).toBeNull(); // region not separately approved
    // Nothing leaks the disallowed fields.
    const serialized = JSON.stringify(p);
    for (const leak of ["Smith", "jo@example.com", "555", "Maple", "Oak Primary", "instagram"]) {
      expect(serialized).not.toContain(leak);
    }
  });

  it("shows a broad region only when separately approved", () => {
    const p = minorSafePublicProfile(profile, "PUBLIC_SHOWCASE", { regionApproved: true });
    expect(p.region).toBe("Canada");
  });

  it("age bands are broad, never exact", () => {
    expect(ageBand(6)).toBe("5–7");
    expect(ageBand(9)).toBe("8–10");
    expect(ageBand(16)).toBe("15–17");
    expect(ageBand(30)).toBe("18+");
  });
});

describe("policy version", () => {
  it("is stamped and non-empty", () => {
    expect(CONSENT_POLICY_VERSION).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
