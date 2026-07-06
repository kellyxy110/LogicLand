import { requireRole } from "@logicland/auth/server";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["PARENT"]);
  return <>{children}</>;
}
