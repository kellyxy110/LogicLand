"use client";
// Client list for reviewing studio submissions. Expand a row to see the child's
// code (rendered as plain text — never executed), the auto-check results, and a
// box to leave feedback and mark it reviewed. Optimistically updates the row.
import { Check, ChevronDown, Circle } from "lucide-react";
import { useState } from "react";
import type { StudioSubmissionView } from "@logicland/database";
import { reviewSubmission } from "@/app/actions/submissions";

export function SubmissionReview({
  initial,
}: {
  initial: StudioSubmissionView[];
}) {
  const [items, setItems] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center opacity-70 dark:border-white/15">
        No submissions yet. When a student taps “Submit for class”, it lands here.
      </div>
    );
  }

  function onReviewed(id: string, feedback: string) {
    setItems((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "REVIEWED", feedback } : s,
      ),
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li
          key={s.id}
          className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10"
        >
          <button
            type="button"
            onClick={() => setOpenId(openId === s.id ? null : s.id)}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {s.studentName} · {s.title}
              </p>
              <p className="text-xs opacity-60">
                {new Date(s.submittedAt).toLocaleString()} ·{" "}
                {s.checklist.filter((c) => c.passed).length}/{s.checklist.length}{" "}
                checks met
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                s.status === "REVIEWED"
                  ? "bg-meadow/15 text-meadow"
                  : "bg-sunburst/15 text-sunburst"
              }`}
            >
              {s.status === "REVIEWED" ? "Reviewed" : "New"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${openId === s.id ? "rotate-180" : ""}`}
            />
          </button>

          {openId === s.id && (
            <div className="border-t border-black/10 p-4 dark:border-white/10">
              <Checklist checklist={s.checklist} />
              <CodeFiles code={s.code} />
              <ReviewBox
                id={s.id}
                initialFeedback={s.feedback ?? ""}
                reviewed={s.status === "REVIEWED"}
                onReviewed={onReviewed}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Checklist({
  checklist,
}: {
  checklist: StudioSubmissionView["checklist"];
}) {
  return (
    <ul className="mb-3 space-y-1 text-sm">
      {checklist.map((c, i) => (
        <li
          key={i}
          className={`flex items-center gap-2 ${c.passed ? "text-meadow" : "opacity-60"}`}
        >
          {c.passed ? (
            <Check className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4 opacity-40" />
          )}
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function CodeFiles({ code }: { code: StudioSubmissionView["code"] }) {
  if (code.length === 0) {
    return <p className="mb-3 text-sm opacity-60">No files were submitted.</p>;
  }
  return (
    <div className="mb-3 space-y-2">
      {code.map((f, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <div className="bg-black/[0.03] px-3 py-1.5 text-xs font-bold dark:bg-white/5">
            {f.name}
          </div>
          <pre className="max-h-56 overflow-auto p-3 text-xs leading-relaxed">
            <code>{f.content || "(empty)"}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}

function ReviewBox({
  id,
  initialFeedback,
  reviewed,
  onReviewed,
}: {
  id: string;
  initialFeedback: string;
  reviewed: boolean;
  onReviewed: (id: string, feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await reviewSubmission(id, feedback);
      onReviewed(id, feedback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label htmlFor={`fb-${id}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-60">
        Feedback for the student
      </label>
      <textarea
        id={`fb-${id}`}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Great use of headings! Next time, try adding a picture."
        className="w-full rounded-xl border border-black/10 bg-transparent p-2 text-sm outline-none focus:border-brand dark:border-white/15"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        {saving ? "Saving…" : reviewed ? "Update feedback" : "Mark reviewed"}
      </button>
    </div>
  );
}
