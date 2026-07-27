// Connect GitHub — link a repo and push your Studio project (ADR-022).
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GitHubPanel } from "@/features/github/GitHubPanel";

export const metadata = {
  title: "GitHub · LogicLand Studio",
  description: "Connect GitHub and push your LogicLand Studio project to a real repository.",
};

export default function GitHubPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/studio" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Studio
      </Link>
      <h1 className="mb-1 mt-2 font-display text-2xl font-extrabold">GitHub</h1>
      <p className="mb-5 text-sm opacity-70">
        Connect your GitHub account and push your project to a real repository — the same
        workflow professional developers use.
      </p>
      <GitHubPanel />
    </main>
  );
}
