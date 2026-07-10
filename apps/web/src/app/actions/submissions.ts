"use server";
// Studio assignment submissions: a child submits their coding work for the
// teacher to review next class. Students submit; teachers list and review.
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentRole } from "@logicland/auth/server";
import {
  getStudentSubmissions as dbGetStudentSubmissions,
  listStudioSubmissions as dbListSubmissions,
  reviewStudioSubmission as dbReview,
  submitStudio,
  type ChecklistResult,
  type StudioSubmissionView,
  type SubmittedFile,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";

export interface SubmitAssignmentInput {
  missionSlug: string;
  title: string;
  code: SubmittedFile[];
  checklist: ChecklistResult[];
}

/** Result of a submit attempt. A discriminated union (rather than a thrown
 *  error) so the client can show a precise, friendly message and the learner's
 *  work is never lost — they can always retry. */
export type SubmitAssignmentResult =
  | { ok: true; id: string; submittedAt: string }
  | { ok: false; reason: "unauthenticated" | "error" };

/** A student submits their current studio work for review. */
export async function submitAssignment(
  input: SubmitAssignmentInput,
): Promise<SubmitAssignmentResult> {
  let studentId: string;
  try {
    studentId = (await currentStudent()).id;
  } catch {
    // Signed out / session expired — the work stays in the browser; ask them
    // to sign in and try again.
    return { ok: false, reason: "unauthenticated" };
  }
  try {
    const { id } = await submitStudio(studentId, input);
    return { ok: true, id, submittedAt: new Date().toISOString() };
  } catch (err) {
    // Log the real cause server-side (message only, no secrets) so we can see
    // DB issues in the logs; the learner just sees a friendly retry.
    console.error(
      "[submitAssignment] could not save submission:",
      err instanceof Error ? err.message : String(err),
    );
    return { ok: false, reason: "error" };
  }
}

/** The signed-in student's own submissions (for their history + resume state). */
export async function getMySubmissions(): Promise<StudioSubmissionView[]> {
  const student = await currentStudent();
  return dbGetStudentSubmissions(student.id);
}

/** Teacher-only: every submission to review, newest first. */
export async function listSubmissionsForTeacher(
  status?: "SUBMITTED" | "REVIEWED",
): Promise<StudioSubmissionView[]> {
  await requireTeacher();
  return dbListSubmissions(status);
}

/** Teacher-only: mark a submission reviewed with feedback for the child. */
export async function reviewSubmission(
  id: string,
  feedback: string,
): Promise<void> {
  await requireTeacher();
  await dbReview(id, feedback);
}

async function requireTeacher(): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");
  const role = await getCurrentRole();
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}
