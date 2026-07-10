// Coding-studio submissions: a child builds an assignment in the studio and
// submits it for the teacher to review next class. Slug-keyed and FK-free like
// the rest of progress. `code` snapshots the files; `checklist` records which
// requirements were met at submit time (auto-checked, but a human still reviews).
import { Prisma } from "@prisma/client";
import { prisma } from "./index";

export interface SubmittedFile {
  name: string;
  content: string;
}
export interface ChecklistResult {
  label: string;
  passed: boolean;
}

export interface SubmitStudioInput {
  missionSlug: string;
  title: string;
  code: SubmittedFile[];
  checklist: ChecklistResult[];
}

export interface StudioSubmissionView {
  id: string;
  studentId: string;
  studentName: string;
  missionSlug: string;
  title: string;
  code: SubmittedFile[];
  checklist: ChecklistResult[];
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  feedback: string | null;
  submittedAt: Date;
}

interface SubmissionRow {
  id: string;
  studentId: string;
  missionSlug: string;
  title: string;
  code: Prisma.JsonValue;
  checklist: Prisma.JsonValue;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  feedback: string | null;
  submittedAt: Date;
  student?: { displayName: string };
}

function toView(row: SubmissionRow): StudioSubmissionView {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.student?.displayName ?? "Explorer",
    missionSlug: row.missionSlug,
    title: row.title,
    code: (row.code as unknown as SubmittedFile[]) ?? [],
    checklist: (row.checklist as unknown as ChecklistResult[]) ?? [],
    status: row.status,
    feedback: row.feedback,
    submittedAt: row.submittedAt,
  };
}

/** Save a new submission (SUBMITTED). Each submit is a new row, so a teacher can
 *  see the history; dashboards show the most recent per mission. */
export async function submitStudio(
  studentId: string,
  input: SubmitStudioInput,
): Promise<{ id: string }> {
  const row = await prisma.studioSubmission.create({
    data: {
      studentId,
      missionSlug: input.missionSlug,
      title: input.title,
      code: input.code as unknown as Prisma.InputJsonValue,
      checklist: input.checklist as unknown as Prisma.InputJsonValue,
      status: "SUBMITTED",
    },
  });
  await prisma.student.update({
    where: { id: studentId },
    data: { lastActiveOn: new Date() },
  });
  return { id: row.id };
}

/** Teacher view: every submission, newest first, with the student's name. */
export async function listStudioSubmissions(
  status?: "SUBMITTED" | "REVIEWED",
): Promise<StudioSubmissionView[]> {
  const rows = await prisma.studioSubmission.findMany({
    where: status ? { status } : {},
    include: { student: { select: { displayName: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(toView);
}

/** A single student's submissions (parent view / child history). */
export async function getStudentSubmissions(
  studentId: string,
): Promise<StudioSubmissionView[]> {
  const rows = await prisma.studioSubmission.findMany({
    where: { studentId },
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(toView);
}

/** Teacher marks a submission reviewed, with optional feedback for the child. */
export async function reviewStudioSubmission(
  id: string,
  feedback: string,
): Promise<void> {
  await prisma.studioSubmission.update({
    where: { id },
    data: { status: "REVIEWED", feedback: feedback.trim() || null },
  });
}
