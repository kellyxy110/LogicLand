// Calculus Visualizer — limits, gradients, areas under curves, made visual (MathLab, ADR-032).
import { CalculusVisualizer } from "@/features/mathlab/CalculusVisualizer";

export const metadata = {
  title: "Calculus Visualizer · LogicLand",
  description: "See a tangent line's slope, watch a Riemann sum converge on an area, and approach a limit from both sides.",
};

export default function CalculusVisualizerPage() {
  return <CalculusVisualizer />;
}
