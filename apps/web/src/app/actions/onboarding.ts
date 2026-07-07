"use server";
// Onboarding: let a newly signed-up user declare who they are. We write the
// choice to Clerk publicMetadata (role + onboarded flag); the Clerk->Prisma
// webhook then mirrors the role into the database. Kids created by a teacher or
// parent skip this — it only runs for self-serve sign-ups.
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ROLE_HOME } from "@logicland/auth";
import type { Role } from "@logicland/shared";

const CHOOSABLE: Role[] = ["STUDENT", "PARENT", "TEACHER"];

/** Persist the caller's chosen role and return the dashboard to land on. */
export async function setRole(role: Role): Promise<{ home: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!CHOOSABLE.includes(role)) throw new Error(`Invalid role: ${role}`);

  // clerkClient is an object in early v5 and an async factory in v5.7+.
  const client =
    typeof clerkClient === "function" ? await clerkClient() : clerkClient;
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role, onboarded: true },
  });

  return { home: ROLE_HOME[role] };
}
