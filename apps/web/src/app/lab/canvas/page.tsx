// LogicLand Canvas (Lab) — Excalidraw freehand + a semantic layer that is now a
// GRAPH (ADR-025): link blocks with typed edges, reorder/duplicate, get an
// engine-backed explanation (deterministic fallback), and export to Markdown.
// Server shell around the client workspace (which dynamically loads the surface).
import { LogicCanvas } from "@/features/canvas/LogicCanvas";

export const metadata = {
  title: "Canvas · LogicLand",
  description:
    "A LogicLand canvas — draw freely, add code, equation, flow and note blocks, and connect them into a graph other tools can understand.",
};

export default function CanvasPage() {
  return <LogicCanvas />;
}
