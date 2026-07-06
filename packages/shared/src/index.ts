// Cross-cutting types, constants, and Zod schemas shared by web + (typed) API calls.
export const ROLES = ["TEACHER", "PARENT", "STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const APP_NAME = "LogicLand";
export const TAGLINE = "Think Clearly. Build Boldly. Create Fearlessly.";

// Base URL of the FastAPI intelligence engine.
export const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8000";
