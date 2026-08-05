// Graph Explorer — plot and explore functions of x (MathLab, ADR-027).
import { GraphExplorer } from "@/features/mathlab/GraphExplorer";

export const metadata = {
  title: "Graph Explorer · LogicLand",
  description:
    "Type a function of x and watch it come alive — plot lines, curves and waves, and see where they cross zero.",
};

export default function GraphExplorerPage() {
  return <GraphExplorer />;
}
