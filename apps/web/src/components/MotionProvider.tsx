"use client";
// Respects the OS "reduce motion" setting for every Framer Motion animation in
// the app. With reducedMotion="user", transforms that move things are dialed
// back automatically while opacity fades are kept — motion-sensitive children
// (and their grown-ups) get a calm experience without us touching each animation.
import { MotionConfig } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
