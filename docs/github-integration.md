# GitHub Integration — setup runbook

The integration is **fully implemented and dormant** until three secrets are
set. Nothing else is missing. See ADR-022 in `docs/decision.md`.

## 1. Register a GitHub OAuth app
GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
- **Homepage URL:** `https://logicland.vercel.app`
- **Authorization callback URL:** `https://logicland.vercel.app/api/github/callback`
  (add `http://localhost:3000/api/github/callback` for local dev).

Copy the **Client ID** and generate a **Client Secret**.

## 2. Set environment variables (Vercel → Project → Settings → Environment Variables)
| Variable | What | Notes |
|---|---|---|
| `GITHUB_CLIENT_ID` | OAuth app client id | from step 1 |
| `GITHUB_CLIENT_SECRET` | OAuth app client secret | **secret** — never commit |
| `GITHUB_TOKEN_ENC_KEY` | any strong random string (≥ 32 chars) | derives the AES-256-GCM key that encrypts stored tokens; rotating it invalidates stored connections |

`NEXT_PUBLIC_APP_URL` (optional) sets the OAuth redirect base; defaults to the
request origin.

Write these to Vercel env (and a git-ignored `.env.local` for dev). Do **not**
put secrets in code.

## 3. That's it
Once the three values are present, `/api/github/connect` becomes live and the
"Connect GitHub" panel in Studio works: connect → pick a repo → push the current
project → disconnect (revokes the token). Until then every entry point shows a
clear "GitHub isn't configured yet" message and no route errors.

## Security notes
- Tokens are stored **AES-256-GCM encrypted**; the plaintext token never leaves
  the server and is never logged.
- OAuth uses a signed, single-use `state` to prevent CSRF.
- Scopes requested are the minimum needed: `repo`, `read:user`.
- Disconnect deletes the stored connection and best-effort revokes the token.
