import { requireRole } from "@logicland/auth/server";

// The explorer experience (World Map + missions) is for signed-in students.
// Same gate the /student area uses; keeps the LogicLand galaxy behind auth.
export default async function WorldsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["STUDENT"]);
  return <>{children}</>;
}
