// The skill map (ADR-011/017) — the concept dependency graph, lit up by real
// evidence. A Server Component shell around the client map (which fetches the
// learner's mastery for personalisation).
import { SkillMap } from "@/features/skills/SkillMap";

export const metadata = {
  title: "Skill Map · LogicLand",
  description:
    "Your LogicLand skill map — the concepts across Programming, Mathematics and AI, and how they build on each other. Skills light up as you prove them.",
};

export default function SkillsPage() {
  return <SkillMap />;
}
