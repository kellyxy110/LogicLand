// GitHub REST abstraction (ADR-022). Every call returns a typed ok/err result —
// the UI never sees a throw. `fetchImpl` is injectable for tests. The token is
// held only for the lifetime of a request handler; never logged.
const API = "https://api.github.com";

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

export class GitHubClient {
  private token: string;
  private fetchImpl: typeof fetch;

  constructor(token: string, fetchImpl: typeof fetch = fetch) {
    this.token = token;
    this.fetchImpl = fetchImpl;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<Result<T>> {
    try {
      const res = await this.fetchImpl(`${API}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(init?.headers ?? {}),
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        return { ok: false, error: body.message || `GitHub error ${res.status}`, status: res.status };
      }
      return { ok: true, data: (await res.json()) as T };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }

  async getUser(): Promise<Result<GitHubUser>> {
    const r = await this.req<{ login: string; name: string | null }>("/user");
    return r.ok ? { ok: true, data: { login: r.data.login, name: r.data.name } } : r;
  }

  async listRepos(): Promise<Result<GitHubRepo[]>> {
    const r = await this.req<
      Array<{ id: number; name: string; full_name: string; private: boolean; default_branch: string }>
    >("/user/repos?per_page=100&sort=updated&affiliation=owner");
    if (!r.ok) return r;
    return {
      ok: true,
      data: r.data.map((x) => ({
        id: x.id,
        name: x.name,
        fullName: x.full_name,
        private: x.private,
        defaultBranch: x.default_branch,
      })),
    };
  }

  async createRepo(name: string, isPrivate = true): Promise<Result<GitHubRepo>> {
    const r = await this.req<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      default_branch: string;
    }>("/user/repos", {
      method: "POST",
      body: JSON.stringify({ name, private: isPrivate, auto_init: true }),
    });
    if (!r.ok) return r;
    return {
      ok: true,
      data: {
        id: r.data.id,
        name: r.data.name,
        fullName: r.data.full_name,
        private: r.data.private,
        defaultBranch: r.data.default_branch || "main",
      },
    };
  }

  async listBranches(owner: string, repo: string): Promise<Result<string[]>> {
    const r = await this.req<Array<{ name: string }>>(`/repos/${owner}/${repo}/branches?per_page=100`);
    return r.ok ? { ok: true, data: r.data.map((b) => b.name) } : r;
  }

  /**
   * Create or update a file on a branch — the commit workflow via the Contents
   * API. Reads the existing sha (if any) so updates don't 409.
   */
  async putFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
  ): Promise<Result<{ commitSha: string }>> {
    const q = branch ? `?ref=${encodeURIComponent(branch)}` : "";
    const existing = await this.req<{ sha: string }>(`/repos/${owner}/${repo}/contents/${path}${q}`);
    const sha = existing.ok ? existing.data.sha : undefined;
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
    };
    if (branch) body.branch = branch;
    if (sha) body.sha = sha;
    const r = await this.req<{ commit: { sha: string } }>(`/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return r.ok ? { ok: true, data: { commitSha: r.data.commit.sha } } : r;
  }
}
