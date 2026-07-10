// Singleton Prisma client — avoids exhausting connections in dev hot-reload.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
export {
  ensureStudent,
  saveMissionCompletion,
  type EnsureUserInput,
  type StudentTotals,
} from "./students";
export {
  listClassroomStudents,
  getParentChildren,
  type StudentProgress,
} from "./dashboards";
export {
  saveLevelResult,
  getLevelRecords,
  type LevelResultInput,
  type LevelRecord,
} from "./levels";
export {
  submitStudio,
  listStudioSubmissions,
  getStudentSubmissions,
  reviewStudioSubmission,
  type SubmitStudioInput,
  type SubmittedFile,
  type ChecklistResult,
  type StudioSubmissionView,
} from "./submissions";
