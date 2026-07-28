"use client";
// Parent approval surface (ADR-020). Lists pending share requests for this
// parent's children and lets them approve or reject. Decisions call decideShare
// with the PARENT role; a rejection is final for an under-13 (enforced by the
// policy engine server-side). This UI never decides policy — it records a
// verified adult's decision.
import { useState, useTransition } from "react";
import { ShieldCheck, X, Clock } from "lucide-react";
import { decideShare, type ShareStatus } from "@/app/actions/sharing";
import type { PendingApproval } from "@logicland/database";

const VIS_LABEL: Record<string, string> = {
  UNLISTED_PORTFOLIO: "an unlisted link",
  ANONYMOUS_SHOWCASE: "an anonymous showcase",
  PUBLIC_SHOWCASE: "a public showcase",
  COMPETITION_SHOWCASE: "a competition showcase",
  CLASSROOM: "their classroom",
  SCHOOL: "their school",
};

export function ApprovalQueue({ initial }: { initial: PendingApproval[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();

  function decide(grantId: string, approved: boolean) {
    start(async () => {
      const res: ShareStatus = await decideShare(grantId, "PARENT", approved);
      // Drop the item once decided (it leaves the pending queue either way).
      if (res.state !== "PENDING") setItems((xs) => xs.filter((x) => x.grantId !== grantId));
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 p-5 text-sm opacity-70 dark:border-white/10">
        <Clock className="mb-1 inline h-4 w-4" /> No sharing requests are waiting for your approval.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li
          key={it.grantId}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{it.studentName}</p>
            <p className="text-sm opacity-70">
              wants to share their work as {VIS_LABEL[it.requestedVisibility] ?? it.requestedVisibility}.
              {it.moderationStatus === "blocked" && (
                <span className="ml-1 text-red-600">Safety check flagged something to fix first.</span>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={pending || it.moderationStatus === "blocked"}
            onClick={() => decide(it.grantId, true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <ShieldCheck className="h-4 w-4" /> Approve
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => decide(it.grantId, false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-1.5 text-sm font-semibold dark:border-white/15 disabled:opacity-40"
          >
            <X className="h-4 w-4" /> Not yet
          </button>
        </li>
      ))}
    </ul>
  );
}
