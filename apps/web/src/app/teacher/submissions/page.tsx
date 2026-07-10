// Teacher: review the coding homework students hand in from the studio. Server
// Component reads every submission (newest first); the client list handles
// expanding a submission, viewing the code safely as text, and marking it
// reviewed with feedback. Gated to TEACHER by teacher/layout.
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { listStudioSubmissions } from "@logicland/database";
import { SubmissionReview } from "./SubmissionReview";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  // Resilient: if the submissions table isn't provisioned yet (pre-migration),
  // show an empty list rather than 500ing the page.
  const submissions = await listStudioSubmissions().catch(() => []);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/teacher"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold">Coding Submissions</h1>
        <p className="opacity-70">
          Homework your students built in the studio and handed in. Open one to
          see their code and leave feedback.
        </p>
      </header>

      <SubmissionReview initial={submissions} />
    </main>
  );
}
