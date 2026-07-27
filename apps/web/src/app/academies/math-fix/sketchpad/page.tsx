// MathLab Sketchpad — a Visual Math canvas (Excalidraw) with deterministic Math
// Fix feedback in place. Server Component shell around the client canvas app.
import { MathSketchpad } from "@/features/math-fix/MathSketchpad";

export const metadata = {
  title: "Math Sketchpad · LogicLand",
  description:
    "Work maths out by hand on a canvas, then get Math Fix's exact feedback in place — what you missed and how to repair it.",
};

export default function SketchpadPage() {
  return <MathSketchpad />;
}
