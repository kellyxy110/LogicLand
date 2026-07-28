// Feature flags — a single, explicit place for gates that must default OFF.
//
// Sharing (ADR-020) ships DARK: the consent/audit/moderation spine is built and
// tested, but nothing becomes publicly reachable until the full workflow is
// verified in production AND this flag is deliberately enabled. Read on the
// server; a flag is never a NEXT_PUBLIC_* value (clients must not decide policy).

function envFlag(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v == null || v === "") return fallback;
  return /^(1|true|on|yes)$/i.test(v);
}

/** Master switch for consent-gated public sharing. OFF by default. When off,
 * share requests can be drafted/tested but no public route serves content and no
 * grant can resolve to a publicly-discoverable visibility. */
export const SHARING_ENABLED = envFlag("SHARING_ENABLED", false);

/** Even with SHARING_ENABLED, minors' openly-discoverable modes stay gated behind
 * a verified human-moderation queue. OFF until that queue is staffed/verified. */
export const SHARING_PUBLIC_MINORS_ENABLED = envFlag("SHARING_PUBLIC_MINORS_ENABLED", false);
