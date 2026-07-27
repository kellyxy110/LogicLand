"use client";
// GitHub connect panel (ADR-022). Reflects the sync states: not-configured →
// disconnected → connected → syncing → synced/error. Fully functional once the
// GitHub env vars are set; until then it shows a clear "not configured" note.
import { Card } from "@logicland/ui";
import { AlertCircle, Check, Github, Loader2, LogOut, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import {
  disconnectGitHub,
  githubStatus,
  listMyRepos,
  pushFilesToRepo,
  type GitHubStatus,
} from "@/app/actions/github";
import type { GitHubRepo } from "@/lib/github/client";
import { useStudioProject } from "@/features/studio-ide/useStudioProject";

type Sync = "idle" | "loading" | "pushing" | "done" | "error";

export function GitHubPanel() {
  const files = useStudioProject((s) => s.files);
  const hydrate = useStudioProject((s) => s.hydrate);
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [sync, setSync] = useState<Sync>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    hydrate();
    githubStatus().then(setStatus).catch(() => setStatus({ configured: false, connected: false }));
  }, [hydrate]);

  useEffect(() => {
    if (status?.connected) {
      setSync("loading");
      listMyRepos()
        .then((r) => {
          if (r.ok && r.repos) setRepos(r.repos);
          setSync("idle");
        })
        .catch(() => setSync("error"));
    }
  }, [status?.connected]);

  if (!status) {
    return <p className="p-4 text-sm opacity-60">Checking GitHub…</p>;
  }

  if (!status.configured) {
    return (
      <Card className="border-2 border-amber-400/30 bg-amber-400/5">
        <p className="flex items-center gap-2 font-bold">
          <AlertCircle className="h-5 w-5 text-amber-500" /> GitHub isn&apos;t configured yet
        </p>
        <p className="mt-1 text-sm opacity-75">
          The integration is fully built and dormant. An admin needs to set{" "}
          <code className="font-mono text-xs">GITHUB_CLIENT_ID</code>,{" "}
          <code className="font-mono text-xs">GITHUB_CLIENT_SECRET</code> and{" "}
          <code className="font-mono text-xs">GITHUB_TOKEN_ENC_KEY</code> (see
          docs/github-integration.md).
        </p>
      </Card>
    );
  }

  async function push(fullName: string) {
    setSync("pushing");
    setMessage("");
    const r = await pushFilesToRepo(
      fullName,
      files.map((f) => ({ name: f.name, content: f.content })),
    );
    if (r.ok) {
      setSync("done");
      setMessage(`Pushed ${r.commits} file(s) to ${fullName}.`);
    } else {
      setSync("error");
      setMessage(r.error ?? "Push failed.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <Github className="h-6 w-6" />
          {status.connected ? (
            <>
              <div className="flex-1">
                <p className="font-bold">Connected as {status.login}</p>
                <p className="text-xs opacity-60">Your token is stored encrypted.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await disconnectGitHub();
                  setStatus({ ...status, connected: false, login: undefined });
                  setRepos([]);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-black/10 px-3 py-1.5 text-xs font-bold hover:border-rose-400 hover:text-rose-500 dark:border-white/15"
              >
                <LogOut className="h-3.5 w-3.5" /> Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 font-bold">Connect your GitHub</p>
              <a
                href="/api/github/connect"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white hover:opacity-90"
              >
                <Github className="h-4 w-4" /> Connect
              </a>
            </>
          )}
        </div>
      </Card>

      {status.connected && (
        <Card>
          <p className="mb-2 flex items-center gap-2 font-bold">
            <UploadCloud className="h-5 w-5 text-brand" /> Push your Studio project
          </p>
          {sync === "loading" ? (
            <p className="flex items-center gap-2 text-sm opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your repositories…
            </p>
          ) : repos.length === 0 ? (
            <p className="text-sm opacity-60">No repositories found for your account.</p>
          ) : (
            <ul className="space-y-1.5">
              {repos.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{r.fullName}</span>
                  {r.private && <span className="text-[0.6rem] opacity-50">private</span>}
                  <button
                    type="button"
                    onClick={() => push(r.fullName)}
                    disabled={sync === "pushing"}
                    className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand/20 disabled:opacity-50"
                  >
                    Push
                  </button>
                </li>
              ))}
            </ul>
          )}
          {message && (
            <p
              className={`mt-3 flex items-center gap-1.5 text-sm ${
                sync === "error" ? "text-rose-500" : "text-meadow"
              }`}
            >
              {sync === "error" ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {message}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
