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
 *  content stays data and the validator stays pure. */
export type StepCheck =
  | { type: "has-folder" }
  | { type: "has-file"; name: string }
  | { type: "content-has"; file: string; needle: string };

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
  /** The file whose contents render in the live preview. */
  previewFile: string;
  steps: HtmlLessonStep[];
}
