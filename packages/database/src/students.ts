// Server-side data access for student state. Kept in the database package so
// the persistence shape lives next to the schema. Callers pass identity from
// Clerk (the web app); this module owns the Prisma reads/writes.
import { prisma } from "./index";
import type { Student } from "@prisma/client";

export interface EnsureUserInput {
  clerkId: string;
  email: string;
  name: string;
  role?: "TEACHER" | "PARENT" | "STUDENT" | "ADMIN";
}

/** Upsert the Clerk-authenticated user and ensure a Student profile exists. */
export async function ensureStudent(input: EnsureUserInput): Promise<Student> {
  const role = input.role ?? "STUDENT";
  const user = await prisma.user.upsert({
    where: { clerkId: input.clerkId },
    update: { email: input.email, name: input.name },
    create: {
      clerkId: input.clerkId,
      email: input.email,
      name: input.name,
      role,
    },
  });

  return prisma.student.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, displayName: input.name },
  });
}

export interface StudentTotals {
  xp: number;
  coins: number;
  stars: number;
  level: number;
  completedMissions: string[];
  earnedBadges: string[];
}

/** Persist the result of a mission completion. */
export async function saveMissionCompletion(
  studentId: string,
  totals: StudentTotals,
): Promise<Student> {
  return prisma.student.update({
    where: { id: studentId },
    data: {
      xp: totals.xp,
      coins: totals.coins,
      stars: totals.stars,
      level: totals.level,
      completedMissions: totals.completedMissions,
      earnedBadges: totals.earnedBadges,
      lastActiveOn: new Date(),
    },
  });
}
