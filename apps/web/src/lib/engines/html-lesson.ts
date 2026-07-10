// Pure validation for the HTML Studio's guided class. Given the current file
// tree, it decides which lesson step the child is on and whether the class is
// complete. No React, no store — just data in, verdict out — so it's fully
// unit-testable and the UI can trust it.
import type { FsNode, HtmlLessonStep, StepCheck } from "@/types/studio";

/** First file matching a name (case-insensitive), if any. */
export function findFile(nodes: FsNode[], name: string): FsNode | undefined {
  return nodes.find(
    (n) => n.kind === "file" && n.name.toLowerCase() === name.toLowerCase(),
  );
}

/** Count case-insensitive, possibly-overlapping-free occurrences of a needle. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const hay = haystack.toLowerCase();
  const nee = needle.toLowerCase();
  let count = 0;
  let i = hay.indexOf(nee);
  while (i !== -1) {
    count += 1;
    i = hay.indexOf(nee, i + nee.length);
  }
  return count;
}

/** Whether a single declarative check passes against the tree. Checks verify
 *  *meaning* (an element is present, or present N times) rather than one exact
 *  answer string, so <h1>My Cat</h1> and a multi-line version both pass. */
export function checkStep(nodes: FsNode[], check: StepCheck): boolean {
  switch (check.type) {
    case "has-folder":
      return nodes.some((n) => n.kind === "folder");
    case "has-file":
      return findFile(nodes, check.name) !== undefined;
    case "content-has": {
      const file = findFile(nodes, check.file);
      return (
        file !== undefined &&
        file.content.toLowerCase().includes(check.needle.toLowerCase())
      );
    }
    case "content-count": {
      const file = findFile(nodes, check.file);
      return (
        file !== undefined &&
        countOccurrences(file.content, check.needle) >= check.min
      );
    }
    default:
      return false;
  }
}

/** Index of the first step not yet satisfied — or steps.length when the whole
 *  class is complete. Robust to edits: unmeeting a step steps the child back. */
export function currentStepIndex(
  nodes: FsNode[],
  steps: HtmlLessonStep[],
): number {
  const i = steps.findIndex((s) => !checkStep(nodes, s.check));
  return i === -1 ? steps.length : i;
}

export function isClassComplete(
  nodes: FsNode[],
  steps: HtmlLessonStep[],
): boolean {
  return steps.length > 0 && currentStepIndex(nodes, steps) === steps.length;
}
