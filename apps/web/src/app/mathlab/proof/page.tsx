// Proof Workshop — build and structurally validate a proof (MathLab).
import { ProofWorkshop } from "@/features/proof/ProofWorkshop";

export const metadata = {
  title: "Proof Workshop · LogicLand",
  description:
    "Build a mathematical argument step by step — assumptions, reasoning and a goal — and have its structure checked as you go.",
};

export default function ProofWorkshopPage() {
  return <ProofWorkshop />;
}
