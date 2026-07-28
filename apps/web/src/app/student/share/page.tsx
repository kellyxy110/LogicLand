// Consent-gated sharing (ADR-020). Under the Clerk-gated /student area. The panel
// shows the private-by-default state unless the SHARING_ENABLED flag is on; even
// then a public visibility only goes live once consent + moderation clear.
import { SharePanel } from "@/features/sharing/SharePanel";
import { shareStatus } from "@/app/actions/sharing";
import { currentStudent } from "@/lib/current-student";

export const metadata = {
  title: "Share my work · LogicLand",
  description: "Choose who can see your project — private by default, with grown-up approval for anything public.",
};

export default async function SharePage() {
  const student = await currentStudent();
  const subjectType = "studio_project";
  const subjectId = student.id; // one Studio workspace per learner
  const initial = await shareStatus(subjectType, subjectId);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-extrabold">Share my work</h1>
      <p className="mb-6 text-sm opacity-70">
        Your work is private by default. You can ask a grown-up to help you share it.
      </p>
      <SharePanel subjectType={subjectType} subjectId={subjectId} initial={initial} />
    </div>
  );
}
