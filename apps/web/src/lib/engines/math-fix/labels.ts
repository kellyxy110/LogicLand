// Math Fix™ — misconception id → friendly label, gathered from every topic.
// The dashboards store a misconception id (data), and render its human name
// here, so a teacher sees "Skipped the multiply" rather than a slug.
import { misconceptionLibrary } from "./diagnose";
import { ORDER_MISCONCEPTIONS } from "./topics/order-of-operations";
import { FRACTION_MISCONCEPTIONS } from "./topics/fractions-of-amount";

const LABELS: Record<string, string> = Object.fromEntries(
  [
    ...misconceptionLibrary(),
    ...ORDER_MISCONCEPTIONS,
    ...FRACTION_MISCONCEPTIONS,
  ].map((m) => [m.id, m.name]),
);

/** The friendly name for a misconception id, or null if unknown/absent. */
export function misconceptionLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return LABELS[id] ?? null;
}
