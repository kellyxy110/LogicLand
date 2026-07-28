// Parent approval queue (ADR-020). Under the Clerk-gated /parent area. Shows
// pending share requests from this parent's children. Empty (and inert) while
// SHARING_ENABLED is off — myPendingApprovals returns [] behind the flag.
import { ApprovalQueue } from "@/features/sharing/ApprovalQueue";
import { myPendingApprovals } from "@/app/actions/sharing";
import { SHARING_ENABLED } from "@/lib/flags";

export const metadata = {
  title: "Sharing approvals · LogicLand",
  description: "Review and approve your child's requests to share their work.",
};

export default async function ParentApprovalsPage() {
  const pending = await myPendingApprovals();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Sharing approvals</h1>
      <p className="mb-6 text-sm opacity-70">
        Your child&apos;s work is private by default. When they ask to share it more
        widely, you decide here. You can change your mind any time.
      </p>
      {!SHARING_ENABLED ? (
        <div className="rounded-2xl border border-black/10 p-5 text-sm opacity-70 dark:border-white/10">
          Public sharing is being rolled out carefully and isn&apos;t switched on yet.
        </div>
      ) : (
        <ApprovalQueue initial={pending} />
      )}
    </div>
  );
}
