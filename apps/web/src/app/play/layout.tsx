import { requireRole } from "@logicland/auth/server";

// Playing a mission is a student activity — same auth gate as the World Map.
export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["STUDENT"]);
  return <>{children}</>;
}
