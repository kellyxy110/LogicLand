"use server";
// LogicLand Studio workspace persistence. Loads/saves the signed-in student's
// single Studio project so it follows them across devices. Resilient: both
// no-op / return null for a signed-in non-student (teacher/parent trying Studio)
// or a DB hiccup, so Studio always keeps working from localStorage.
import {
  getStudioProject,
  saveStudioProject,
  type StudioFile,
  type StudioProjectView,
} from "@logicland/database";
import { currentStudent } from "@/lib/current-student";

export interface StudioLoad {
  /** True when the viewer is a student (so their edits should persist to the DB). */
  isStudent: boolean;
  /** Their saved workspace, or null if a student hasn't saved one yet. */
  project: StudioProjectView | null;
}

export async function loadMyStudioProject(): Promise<StudioLoad> {
  try {
    const student = await currentStudent();
    const project = await getStudioProject(student.id);
    return { isStudent: true, project };
  } catch {
    return { isStudent: false, project: null };
  }
}

export async function saveMyStudioProject(
  files: StudioFile[],
  name = "My Project",
): Promise<void> {
  try {
    const student = await currentStudent();
    await saveStudioProject(student.id, { name, files });
  } catch {
    /* not a student, or DB unavailable — Studio still works from localStorage */
  }
}
