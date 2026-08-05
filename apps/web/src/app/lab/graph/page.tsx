// Project Graph (Lab) — one cross-artifact map of a learner's work (ADR-026). A
// server shell around the client view, which reads the autosaved Canvas + Proof
// from localStorage and renders their merged dependency graph.
import { ProjectGraphView } from "@/features/project-graph/ProjectGraphView";

export const metadata = {
  title: "Project Graph · LogicLand",
  description:
    "See how your work fits together — the blocks, proofs and ideas you've connected, drawn as one dependency map.",
};

export default function ProjectGraphPage() {
  return <ProjectGraphView />;
}
