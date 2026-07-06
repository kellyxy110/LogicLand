// Server-only auth helpers (Clerk). Import from "@logicland/auth/server".
//
// Roles live in Clerk publicMetadata.role and are mirrored into Prisma on first
// sight (see the web app's student/teacher server actions). A signed-in user
// with no explicit role defaults to STUDENT so nobody hits a dead-end.
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@logicland/shared";
import { ROLE_HOME } from "./index";

export type { Role };

/** The full Clerk user object (or null when signed out). */
export async function getCurrentUser() {
  return currentUser();
}

/** Resolve the caller's app role, defaulting to STUDENT when unset. */
export async function getCurrentRole(): Promise<Role | null> {
  const user = await currentUser();
  if (!user) return null;
  const raw = String(user.publicMetadata?.role ?? "").toUpperCase();
  if (raw === "TEACHER" || raw === "PARENT" || raw === "ADMIN") return raw as Role;
  return "STUDENT";
}

/** Gate a route to one or more roles. Redirects to sign-in or the caller's own
 *  home if they don't belong here. Call at the top of a layout/page. */
export async function requireRole(allowed: Role[]): Promise<Role> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const role = (await getCurrentRole()) ?? "STUDENT";
  if (!allowed.includes(role)) redirect(ROLE_HOME[role]);
  return role;
}
