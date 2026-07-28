// Consent-gated sharing persistence (ADR-020). Thin data helpers over the
// ShareGrant / ConsentApproval / ShareAudit models. All policy decisions live in
// the web engine (apps/web/src/lib/engines/sharing.ts); this layer only stores
// and reads, and always writes an audit row alongside a state change.
import { randomBytes } from "node:crypto";
import { prisma } from "./index";
import type { ConsentState, Prisma, ShareGrant, Visibility } from "@prisma/client";

export type { ShareGrant };

export interface CreateGrantInput {
  studentId: string;
  subjectType: string;
  subjectId: string;
  requestedVisibility: Visibility;
  policyVersion: string;
  requestedById: string;
  expiresAt?: Date | null;
}

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Create (or re-open) the single grant for a (student, subject). Re-requesting a
 * new visibility resets the workflow but preserves the audit trail. */
export async function upsertShareRequest(input: CreateGrantInput): Promise<ShareGrant> {
  const existing = await prisma.shareGrant.findFirst({
    where: { subjectType: input.subjectType, subjectId: input.subjectId, studentId: input.studentId },
  });
  if (existing) {
    const grant = await prisma.shareGrant.update({
      where: { id: existing.id },
      data: {
        requestedVisibility: input.requestedVisibility,
        state: "PENDING",
        policyVersion: input.policyVersion,
        learnerAcknowledged: false,
        moderationStatus: "not_run",
        moderationFindings: undefined,
        revokedAt: null,
        expiresAt: input.expiresAt ?? null,
      },
    });
    await prisma.shareAudit.create({
      data: { grantId: grant.id, actorId: input.requestedById, action: "requested", detail: input.requestedVisibility },
    });
    return grant;
  }
  const grant = await prisma.shareGrant.create({
    data: {
      studentId: input.studentId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      requestedVisibility: input.requestedVisibility,
      effectiveVisibility: "PRIVATE",
      state: "PENDING",
      policyVersion: input.policyVersion,
      token: newToken(),
      requestedById: input.requestedById,
      expiresAt: input.expiresAt ?? null,
    },
  });
  await prisma.shareAudit.create({
    data: { grantId: grant.id, actorId: input.requestedById, action: "requested", detail: input.requestedVisibility },
  });
  return grant;
}

export async function getGrant(grantId: string) {
  return prisma.shareGrant.findUnique({
    where: { id: grantId },
    include: { approvals: true, audits: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getGrantForSubject(subjectType: string, subjectId: string) {
  return prisma.shareGrant.findFirst({
    where: { subjectType, subjectId },
    include: { approvals: true },
  });
}

export async function getPublicGrantByToken(token: string) {
  return prisma.shareGrant.findUnique({ where: { token }, include: { approvals: true } });
}

export async function recordApproval(input: {
  grantId: string;
  approverRole: string;
  approverUserId: string;
  approved: boolean;
  note?: string;
}) {
  await prisma.consentApproval.upsert({
    where: {
      grantId_approverRole_approverUserId: {
        grantId: input.grantId,
        approverRole: input.approverRole,
        approverUserId: input.approverUserId,
      },
    },
    create: {
      grantId: input.grantId,
      approverRole: input.approverRole,
      approverUserId: input.approverUserId,
      approved: input.approved,
      note: input.note,
    },
    update: { approved: input.approved, note: input.note },
  });
  await prisma.shareAudit.create({
    data: {
      grantId: input.grantId,
      actorId: input.approverUserId,
      actorRole: input.approverRole,
      action: input.approved ? "approved" : "rejected",
      detail: input.note,
    },
  });
}

export async function setLearnerAcknowledged(grantId: string, learnerUserId: string) {
  await prisma.shareGrant.update({ where: { id: grantId }, data: { learnerAcknowledged: true } });
  await prisma.shareAudit.create({
    data: { grantId, actorId: learnerUserId, actorRole: "LEARNER", action: "acknowledged" },
  });
}

/** Persist the resolved state + effective visibility + moderation outcome. */
export async function applyGrantResolution(input: {
  grantId: string;
  actorId: string;
  state: ConsentState;
  effectiveVisibility: Visibility;
  moderationStatus?: string;
  moderationFindings?: Prisma.InputJsonValue;
}) {
  await prisma.shareGrant.update({
    where: { id: input.grantId },
    data: {
      state: input.state,
      effectiveVisibility: input.effectiveVisibility,
      ...(input.moderationStatus ? { moderationStatus: input.moderationStatus } : {}),
      ...(input.moderationFindings !== undefined ? { moderationFindings: input.moderationFindings } : {}),
    },
  });
  await prisma.shareAudit.create({
    data: {
      grantId: input.grantId,
      actorId: input.actorId,
      action: "visibility_changed",
      detail: `${input.state}:${input.effectiveVisibility}`,
    },
  });
}

/** Revoke: force PRIVATE + record revocation. Public discovery must stop at once;
 * the audit row is preserved (only internal record survives a takedown). */
export async function revokeGrant(grantId: string, actorId: string, actorRole?: string) {
  await prisma.shareGrant.update({
    where: { id: grantId },
    data: { state: "REVOKED", effectiveVisibility: "PRIVATE", revokedAt: new Date() },
  });
  await prisma.shareAudit.create({
    data: { grantId, actorId, actorRole, action: "revoked" },
  });
}
