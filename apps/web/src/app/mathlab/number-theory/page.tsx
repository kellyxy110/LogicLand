// Number Theory — divisibility, primes, modular arithmetic and the beauty of whole numbers (MathLab, ADR-030).
import { NumberTheoryLab } from "@/features/mathlab/NumberTheoryLab";

export const metadata = {
  title: "Number Theory · LogicLand",
  description: "Factor numbers, find GCD/LCM, explore modular arithmetic and sieve out primes — every step computed.",
};

export default function NumberTheoryPage() {
  return <NumberTheoryLab />;
}
