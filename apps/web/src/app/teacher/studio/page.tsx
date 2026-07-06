"use client";
// Generator Studio — teachers AI-draft learning materials, then approve.
// Every generator is *draft-then-approve*: the AI proposes, the teacher edits
// and confirms. Reuses the live engine endpoints /generate/{worksheet,quiz,flashcards}.
import { Button, Card, CardTitle, Skeleton } from "@logicland/ui";
import { Check, Copy, Wand2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  engine,
  type FlashcardDeck,
  type Journey,
  type Quiz,
  type Worksheet,
} from "@/lib/engine";

type Kind = "worksheet" | "quiz" | "flashcards";
type Result =
  | { kind: "worksheet"; data: Worksheet }
  | { kind: "quiz"; data: Quiz }
  | { kind: "flashcards"; data: FlashcardDeck };

const TABS: { kind: Kind; label: string }[] = [
  { kind: "worksheet", label: "Worksheet" },
  { kind: "quiz", label: "Quiz" },
  { kind: "flashcards", label: "Flashcards" },
];

export default function GeneratorStudio() {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [kind, setKind] = useState<Kind>("worksheet");
  const [missionSlug, setMissionSlug] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    engine.getJourney().then((j) => {
      setJourney(j);
      const first = j.worlds[0]?.missions[0];
      if (first) setMissionSlug(first.slug);
    });
  }, []);

  const missions = journey?.worlds.flatMap((w) => w.missions) ?? [];
  const skill = missions.find((m) => m.slug === missionSlug)?.skill ?? "Loops";

  async function generate() {
    if (busy || !missionSlug) return;
    setBusy(true);
    setApproved(false);
    setResult(null);
    const body = { mission_slug: missionSlug, skill, difficulty, count };
    try {
      if (kind === "worksheet") {
        setResult({ kind, data: await engine.generateWorksheet(body) });
      } else if (kind === "quiz") {
        setResult({ kind, data: await engine.generateQuiz(body) });
      } else {
        setResult({ kind, data: await engine.generateFlashcards(body) });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!journey) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="h-64" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Generator Studio</h1>
        <Link href="/teacher" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.kind}
            onClick={() => {
              setKind(t.kind);
              setResult(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              kind === t.kind
                ? "bg-brand text-white"
                : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Mission</span>
            <select
              value={missionSlug}
              onChange={(e) => setMissionSlug(e.target.value)}
              className="w-full rounded-xl bg-black/5 px-3 py-2 dark:bg-white/10"
            >
              {missions.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.title} · {m.skill}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full rounded-xl bg-black/5 px-3 py-2 dark:bg-white/10"
            >
              <option value={1}>1 · Gentle</option>
              <option value={2}>2 · Growing</option>
              <option value={3}>3 · Challenge</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">How many ({count})</span>
            <input
              type="range"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </label>
          <div className="flex items-end">
            <Button onClick={generate} disabled={busy} className="w-full">
              <Wand2 className="h-4 w-4" />
              {busy ? "Drafting…" : "Generate Draft"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Result */}
      {busy && <Skeleton className="h-48" />}
      {result && !busy && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>{titleOf(result)}</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(result)}
                className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 dark:bg-white/10"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <Button
                size="sm"
                variant={approved ? "secondary" : "primary"}
                onClick={() => setApproved(true)}
              >
                <Check className="h-4 w-4" />
                {approved ? "Approved" : "Approve"}
              </Button>
            </div>
          </div>
          <ResultView result={result} />
          <p className="mt-4 text-xs opacity-60">
            Draft-then-approve: review and edit before sharing with students.
          </p>
        </Card>
      )}

      {!result && !busy && (
        <p className="text-center text-sm opacity-60">
          Pick a mission and press <strong>Generate Draft</strong> to begin.
        </p>
      )}
    </main>
  );
}

function titleOf(r: Result): string {
  return r.data.title;
}

function ResultView({ result }: { result: Result }) {
  if (result.kind === "worksheet") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        {result.data.items.map((it, i) => (
          <li key={i}>
            {it.prompt}
            {it.answer && (
              <span className="ml-2 opacity-60">→ {it.answer}</span>
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (result.kind === "quiz") {
    return (
      <ol className="list-decimal space-y-4 pl-5">
        {result.data.questions.map((q, i) => (
          <li key={i}>
            <p className="font-semibold">{q.question}</p>
            <ul className="mt-1 space-y-1">
              {q.options.map((o, oi) => (
                <li
                  key={oi}
                  className={
                    oi === q.correct_index
                      ? "font-semibold text-meadow"
                      : "opacity-80"
                  }
                >
                  {oi === q.correct_index ? "✓ " : "• "}
                  {o}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {result.data.cards.map((c, i) => (
        <div
          key={i}
          className="rounded-2xl border border-black/10 p-4 dark:border-white/10"
        >
          <p className="font-semibold">{c.front}</p>
          <p className="mt-1 opacity-70">{c.back}</p>
        </div>
      ))}
    </div>
  );
}

function copy(result: Result) {
  const text = JSON.stringify(result.data, null, 2);
  void navigator.clipboard?.writeText(text);
}
