"use client";
// Lets a learner (or parent) choose the presentation level. Also the age-based
// onboarding surface: it explains each mode. Persists via the provider.
import { Card } from "@logicland/ui";
import { GraduationCap } from "lucide-react";
import { AGE_MODES } from "@/lib/age-mode";
import { useAgeMode } from "./AgeModeProvider";

export function AgeModeSwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useAgeMode();

  if (compact) {
    return (
      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <GraduationCap className="h-4 w-4 text-brand" aria-hidden />
        <span className="opacity-60">Level</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          className="rounded-lg border-2 border-brand/20 bg-transparent px-2 py-1 font-semibold outline-none focus:border-brand"
          aria-label="Learning level"
        >
          {AGE_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {m.ages}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {AGE_MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button key={m.id} type="button" onClick={() => setMode(m.id)} className="text-left">
            <Card
              className={`h-full border-2 transition-colors ${
                active ? "border-brand bg-brand/5" : "border-transparent hover:border-brand/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold">{m.label}</h3>
                <span className="text-xs font-bold opacity-55">{m.ages}</span>
              </div>
              <p className="mt-1 text-sm opacity-70">{m.blurb}</p>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
