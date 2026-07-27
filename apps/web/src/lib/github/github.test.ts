import { describe, expect, it, vi } from "vitest";
import { decryptToken, deriveKey, encryptToken } from "./crypto";
import { buildAuthorizeUrl, exchangeCodeForToken } from "./oauth";
import { GitHubClient } from "./client";

describe("github crypto", () => {
  it("round-trips a token and fails on the wrong key", () => {
    const key = deriveKey("a-strong-secret-value");
    const enc = encryptToken("gho_secrettoken", key);
    expect(enc).not.toContain("gho_secrettoken");
    expect(decryptToken(enc, key)).toBe("gho_secrettoken");
    expect(() => decryptToken(enc, deriveKey("different-secret"))).toThrow();
  });
});

describe("github oauth", () => {
  it("builds an authorize URL with client id, scope and state", () => {
    const url = new URL(buildAuthorizeUrl("cid123", "https://x/cb", "st4te"));
    expect(url.searchParams.get("client_id")).toBe("cid123");
    expect(url.searchParams.get("state")).toBe("st4te");
    expect(url.searchParams.get("scope")).toContain("repo");
    expect(url.searchParams.get("redirect_uri")).toBe("https://x/cb");
  });

  it("exchanges a code for a token", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "gho_x", scope: "repo,read:user" }), { status: 200 }),
    ) as unknown as typeof fetch;
    const r = await exchangeCodeForToken({ clientId: "c", clientSecret: "s" }, "code", "https://x/cb", fetchMock);
    expect(r).toMatchObject({ ok: true, token: "gho_x" });
    if (r.ok) expect(r.scopes).toContain("repo");
  });

  it("reports a failed exchange", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "bad_verification_code" }), { status: 200 }),
    ) as unknown as typeof fetch;
    const r = await exchangeCodeForToken({ clientId: "c", clientSecret: "s" }, "code", "cb", fetchMock);
    expect(r.ok).toBe(false);
  });
});

describe("GitHubClient", () => {
  it("sends the bearer token and shapes repos", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("/user/repos");
      return new Response(
        JSON.stringify([
          { id: 1, name: "app", full_name: "me/app", private: true, default_branch: "main" },
        ]),
        { status: 200 },
      );
    }) as unknown as typeof fetch;
    const client = new GitHubClient("gho_token", fetchMock);
    const r = await client.listRepos();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data[0]).toMatchObject({ name: "app", fullName: "me/app", defaultBranch: "main" });
    // auth header present
    const init = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer gho_token");
  });

  it("returns a typed error on API failure", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401 }),
    ) as unknown as typeof fetch;
    const r = await new GitHubClient("bad", fetchMock).getUser();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });
});
