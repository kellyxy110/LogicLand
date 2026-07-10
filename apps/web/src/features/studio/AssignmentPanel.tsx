"use client";
// The take-home assessment panel. Below the guided classwork, the child gets an
// open-ended brief to build in their own studio and SUBMIT for the teacher to
// review next class. The checklist auto-checks their work as they go (friendly,
// never blocking), and submitting snapshots their files to the server.
import { motion } from "framer-motion";
import { Check, Circle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { submitAssignment } from "@/app/actions/submissions";
import { SpeakerButton } from "@/features/voice/SpeakerButton";
import { checkStep } from "@/lib/engines/html-lesson";
import type { StudioAssignment } from "@/types/studio";
import { useStudio } from "./useStudio";

const submittedKey = (slug: string) => `logicland:submitted:${slug}`;

export function AssignmentPanel({
  slug,
  assignment,
}: {
  slug: string;
  assignment: StudioAssignment;
}) {
  const nodes = useStudio((s) => s.nodes);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [error, setError] = useState<"unauthenticated" | "error" | null>(null);

  // Remember a prior submission so returning shows the submitted state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSubmittedAt(window.localStorage.getItem(submittedKey(slug)));
  }, [slug]);

  const results = assignment.checklist.map((item) => ({
    label: item.instruction,
    passed: checkStep(nodes, item.check),
  }));
  const metCount = results.filter((r) => r.passed).length;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const files = nodes
        .filter((n) => n.kind === "file")
        .map((n) => ({ name: n.name, content: n.content }));
      const res = await submitAssignment({
        missionSlug: slug,
        title: assignment.title,
        code: files,
        checklist: results,
      });
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(submittedKey(slug), res.submittedAt);
      }
      setSubmittedAt(res.submittedAt);
    } catch {
      // Network/unexpected — the work is still in the browser; let them retry.
      setError("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-dashed border-sky/40 bg-sky/5 p-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-sky/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-sky">
          Homework
        </span>
        <h3 className="font-display text-lg font-extrabold">{assignment.title}</h3>
        <SpeakerButton text={`Homework. ${assignment.brief}`} label="Hear the homework" size="sm" className="ml-auto" />
      </div>
      <p className="mt-1 text-sm font-semibold opacity-80">{assignment.brief}</p>

      <ul className="mt-3 space-y-1">
        {results.map((r, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 text-sm ${
              r.passed ? "font-semibold text-meadow" : "opacity-70"
            }`}
          >
            {r.passed ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-meadow text-white">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <Circle className="h-4 w-4 opacity-40" aria-hidden />
            )}
            {r.label}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-full bg-sky px-5 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting
            ? "Sending…"
            : submittedAt
              ? "Submit again"
              : "Submit for class"}
        </button>
        <span className="text-xs font-semibold opacity-60">
          {metCount} of {results.length} done
        </span>
      </div>

      {submittedAt && !error && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-meadow"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Submitted! Your
          teacher will see it next class. You can keep editing and submit again.
        </motion.p>
      )}
      {error && (
        <p className="mt-2 text-sm font-semibold text-red-500">
          {error === "unauthenticated"
            ? "Please sign in to hand in your work — then tap Submit again. Your code is safe."
            : "We couldn't save that just now. Your work is safe — please tap Submit to try again."}
        </p>
      )}
    </section>
  );
}
