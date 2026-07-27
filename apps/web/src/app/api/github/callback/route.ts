// GitHub OAuth — step 2: verify state, exchange the code, store the ENCRYPTED
// token, and return to the GitHub panel. Never logs or exposes the token.
import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { saveGitHubConnection } from "@logicland/database";
import { encryptToken, githubEncKey } from "@/lib/github/crypto";
import { exchangeCodeForToken, githubConfig } from "@/lib/github/oauth";
import { GitHubClient } from "@/lib/github/client";

function back(req: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/studio/github?github=${status}`, req.url));
}

export async function GET(req: NextRequest) {
  const cfg = githubConfig();
  const key = githubEncKey();
  if (!cfg || !key) return back(req, "unconfigured");

  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("gh_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return back(req, "error");
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const exchanged = await exchangeCodeForToken(cfg, code, `${origin}/api/github/callback`);
  if (!exchanged.ok) return back(req, "error");

  const who = await new GitHubClient(exchanged.token).getUser();
  const login = who.ok ? who.data.login : "unknown";

  await saveGitHubConnection(userId, {
    githubLogin: login,
    encryptedToken: encryptToken(exchanged.token, key),
    scopes: exchanged.scopes,
  });

  const res = back(req, "connected");
  res.cookies.delete("gh_oauth_state");
  return res;
}
