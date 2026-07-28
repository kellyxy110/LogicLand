# Consent-Gated Sharing — Operations & Policy

Implements ADR-020. **Private by default. No minor's work becomes publicly
discoverable automatically.** Ships behind feature flags (default OFF).

## Feature flags (server-only; never `NEXT_PUBLIC_*`)

| Flag | Default | Effect |
|---|---|---|
| `SHARING_ENABLED` | `false` | Master switch. Off → requests can be drafted/tested but no grant resolves to a public visibility and no public route serves content. |
| `SHARING_PUBLIC_MINORS_ENABLED` | `false` | Even with sharing on, a **minor's** openly-discoverable modes (`ANONYMOUS_/PUBLIC_/COMPETITION_SHOWCASE`) stay gated until a verified human-moderation queue exists. Adults are unaffected. |

Enable order: turn on `SHARING_ENABLED` for the non-public/consented modes first;
enable `SHARING_PUBLIC_MINORS_ENABLED` only once the moderation queue is staffed
and verified in production.

## Age bands → approvals

| Band | To publish (link-exposed / public) |
|---|---|
| Under 13 | verified parent/guardian + (teacher/school if school-managed) + learner acknowledgement; **learner can't override a rejection** |
| 13–17 | learner request + verified parent/guardian + (teacher/school if school-managed) |
| 18+ | self-publish, subject to moderation |

Unknown age is treated as **under 13** (most protective).

## Visibility modes

`PRIVATE` · `TEACHER_ONLY` · `PARENT_ONLY` · `CLASSROOM` · `SCHOOL` ·
`UNLISTED_PORTFOLIO` · `ANONYMOUS_SHOWCASE` · `PUBLIC_SHOWCASE` ·
`COMPETITION_SHOWCASE`. The trusted-circle modes need no elevated consent;
link-exposed and showcase modes require the approvals above **and** moderation.

## What a minor's public page may show

Only: approved display name **or** first name + optional initial; avatar; a broad
age band; a broad region **only if separately approved**. Anonymous modes drop
identity entirely. Never shown: legal name, email, phone, precise location,
school/class/home address, personal socials, repo credentials, chat history, or
un-approved assessment notes / teacher comments.

## Data model

- `ShareGrant` — one consent record per (learner, subject): requested vs effective
  visibility, state, policy version, unguessable token, moderation status/findings,
  expiry, revocation, timestamps.
- `ConsentApproval` — one row per approver decision (role + identity + approve/reject).
- `ShareAudit` — append-only trail (requested/acknowledged/approved/rejected/
  revoked/visibility_changed/moderated). Survives takedown.

## Moderation gate (deterministic)

`moderateForPublication()` scans for secrets/credentials, PII (email, phone,
address, social links), and prohibited content before any link-exposed
publication. `block` findings hard-stop; findings are surfaced without echoing the
secret. Human review is additionally required for a minor's openly-discoverable
modes. Runs with no network/model calls.

## Approver surface

Parents review pending requests for their children at **`/parent/approvals`**
(`myPendingApprovals` → `ApprovalQueue` → `decideShare` with the `PARENT` role).
A request whose moderation is `blocked` can't be approved until fixed. Rejections
are final for an under-13 (the policy engine forbids self-override). The queue is
empty and inert while `SHARING_ENABLED` is off.

## Revocation

Any approver (or the platform) can revoke. Revocation forces `PRIVATE`
immediately, stamps `revokedAt`, and must remove the project from discovery,
showcases and search, and queue cache/CDN invalidation. Only the internal audit
record is retained.

## Verification checklist before enabling in production

1. `SHARING_ENABLED=false` in all envs until this passes.
2. Engine tests green (`sharing.test.ts`, `sharing-moderation.test.ts`).
3. Confirm no public route serves non-`PRIVATE` content while flags are off.
4. Staff + verify the human-moderation queue; only then set
   `SHARING_PUBLIC_MINORS_ENABLED=true`.
5. Confirm revocation removes content from every public surface + invalidates caches.
