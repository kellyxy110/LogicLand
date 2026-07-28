"use server";
// Consent-gated sharing server actions (ADR-020). Every mutation runs the pure
// policy engine, persists an audited state change, and re-resolves the grant.
// Nothing here bypasses the SHARING_ENABLED flag: with sharing off, requests can
// be drafted but a grant can never resolve to a publicly-discoverable visibility.
import { auth } from "@clerk/nextjs/server";
import {
  applyGrantResolution,
  getGrant,
  getGrantForSubject,
  getStudioProject,
  recordApproval,
  revokeGrant,
  setLearnerAcknowledged,
  upsertShareRequest,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";
import { SHARING_ENABLED, SHARING_PUBLIC_MINORS_ENABLED } from "@/lib/flags";
import {
  ageCategory,
  CONSENT_POLICY_VERSION,
  evaluateConsent,
  isPublicDiscovery,
  requiredApprovals,
  type ApproverRole,
  type CollectedApproval,
  type Visibility,
} from "@/lib/engines/sharing";
import { moderateForPublication } from "@/lib/engines/sharing-moderation";

export interface ShareStatus {
  enabled: boolean;
  grantId: string | null;
  requestedVisibility: Visibility | null;
  effectiveVisibility: Visibility;
  state: string;
  missingRoles: ApproverRole[];
  moderationStatus: string;
  reason: string;
  requirement: ReturnType<typeof requiredApprovals> | null;
}

const PRIVATE_STATUS: ShareStatus = {
  enabled: SHARING_ENABLED,
  grantId: null,
  requestedVisibility: null,
  effectiveVisibility: "PRIVATE",
  state: "PRIVATE",
  missingRoles: [],
  moderationStatus: "not_run",
  reason: "private_by_default",
  requirement: null,
};

async function subjectFiles(studentId: string, subjectType: string): Promise<{ name: string; content: string }[]> {
  if (subjectType === "studio_project") {
    const proj = await getStudioProject(studentId);
    return (proj?.files ?? []).map((f) => ({ name: f.name, content: f.content }));
  }
  return [];
}

/** Re-run policy + moderation against a grant and persist the resolved state. */
async function resolveGrant(grantId: string, actorId: string): Promise<ShareStatus> {
  const grant = await getGrant(grantId);
  if (!grant) return PRIVATE_STATUS;

  const student = await currentStudent();
  // school-management isn't modelled in the schema yet; treat as self-managed for
  // now (adds no teacher/school approver). Revisit when a School/Class link exists.
  const ctx = { ageYears: student.ageYears, schoolManaged: false };
  const requirement = requiredApprovals(grant.requestedVisibility, ctx);

  // Moderation for any link-exposed target.
  let moderationStatus = grant.moderationStatus;
  let moderationFindings: unknown = undefined;
  if (requirement.moderationRequired) {
    const files = await subjectFiles(grant.studentId, grant.subjectType);
    const report = moderateForPublication({ files });
    moderationStatus = report.passed
      ? requirement.humanReviewRequired
        ? "human_pending"
        : "passed"
      : "blocked";
    moderationFindings = report.findings;
  }

  const approvals: CollectedApproval[] = grant.approvals.map((a) => ({
    role: a.approverRole as ApproverRole,
    approved: a.approved,
  }));
  const evaluation = evaluateConsent(requirement, approvals, {
    learnerAcknowledged: grant.learnerAcknowledged,
    revoked: grant.state === "REVOKED",
    expired: grant.expiresAt ? grant.expiresAt.getTime() < Date.now() : false,
  });

  // Decide the live visibility. Consent + moderation + flags must ALL pass for a
  // public target; otherwise the project stays private.
  let effective: Visibility = "PRIVATE";
  const consentOk = evaluation.state === "APPROVED";
  const moderationOk = !requirement.moderationRequired || moderationStatus === "passed";
  const publicAllowed =
    !isPublicDiscovery(grant.requestedVisibility) ||
    (SHARING_ENABLED &&
      (ageCategory(student.ageYears) === "adult_18_plus" || SHARING_PUBLIC_MINORS_ENABLED));
  if (SHARING_ENABLED && consentOk && moderationOk && publicAllowed) {
    effective = grant.requestedVisibility;
  }

  await applyGrantResolution({
    grantId,
    actorId,
    state: evaluation.state,
    effectiveVisibility: effective,
    moderationStatus,
    moderationFindings: moderationFindings as never,
  });

  return {
    enabled: SHARING_ENABLED,
    grantId,
    requestedVisibility: grant.requestedVisibility,
    effectiveVisibility: effective,
    state: evaluation.state,
    missingRoles: evaluation.missingRoles,
    moderationStatus,
    reason: evaluation.reason,
    requirement,
  };
}

export async function shareStatus(subjectType: string, subjectId: string): Promise<ShareStatus> {
  const { userId } = await auth();
  if (!userId) return PRIVATE_STATUS;
  const grant = await getGrantForSubject(subjectType, subjectId);
  if (!grant) return PRIVATE_STATUS;
  return resolveGrant(grant.id, userId);
}

export async function requestShare(
  subjectType: string,
  subjectId: string,
  visibility: Visibility,
): Promise<ShareStatus> {
  const { userId } = await auth();
  if (!userId) return PRIVATE_STATUS;
  const student = await currentStudent();
  const grant = await upsertShareRequest({
    studentId: student.id,
    subjectType,
    subjectId,
    requestedVisibility: visibility,
    policyVersion: CONSENT_POLICY_VERSION,
    requestedById: userId,
  });
  return resolveGrant(grant.id, userId);
}

export async function acknowledgeShare(grantId: string): Promise<ShareStatus> {
  const { userId } = await auth();
  if (!userId) return PRIVATE_STATUS;
  await setLearnerAcknowledged(grantId, userId);
  return resolveGrant(grantId, userId);
}

export async function decideShare(
  grantId: string,
  role: ApproverRole,
  approved: boolean,
  note?: string,
): Promise<ShareStatus> {
  const { userId } = await auth();
  if (!userId) return PRIVATE_STATUS;
  await recordApproval({ grantId, approverRole: role, approverUserId: userId, approved, note });
  return resolveGrant(grantId, userId);
}

export async function revokeShare(grantId: string, role?: ApproverRole): Promise<ShareStatus> {
  const { userId } = await auth();
  if (!userId) return PRIVATE_STATUS;
  await revokeGrant(grantId, userId, role);
  return resolveGrant(grantId, userId);
}
