// Post-login router. Clerk sends every signed-in user here; we read their role
// and forward to the matching home — or to onboarding if they haven't chosen
// one yet. Keeping this server-side means the redirect happens before any UI
// paints, so nobody sees the wrong dashboard flash.
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ROLE_HOME } from "@logicland/auth";
import type { Role } from "@logicland/shared";

export const dynamic = "force-dynamic";

export default async function DashboardRouter() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const meta = user?.publicMetadata as
    | { role?: string; onboarded?: boolean }
    | undefined;

  // First-timers pick a role before we can route them.
  if (!meta?.onboarded) redirect("/onboarding");

  const raw = String(meta.role ?? "STUDENT").toUpperCase();
  const role: Role =
    raw === "TEACHER" || raw === "PARENT" || raw === "ADMIN"
      ? (raw as Role)
      : "STUDENT";

  redirect(ROLE_HOME[role]);
}
