// Types for the HTML Coding Studio — a gentle, VS Code-shaped first taste of
// real coding: a file tree, an editor, and a live preview. The file system is a
// simple flat list of nodes linked by parentId (all the tree we need for a
// child's first project) and stays in memory for the session.

export type FsKind = "folder" | "file";

export interface FsNode {
  id: string;
  name: string;
  kind: FsKind;
  /** null = lives at the project root. */
  parentId: string | null;
  /** File contents (empty for folders). */
  content: string;
}

/** Declarative checks the guided lesson evaluates against the file tree, so
 *  content stays data and the validator stays pure. Meaning over exact strings:
 *  `content-count` verifies "add three list items" without a single answer key. */
export type StepCheck =
  | { type: "has-folder" }
  | { type: "has-file"; name: string }
  | { type: "content-has"; file: string; needle: string }
  | { type: "content-count"; file: string; needle: string; min: number };

/** A file the studio pre-creates for a module, so later modules build on earlier
 *  work instead of starting from an empty page (the spec's "starter template"). */
export interface StarterFile {
  name: string;
  content: string;
}

export interface HtmlLessonStep {
  id: string;
  /** What to do, in kid words. */
  instruction: string;
  /** A nudge if they're stuck. */
  hint: string;
  check: StepCheck;
}

export interface HtmlStudioData {
  kind: "html-studio";
  title: string;
  /** A one-line framing of the module, read aloud to set the scene. */
  intro?: string;
  /** The file whose contents render in the live preview. */
  previewFile: string;
  /** Files pre-created for this module so learners build on earlier work. Absent
   *  for Module 1, which teaches creating the folder and file from scratch. */
  starter?: StarterFile[];
  steps: HtmlLessonStep[];
}
