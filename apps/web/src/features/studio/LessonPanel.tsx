"use client";
// Robo's HTML class. Shows the current step, a hint, and a checklist that ticks
// off as the child builds their project. Every instruction can be read aloud, so
// a pre-reader can still follow the class.
import { RoboAvatar } from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { SpeakerButton } from "@/features/voice/SpeakerButton";
import type { HtmlLessonStep } from "@/types/studio";

export function LessonPanel({
  steps,
  currentIndex,
}: {
  steps: HtmlLessonStep[];
  currentIndex: number;
}) {
  const complete = currentIndex >= steps.length;
  const step = complete ? null : steps[currentIndex];
  const speech = complete
    ? "You built your first web page! You're a real coder now! 🎉"
    : (step?.instruction ?? "");

  return (
    <div className="rounded-2xl bg-brand/5 p-4">
      <div className="flex items-start gap-3">
        <RoboAvatar mood={complete ? "happy" : "thinking"} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-brand">
              {complete ? "Class complete!" : `Step ${currentIndex + 1} of ${steps.length}`}
            </span>
            <SpeakerButton text={speech} label="Hear the instruction" size="sm" className="ml-auto" />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={speech}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-0.5 text-base font-bold"
            >
              {speech}
            </motion.p>
          </AnimatePresence>
          {step && (
            <p className="mt-1 text-sm opacity-70">💡 {step.hint}</p>
          )}
        </div>
      </div>

      {/* Checklist */}
      <ol className="mt-3 space-y-1">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={s.id}
              className={`flex items-center gap-2 text-sm ${
                done ? "text-meadow" : active ? "font-bold text-brand" : "opacity-50"
              }`}
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-full ${
                  done ? "bg-meadow text-white" : "border-2 border-current"
                }`}
              >
                {done && <Check className="h-3 w-3" />}
              </span>
              {s.instruction}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
