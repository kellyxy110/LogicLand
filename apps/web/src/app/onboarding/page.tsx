"use client";
// "Who's exploring today?" — the one-time role picker shown to fresh sign-ups.
// Choosing writes the role to Clerk and forwards to that role's home.
import { Card, CardTitle, RoboAvatar } from "@logicland/ui";
import { GraduationCap, Rocket, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setRole } from "@/app/actions/onboarding";
import type { Role } from "@logicland/shared";

const CHOICES: {
  role: Role;
  title: string;
  blurb: string;
  icon: typeof Rocket;
}[] = [
  {
    role: "STUDENT",
    title: "I'm an Explorer",
    blurb: "Meet Robo and start your coding adventure.",
    icon: Rocket,
  },
  {
    role: "PARENT",
    title: "I'm a Parent",
    blurb: "Follow your child's progress and celebrate wins.",
    icon: Users,
  },
  {
    role: "TEACHER",
    title: "I'm a Teacher",
    blurb: "Run your classroom and create magical lessons.",
    icon: GraduationCap,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: Role) {
    setBusy(role);
    setError(null);
    try {
      const { home } = await setRole(role);
      router.push(home);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <RoboAvatar mood="happy" size={88} />
      <div>
        <h1 className="font-display text-4xl font-extrabold">
          Who&apos;s exploring today?
        </h1>
        <p className="mt-2 text-lg opacity-70">Pick the one that fits you.</p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {CHOICES.map((c) => (
          <button
            key={c.role}
            type="button"
            disabled={busy !== null}
            onClick={() => choose(c.role)}
            className="text-left disabled:opacity-60"
          >
            <Card className="h-full transition hover:scale-[1.03] hover:shadow-lg">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                <c.icon className="h-6 w-6" />
              </span>
              <CardTitle>{c.title}</CardTitle>
              <p className="mt-1 text-sm opacity-70">{c.blurb}</p>
              {busy === c.role && (
                <p className="mt-3 text-sm font-semibold text-brand">
                  Setting up…
                </p>
              )}
            </Card>
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
    </main>
  );
}
