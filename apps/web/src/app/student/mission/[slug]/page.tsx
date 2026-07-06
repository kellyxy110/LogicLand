"use client";
// Mission player — the heart of the student experience. Walks the child through
// Story → Objective → Activity → Challenge → Project → Homework, then completes
// the mission: awards XP/coins/stars/badges (via the engine) and celebrates.
import {
  Button,
  Card,
  CardTitle,
  RewardBurst,
  RoboAvatar,
  Skeleton,
} from "@logicland/ui";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AiHelper } from "@/components/AiHelper";
import { engine, type MissionDetail, type MissionReward } from "@/lib/engine";
import { useStudent } from "@/lib/student-store";

type StepKey =
  | "story"
  | "objective"
  | "activity"
  | "challenge"
  | "project"
  | "homework";

const STEPS: { key: StepKey; label: string; robo: "idle" | "thinking" | "happy" }[] = [
  { key: "story", label: "The Story", robo: "idle" },
  { key: "objective", label: "Your Goal", robo: "idle" },
  { key: "activity", label: "Let's Play", robo: "thinking" },
  { key: "challenge", label: "Challenge", robo: "thinking" },
  { key: "project", label: "Build It", robo: "happy" },
  { key: "homework", label: "Take Home", robo: "happy" },
];

export default function MissionPlayer() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { state, completeMission, ready } = useStudent();
  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [step, setStep] = useState(0);
  const [reward, setReward] = useState<MissionReward | null>(null);
  const [burst, setBurst] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    engine.getMission(slug).then(setMission).catch(() => setMission(null));
  }, [slug]);

  const alreadyDone = useMemo(
    () => ready && state.completedMissions.includes(slug),
    [ready, state.completedMissions, slug],
  );

  if (!mission) return <MissionSkeleton />;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function finish() {
    if (saving || !mission) return;
    setSaving(true);
    try {
      // The server action computes the reward (engine) and persists (Prisma).
      const r = await completeMission(mission.slug);
      setReward(r);
      setBurst(true);
      setTimeout(() => setBurst(false), 900);
    } finally {
      setSaving(false);
    }
  }

  if (reward) {
    return (
      <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-5 text-center">
        <RewardBurst show={burst} />
        <div>
          <RoboAvatar mood="happy" size={120} className="mx-auto" />
          <h1 className="mt-4 font-display text-4xl font-extrabold">
            Mission Complete! 🎉
          </h1>
          <p className="mt-2 text-lg opacity-80">You earned the {mission.badge} badge!</p>
          <div className="mt-6 flex justify-center gap-6 font-display text-xl font-bold">
            <span className="text-brand">+{reward.xp_awarded} XP</span>
            <span className="text-sunburst">+{reward.stars_awarded} ⭐</span>
            <span className="text-sunburst">+{reward.coins_awarded} 🪙</span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => router.push("/student")}>Back to Map</Button>
            <Link href="/student/achievements">
              <Button variant="secondary">See Badges</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/student" className="text-sm text-brand hover:underline">
          ← Map
        </Link>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-2 w-2 rounded-full ${
                i <= step ? "bg-brand" : "bg-black/15 dark:bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      <h1 className="mb-1 font-display text-2xl font-extrabold">{mission.title}</h1>
      <p className="mb-6 text-sm font-semibold text-brand">{mission.skill}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <div className="mb-3 flex items-center gap-3">
              <RoboAvatar mood={current.robo} size={48} />
              <CardTitle>{current.label}</CardTitle>
            </div>
            <p className="text-lg leading-relaxed">{mission[current.key]}</p>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </Button>
        {isLast ? (
          <Button size="lg" onClick={finish} disabled={saving}>
            {alreadyDone ? "Play Again" : saving ? "Saving…" : "Finish Mission 🎉"}
          </Button>
        ) : (
          <Button size="lg" onClick={() => setStep((s) => s + 1)}>
            Next →
          </Button>
        )}
      </div>

      <AiHelper missionSlug={mission.slug} />
    </main>
  );
}

function MissionSkeleton() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Skeleton className="mb-6 h-6 w-40" />
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="h-48" />
    </main>
  );
}
