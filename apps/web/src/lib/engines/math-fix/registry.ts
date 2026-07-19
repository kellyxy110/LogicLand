// Math Fix™ topic registry — the single list the picker, routing and UI read.
// Add a topic here and it appears everywhere; nothing else needs to change.
import type { MathTopic } from "./types";
import { LINEAR_EQUATIONS } from "./topics/linear-equations";
import { ORDER_OF_OPERATIONS } from "./topics/order-of-operations";

export const MATH_TOPICS: MathTopic[] = [LINEAR_EQUATIONS, ORDER_OF_OPERATIONS];

export function mathTopicById(id: string): MathTopic | undefined {
  return MATH_TOPICS.find((t) => t.id === id);
}
