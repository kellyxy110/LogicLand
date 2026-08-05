"use client";
// The Proof Workshop — build an argument step by step; the engine checks its
// structure live (ADR-015: rules validate, not an LLM). Start from a worked
// template, then edit: change statements, pick justification rules, and cite
// which earlier steps each line follows from.
import { Card } from "@logicland/ui";
import { CheckCircle2, Info, Plus, ScrollText, Share2, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PROOF_TEMPLATES,
  RULES,
  proofFromCanvasGraph,
  proofToGraph,
  validateProof,
  type Proof,
  type ProofStep,
  type StepKind,
} from "@/lib/engines/proof";
import { migrateDoc, toGraph, type CanvasDoc } from "@/lib/engines/canvas-doc";

const CANVAS_DOC_KEYS = ["logicland:canvas:doc:v2", "logicland:canvas:doc:v1"];

let counter = 0;
const newId = () => `p-${Date.now().toString(36)}-${++counter}`;

const KIND_LABEL: Record<StepKind, string> = {
  assumption: "Assumption",
  step: "Step",
  goal: "Goal",
};

export function ProofWorkshop() {
  const [proof, setProof] = useState<Proof>(() => structuredClone(PROOF_TEMPLATES[0]));

  const [importNote, setImportNote] = useState<string | null>(null);

  const validation = useMemo(() => validateProof(proof), [proof]);
  const byStep = useMemo(() => {
    const errs = new Map<string, string[]>();
    const warns = new Map<string, string[]>();
    for (const iss of validation.issues) {
      if (iss.stepId) errs.set(iss.stepId, [...(errs.get(iss.stepId) ?? []), iss.message]);
    }
    for (const w of validation.warnings) {
      if (w.stepId) warns.set(w.stepId, [...(warns.get(w.stepId) ?? []), w.message]);
    }
    return { errs, warns };
  }, [validation]);
  const generalIssues = validation.issues.filter((i) => !i.stepId);
  const generalWarnings = validation.warnings.filter((w) => !w.stepId);
  const graph = useMemo(() => proofToGraph(proof), [proof]);

  const loadTemplate = (id: string) => {
    const t = PROOF_TEMPLATES.find((p) => p.id === id);
    if (t) setProof(structuredClone(t));
  };

  // Import the learner's Canvas graph as a proof draft (ADR-025 seam). Reads the
  // autosaved canvas from localStorage — deterministic, offline, no network.
  const importFromCanvas = () => {
    setImportNote(null);
    try {
      let raw: string | null = null;
      for (const k of CANVAS_DOC_KEYS) {
        raw = window.localStorage.getItem(k);
        if (raw) break;
      }
      if (!raw) {
        setImportNote("No saved canvas found. Build one in the Canvas first, then import it here.");
        return;
      }
      const doc = migrateDoc(JSON.parse(raw) as Partial<CanvasDoc>);
      const g = toGraph(doc);
      if (g.nodes.length === 0) {
        setImportNote("Your canvas has no blocks to import yet.");
        return;
      }
      setProof(proofFromCanvasGraph(g, doc.title || "Imported from Canvas"));
      setImportNote(
        `Imported ${g.nodes.length} block${g.nodes.length === 1 ? "" : "s"} and ${g.edges.length} link${
          g.edges.length === 1 ? "" : "s"
        } — edit the steps and rules to finish the proof.`,
      );
    } catch {
      setImportNote("Couldn't read the saved canvas.");
    }
  };

  const patchStep = (id: string, patch: Partial<ProofStep>) =>
    setProof((p) => ({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const addStep = () =>
    setProof((p) => ({
      ...p,
      steps: [...p.steps, { id: newId(), kind: "step", statement: "", rule: "algebra", refs: [] }],
    }));

  const removeStep = (id: string) =>
    setProof((p) => ({
      ...p,
      steps: p.steps
        .filter((s) => s.id !== id)
        .map((s) => ({ ...s, refs: s.refs.filter((r) => r !== id) })),
    }));

  const toggleRef = (stepId: string, refId: string) =>
    setProof((p) => ({
      ...p,
      steps: p.steps.map((s) =>
        s.id === stepId
          ? { ...s, refs: s.refs.includes(refId) ? s.refs.filter((r) => r !== refId) : [...s.refs, refId] }
          : s,
      ),
    }));

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <ScrollText className="h-5 w-5 text-indigo-500" />
        <h1 className="font-display text-2xl font-extrabold">Proof Workshop</h1>
        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-indigo-500">
          {graph.nodes.length} steps · {graph.edges.length} links
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={importFromCanvas}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-brand/30 px-2.5 py-1 text-sm font-bold text-brand hover:border-brand/60"
          >
            <Share2 className="h-4 w-4" /> Import from Canvas
          </button>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <span className="opacity-60">Proof</span>
            <select
              value={proof.id.startsWith("p-") || proof.id.startsWith("from-canvas") ? "" : proof.id}
              onChange={(e) => e.target.value && loadTemplate(e.target.value)}
              className="rounded-lg border-2 border-brand/20 bg-transparent px-2 py-1 outline-none focus:border-brand"
            >
              <option value="">Custom / imported</option>
              {PROOF_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {importNote && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border-2 border-brand/20 bg-brand/5 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>{importNote}</span>
        </div>
      )}

      <Card className="mb-4 border-2 border-indigo-500/20 bg-indigo-500/5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Prove</p>
        <p className="mt-1 font-semibold">{proof.goal}</p>
      </Card>

      {/* Live validation */}
      <div className="mb-4 space-y-2">
        {validation.valid ? (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-meadow/40 bg-meadow/5 p-3 text-sm font-bold text-meadow">
            <CheckCircle2 className="h-5 w-5" /> Valid proof — every step follows, and you reached the goal.
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/5 p-3 text-sm">
            <p className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300">
              <TriangleAlert className="h-4 w-4" /> Not a complete proof yet
            </p>
            {generalIssues.length > 0 && (
              <ul className="mt-1 list-disc pl-5 opacity-80">
                {generalIssues.map((i, k) => (
                  <li key={k}>{i.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {/* Non-fatal hints — shown even when the proof is valid. */}
        {(generalWarnings.length > 0 || validation.warnings.some((w) => w.stepId)) && (
          <div className="rounded-2xl border border-sky-400/30 bg-sky-400/5 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-300">
              <Info className="h-3.5 w-3.5" /> Hints — optional, they will not block your proof
            </p>
            {generalWarnings.length > 0 && (
              <ul className="mt-1 list-disc pl-5 opacity-80">
                {generalWarnings.map((w, k) => (
                  <li key={k}>{w.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {proof.steps.map((s, i) => {
          const earlier = proof.steps.slice(0, i);
          const stepIssues = byStep.errs.get(s.id) ?? [];
          const stepWarnings = byStep.warns.get(s.id) ?? [];
          return (
            <li key={s.id}>
              <Card
                className={
                  stepIssues.length
                    ? "border-2 border-amber-400/40"
                    : stepWarnings.length
                      ? "border border-sky-400/30"
                      : ""
                }
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <select
                    value={s.kind}
                    onChange={(e) => patchStep(s.id, { kind: e.target.value as StepKind })}
                    className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs font-semibold outline-none dark:border-white/15"
                    aria-label={`Step ${i + 1} kind`}
                  >
                    {(["assumption", "step", "goal"] as StepKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={s.rule ?? ""}
                    onChange={(e) => patchStep(s.id, { rule: e.target.value })}
                    className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs outline-none dark:border-white/15"
                    aria-label={`Step ${i + 1} rule`}
                  >
                    {RULES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeStep(s.id)}
                    className="ml-auto rounded p-1 opacity-50 hover:text-rose-500 hover:opacity-100"
                    aria-label={`Delete step ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={s.statement}
                  onChange={(e) => patchStep(s.id, { statement: e.target.value })}
                  rows={2}
                  placeholder="Write this step…"
                  className="mt-2 w-full resize-none rounded-lg border border-black/10 bg-transparent p-2 text-sm outline-none focus:border-brand dark:border-white/15"
                />

                {s.kind !== "assumption" && earlier.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="opacity-55">Follows from:</span>
                    {earlier.map((e, ei) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => toggleRef(s.id, e.id)}
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          s.refs.includes(e.id)
                            ? "bg-brand text-white"
                            : "bg-black/5 opacity-70 dark:bg-white/10"
                        }`}
                      >
                        {ei + 1}
                      </button>
                    ))}
                  </div>
                )}

                {stepIssues.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-amber-600 dark:text-amber-300">
                    {stepIssues.map((m, k) => (
                      <li key={k}>• {m}</li>
                    ))}
                  </ul>
                )}
                {stepWarnings.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-sky-600 dark:text-sky-300">
                    {stepWarnings.map((m, k) => (
                      <li key={k}>◦ {m}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={addStep}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-brand/30 px-3 py-1.5 text-sm font-bold text-brand hover:border-brand/60"
      >
        <Plus className="h-4 w-4" /> Add a step
      </button>
    </main>
  );
}
