// LogicLand Canvas (Lab) — Excalidraw freehand + a semantic-block layer with
// autosave, versions and safe export. Server shell around the client workspace
// (which dynamically loads the drawing surface).
import { LogicCanvas } from "@/features/canvas/LogicCanvas";

export const metadata = {
  title: "Canvas · LogicLand",
  description:
    "A LogicLand canvas — draw freely and add code, equation, flow and note blocks that other tools can understand.",
};

export default function CanvasPage() {
  return <LogicCanvas />;
}
