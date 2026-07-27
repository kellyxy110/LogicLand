// GitHub OAuth — step 1: redirect to GitHub with a single-use state cookie.
// Dormant (503) until the GitHub app + encryption key are configured.
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl, githubConfig, isGitHubConfigured } from "@/lib/github/oauth";

export async function GET(req: NextRequest) {
  const cfg = githubConfig();
  if (!cfg || !isGitHubConfigured()) {
    return NextResponse.json({ error: "GitHub isn't configured yet." }, { status: 503 });
  }
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const state = randomBytes(16).toString("hex");
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = `${origin}/api/github/callback`;

  const res = NextResponse.redirect(buildAuthorizeUrl(cfg.clientId, redirectUri, state));
  res.cookies.set("gh_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
