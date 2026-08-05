// Statistics Lab — averages, spread, probability and simulations you can run and see (MathLab, ADR-031).
import { StatisticsLab } from "@/features/mathlab/StatisticsLab";

export const metadata = {
  title: "Statistics Lab · LogicLand",
  description: "Mean, median, mode and spread; exact probability; and a seeded simulator — every number computed.",
};

export default function StatisticsLabPage() {
  return <StatisticsLab />;
}
