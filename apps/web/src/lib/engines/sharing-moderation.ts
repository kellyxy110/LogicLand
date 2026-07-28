// Consent-gated sharing — deterministic moderation gate (ADR-020, ADR-015).
//
// PURE and deterministic: given the text/files a learner wants to make public,
// find the things that must NOT go public — secrets/credentials, personal data
// (PII), and prohibited content. No network, no model calls. This is a hard
// pre-publication gate: automated checks run first; `humanReviewRequired` from
// the policy layer decides whether a person must also sign off.
//
// It is intentionally conservative — false positives block a share (safe) rather
// than leak (unsafe). A blocked share surfaces the findings so the learner/adult
// can fix them.

export type ModerationSeverity = "block" | "warn";

export type ModerationCategory =
  | "secret"
  | "pii_email"
  | "pii_phone"
  | "pii_address"
  | "pii_social"
  | "prohibited";

export interface ModerationFinding {
  category: ModerationCategory;
  severity: ModerationSeverity;
  /** A short, non-leaking label — never the raw matched secret. */
  label: string;
  /** 1-based location hint when available. */
  where?: string;
}

export interface ModerationReport {
  passed: boolean;
  findings: ModerationFinding[];
  scannedChars: number;
}

export interface ModerationInput {
  /** File-like blobs: name + content. Portfolio text can be passed as one file. */
  files: { name: string; content: string }[];
}

// --- Secret / credential signatures -------------------------------------------
// Names describe the shape; we never echo the matched value.
const SECRET_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { label: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { label: "OpenAI-style key", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { label: "Groq key", re: /\bgsk_[A-Za-z0-9]{20,}\b/ },
  { label: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: "Google API key", re: /\bAIza[0-9A-Za-z_\-]{35}\b/ },
  { label: "JWT", re: /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/ },
  { label: "generic assigned secret", re: /\b(?:api[_-]?key|secret|password|passwd|token)\b\s*[:=]\s*['"]?[A-Za-z0-9_\-]{8,}/i },
  { label: "connection string with credentials", re: /\b[a-z]+:\/\/[^\s/@:]+:[^\s/@:]+@/i },
];

// --- PII signatures ------------------------------------------------------------
const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/;
// Phone: 10+ digits allowing spaces, dashes, dots, parens, optional +country.
const PHONE_RE = /(?:\+?\d[\s.\-]?){9,}\d/;
const SOCIAL_RE =
  /\b(?:https?:\/\/)?(?:www\.)?(?:instagram|tiktok|twitter|x|facebook|snapchat|discord|youtube|t\.me|telegram)\.[a-z/.@\w\-]+/i;
// Street-address heuristic: number + street-type keyword.
const ADDRESS_RE =
  /\b\d{1,5}\s+[A-Za-z0-9.\s]{2,40}\b(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|court|ct|way|close|crescent)\b/i;

// --- Prohibited content --------------------------------------------------------
// A conservative slur/threat/self-harm signal list. Deliberately small and paired
// with the engine's child-safety filter server-side; this is the pre-publish net.
const PROHIBITED_RE =
  /\b(?:kill yourself|kys|suicide|self[\s-]?harm|nigger|faggot|rape|child\s*porn|cp\b)\b/i;

function scanContent(name: string, content: string): ModerationFinding[] {
  const findings: ModerationFinding[] = [];
  const at = `file:${name}`;

  for (const { label, re } of SECRET_PATTERNS) {
    if (re.test(content)) {
      findings.push({ category: "secret", severity: "block", label, where: at });
    }
  }
  if (EMAIL_RE.test(content))
    findings.push({ category: "pii_email", severity: "block", label: "email address", where: at });
  if (PHONE_RE.test(content))
    findings.push({ category: "pii_phone", severity: "block", label: "phone number", where: at });
  if (ADDRESS_RE.test(content))
    findings.push({ category: "pii_address", severity: "block", label: "street address", where: at });
  if (SOCIAL_RE.test(content))
    findings.push({ category: "pii_social", severity: "warn", label: "social-media link", where: at });
  if (PROHIBITED_RE.test(content))
    findings.push({ category: "prohibited", severity: "block", label: "prohibited language", where: at });

  return findings;
}

/**
 * Run all automated pre-publication checks. `passed` is true only when there are
 * no `block`-severity findings. `warn` findings are surfaced but do not, alone,
 * block — human review (policy-driven) weighs them.
 */
export function moderateForPublication(input: ModerationInput): ModerationReport {
  const findings: ModerationFinding[] = [];
  let scannedChars = 0;
  for (const f of input.files) {
    scannedChars += f.content.length;
    findings.push(...scanContent(f.name, f.content));
  }
  const passed = !findings.some((x) => x.severity === "block");
  return { passed, findings, scannedChars };
}
