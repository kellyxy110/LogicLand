// LogicLand Studio (IDE) workspace persistence. One free-build project per
// student for now (unique on studentId), files stored as JSON. Lets a learner's
// Studio project follow them across devices instead of living only in the
// browser's localStorage.
import type { Prisma } from "@prisma/client";
import { prisma } from "./index";

export interface StudioFile {
  name: string;
  content: string;
}

export interface StudioProjectView {
  name: string;
  files: StudioFile[];
}

/** Coerce untrusted JSON into a clean StudioFile[] (defensive: the column is
 *  Json, and older/hand-edited rows shouldn't crash the reader). */
function toFiles(value: unknown): StudioFile[] {
  if (!Array.isArray(value)) return [];
  const out: StudioFile[] = [];
  for (const f of value) {
    if (
      f &&
      typeof f === "object" &&
      typeof (f as StudioFile).name === "string" &&
      typeof (f as StudioFile).content === "string"
    ) {
      out.push({ name: (f as StudioFile).name, content: (f as StudioFile).content });
    }
  }
  return out;
}

/** The student's saved Studio workspace, or null if they have none yet. */
export async function getStudioProject(
  studentId: string,
): Promise<StudioProjectView | null> {
  const row = await prisma.studioProject.findUnique({ where: { studentId } });
  if (!row) return null;
  return { name: row.name, files: toFiles(row.files) };
}

/** Create or update the student's single Studio workspace. */
export async function saveStudioProject(
  studentId: string,
  input: StudioProjectView,
): Promise<void> {
  const files = toFiles(input.files);
  const name = input.name?.trim() || "My Project";
  // Prisma's Json input type doesn't accept a typed object array directly.
  const filesJson = files as unknown as Prisma.InputJsonValue;
  await prisma.studioProject.upsert({
    where: { studentId },
    create: { studentId, name, files: filesJson },
    update: { name, files: filesJson },
  });
}
