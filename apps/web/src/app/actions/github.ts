"use server";
// GitHub server actions (ADR-022). All resolve the Clerk user, decrypt the
// stored token server-side, and never return it to the client. Everything
// degrades safely when GitHub isn't configured or the user isn't connected.
import { auth } from "@clerk/nextjs/server";
import {
  deleteGitHubConnection,
  getGitHubConnection,
} from "@logicland/database";
import { decryptToken, githubEncKey } from "@/lib/github/crypto";
import { githubConfig, isGitHubConfigured } from "@/lib/github/oauth";
import { GitHubClient, type GitHubRepo } from "@/lib/github/client";

export interface GitHubStatus {
  configured: boolean;
  connected: boolean;
  login?: string;
}

export async function githubStatus(): Promise<GitHubStatus> {
  const configured = isGitHubConfigured();
  if (!configured) return { configured: false, connected: false };
  const { userId } = await auth();
  if (!userId) return { configured, connected: false };
  const conn = await getGitHubConnection(userId);
  return { configured, connected: !!conn, login: conn?.githubLogin };
}

async function clientForUser(): Promise<GitHubClient | null> {
  const key = githubEncKey();
  if (!key) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const conn = await getGitHubConnection(userId);
  if (!conn) return null;
  try {
    return new GitHubClient(decryptToken(conn.encryptedToken, key));
  } catch {
    return null;
  }
}

export async function listMyRepos(): Promise<{ ok: boolean; repos?: GitHubRepo[]; error?: string }> {
  const client = await clientForUser();
  if (!client) return { ok: false, error: "Not connected to GitHub." };
  const r = await client.listRepos();
  return r.ok ? { ok: true, repos: r.data } : { ok: false, error: r.error };
}

export async function pushFilesToRepo(
  fullName: string,
  files: { name: string; content: string }[],
  message = "Update from LogicLand",
): Promise<{ ok: boolean; commits?: number; error?: string }> {
  const client = await clientForUser();
  if (!client) return { ok: false, error: "Not connected to GitHub." };
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) return { ok: false, error: "Invalid repository." };
  let commits = 0;
  for (const f of files) {
    const r = await client.putFile(owner, repo, f.name, f.content, message);
    if (!r.ok) return { ok: false, error: r.error, commits };
    commits += 1;
  }
  return { ok: true, commits };
}

export async function disconnectGitHub(): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;
  // Best-effort remote revoke before deleting the local connection.
  try {
    const cfg = githubConfig();
    const key = githubEncKey();
    const conn = await getGitHubConnection(userId);
    if (cfg && key && conn) {
      const token = decryptToken(conn.encryptedToken, key);
      const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
      await fetch(`https://api.github.com/applications/${cfg.clientId}/token`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ access_token: token }),
      });
    }
  } catch {
    /* best-effort — proceed to delete the local record regardless */
  }
  await deleteGitHubConnection(userId);
}
