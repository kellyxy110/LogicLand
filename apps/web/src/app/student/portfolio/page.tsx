// "My Work" — the learner's private in-app portfolio. Under the Clerk-gated
// /student area, so it's visible only to the signed-in learner (no public URL).
import { MyWork } from "@/features/portfolio/MyWork";

export const metadata = {
  title: "My Work · LogicLand",
  description: "Everything you've built and mastered in LogicLand, in one place.",
};

export default function PortfolioPage() {
  return <MyWork />;
}
