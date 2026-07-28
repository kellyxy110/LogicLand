"use client";
// Consent-gated sharing UI (ADR-020). Renders the learner-facing request flow and
// the resolved state. It NEVER decides policy — it calls server actions that run
// the policy engine. When sharing is disabled, it shows the private-by-default
// state only. Approver (parent/teacher) decisions happen in their own dashboards
// via decideShare; this panel focuses on the learner's request + status.
import { useState, useTransition } from "react";
import { Lock, ShieldCheck, Clock, Ban, Eye } from "lucide-react";
import {
  acknowledgeShare,
  requestShare,
  revokeShare,
  type ShareStatus,
} from "@/app/actions/sharing";
import { ALL_VISIBILITIES, type Visibility } from "@/lib/engines/sharing";

const LABELS: Record<Visibility, string> = {
  PRIVATE: "Private — only me",
  TEACHER_ONLY: "My teacher",
  PARENT_ONLY: "My parent",
  CLASSROOM: "My classroom",
  SCHOOL: "My school",
  UNLISTED_PORTFOLIO: "Unlisted link",
  ANONYMOUS_SHOWCASE: "Anonymous showcase",
  PUBLIC_SHOWCASE: "Public showcase",
  COMPETITION_SHOWCASE: "Competition showcase",
};

export function SharePanel({
  subjectType,
  subjectId,
  initial,
}: {
  subjectType: string;
  subjectId: string;
  initial: ShareStatus;
}) {
  const [status, setStatus] = useState<ShareStatus>(initial);
  const [choice, setChoice] = useState<Visibility>(initial.requestedVisibility ?? "PRIVATE");
  const [pending, start] = useTransition();

  function run(fn: () => Promise<ShareStatus>) {
    start(async () => setStatus(await fn()));
  }

  if (!status.enabled) {
    return (
      <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4 text-brand" /> Sharing is private by default
        </div>
        <p className="mt-2 text-sm opacity-70">
          Your work is yours. Public sharing is being rolled out carefully with
          grown-up approval and safety checks, and isn&apos;t switched on yet.
        </p>
      </div>
    );
  }

  const req = status.requirement;
  const needsAck = req?.learnerAckRequired && status.reason === "awaiting_learner_acknowledgement";

  return (
    <div className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="flex items-center gap-2 font-semibold">
        <Eye className="h-4 w-4 text-brand" /> Who can see this?
      </div>

      <StateBadge status={status} />

      <label className="block text-sm">
        <span className="mb-1 block opacity-70">Ask to change to:</span>
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value as Visibility)}
          className="w-full rounded-lg border border-black/15 bg-transparent p-2 dark:border-white/15"
        >
          {ALL_VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {LABELS[v]}
            </option>
          ))}
        </select>
      </label>

      {req && req.approverRoles.length > 0 && (
        <p className="text-xs opacity-70">
          Needs approval from: {req.approverRoles.join(", ")}
          {req.humanReviewRequired && " · plus a safety review"}.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => requestShare(subjectType, subjectId, choice))}
          className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {choice === "PRIVATE" ? "Make private" : "Request"}
        </button>
        {needsAck && status.grantId && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => acknowledgeShare(status.grantId!))}
            className="rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold dark:border-white/15 disabled:opacity-50"
          >
            I understand — share it
          </button>
        )}
        {status.grantId && status.effectiveVisibility !== "PRIVATE" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => revokeShare(status.grantId!))}
            className="rounded-full border border-red-500/40 px-4 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
          >
            Make private now
          </button>
        )}
      </div>

      {status.moderationStatus === "blocked" && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <Ban className="h-3.5 w-3.5" /> Safety check found something to fix before this can be shared.
        </p>
      )}
    </div>
  );
}

function StateBadge({ status }: { status: ShareStatus }) {
  const map: Record<string, { icon: typeof Clock; text: string; cls: string }> = {
    APPROVED: { icon: ShieldCheck, text: `Live: ${status.effectiveVisibility}`, cls: "text-green-600" },
    PENDING: { icon: Clock, text: "Waiting for approval", cls: "text-amber-600" },
    REJECTED: { icon: Ban, text: "Not approved", cls: "text-red-600" },
    REVOKED: { icon: Lock, text: "Made private", cls: "text-gray-500" },
    EXPIRED: { icon: Lock, text: "Consent expired", cls: "text-gray-500" },
    PRIVATE: { icon: Lock, text: "Private — only you", cls: "text-gray-500" },
  };
  const s = map[status.state] ?? map.PRIVATE;
  const Icon = s.icon;
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${s.cls}`}>
      <Icon className="h-4 w-4" /> {s.text}
    </div>
  );
}
