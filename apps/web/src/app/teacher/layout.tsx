import { requireRole } from "@logicland/auth/server";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["TEACHER"]);
  return <>{children}</>;
}
