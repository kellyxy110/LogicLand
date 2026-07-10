// Pure HTML safety scan for the kid studio. The live preview already renders in
// a locked-down iframe (sandbox="" — no scripts, forms, or navigation), so this
// is defense-in-depth, not the only guard: it lets the UI show a gentle "scripts
// are turned off here" note and lets us flag unsafe markup in submissions. Data
// in, findings out — no DOM, fully unit-testable.

/** A category of unsafe markup we detect for young coders. */
export type UnsafeKind =
  | "script-tag"
  | "inline-event-handler"
  | "javascript-url"
  | "iframe-tag"
  | "object-or-embed"
  | "srcdoc-attr";

export interface UnsafeFinding {
  kind: UnsafeKind;
  /** A short, kid-safe explanation (never a stack trace or raw payload). */
  message: string;
}

const RULES: { kind: UnsafeKind; re: RegExp; message: string }[] = [
  {
    kind: "script-tag",
    re: /<\s*script\b/i,
    message: "Scripts are turned off in the preview to keep you safe.",
  },
  {
    // onclick=, onerror=, onload=, … — any inline on* handler.
    kind: "inline-event-handler",
    re: /<[^>]*\son[a-z]+\s*=/i,
    message: "Inline actions like onclick aren't allowed here.",
  },
  {
    kind: "javascript-url",
    re: /(?:href|src|action)\s*=\s*["']?\s*javascript:/i,
    message: "javascript: links are turned off in the preview.",
  },
  {
    kind: "iframe-tag",
    re: /<\s*iframe\b/i,
    message: "Embedding other pages isn't allowed here yet.",
  },
  {
    kind: "object-or-embed",
    re: /<\s*(?:object|embed)\b/i,
    message: "Plugins aren't allowed in the preview.",
  },
  {
    kind: "srcdoc-attr",
    re: /\bsrcdoc\s*=/i,
    message: "Embedded documents aren't allowed here.",
  },
];

/** All distinct unsafe findings in the given HTML (empty when it's clean). */
export function findUnsafeHtml(html: string): UnsafeFinding[] {
  if (!html) return [];
  return RULES.filter((r) => r.re.test(html)).map(({ kind, message }) => ({
    kind,
    message,
  }));
}

/** True when the markup contains nothing we consider unsafe for the studio. */
export function isHtmlSafe(html: string): boolean {
  return findUnsafeHtml(html).length === 0;
}
