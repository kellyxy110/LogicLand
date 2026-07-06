// Role-based access helpers layered over Clerk.
import type { Role } from "@logicland/shared";

// Roles are stored in Clerk publicMetadata.role and mirrored to the DB.
export function hasRole(role: unknown, allowed: Role[]): boolean {
  return typeof role === "string" && (allowed as string[]).includes(role);
}

export const ROLE_HOME: Record<Role, string> = {
  TEACHER: "/teacher",
  PARENT: "/parent",
  STUDENT: "/student",
  ADMIN: "/admin",
};
