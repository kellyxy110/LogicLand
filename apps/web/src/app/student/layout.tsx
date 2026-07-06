import { requireRole } from "@logicland/auth/server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["STUDENT"]);
  return <>{children}</>;
}
