// GitHub OAuth (web application flow, ADR-022). Pure URL building + token
// exchange behind typed results. Everything reads config from env so the app is
// dormant (no errors) until a GitHub OAuth app is registered.
export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export const GITHUB_SCOPES = ["repo", "read:user"];

/** OAuth config from env, or null when not configured. */
export function githubConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isGitHubConfigured(): boolean {
  return githubConfig() !== null && !!process.env.GITHUB_TOKEN_ENC_KEY;
}

/** Build the GitHub authorize URL for the redirect. */
export function buildAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  scopes: string[] = GITHUB_SCOPES,
): string {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", scopes.join(" "));
  u.searchParams.set("state", state);
  u.searchParams.set("allow_signup", "false");
  return u.toString();
}

export type TokenExchange =
  | { ok: true; token: string; scopes: string[] }
  | { ok: false; error: string };

/** Exchange an authorization code for an access token. */
export async function exchangeCodeForToken(
  config: GitHubOAuthConfig,
  code: string,
  redirectUri: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TokenExchange> {
  try {
    const res = await fetchImpl("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) return { ok: false, error: `GitHub returned ${res.status}` };
    const data = (await res.json()) as { access_token?: string; scope?: string; error?: string };
    if (!data.access_token) return { ok: false, error: data.error || "No access token returned" };
    return { ok: true, token: data.access_token, scopes: (data.scope || "").split(",").filter(Boolean) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
