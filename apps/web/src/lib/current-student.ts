// Server-only helper: resolve the Clerk-authenticated user to their persisted
// Student record (creating it on first sight). Shared by the student, level, and
// submission server actions so identity resolution lives in one place. This is a
// plain server module (no "use server") — only server actions import it.
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentRole } from "@logicland/auth/server";
import { ensureStudent, type Student } from "@logicland/database";

export async function currentStudent(): Promise<Student> {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");
  const role = (await getCurrentRole()) ?? "STUDENT";
  const email =
    user.primaryEmailAddress?.emailAddress ?? `${user.id}@logicland.local`;
  return ensureStudent({
    clerkId: user.id,
    email,
    name: user.firstName ?? "Explorer",
    role,
  });
}
