// GitHub connection persistence (ADR-022). Stores only the ENCRYPTED token
// (encryption happens in the web app before it reaches here). Keyed by Clerk
// user id so any role can connect.
import { prisma } from "./index";

export interface GitHubConnectionInput {
  githubLogin: string;
  encryptedToken: string;
  scopes: string[];
}

export interface GitHubConnectionView {
  githubLogin: string;
  encryptedToken: string;
  scopes: string[];
  connectedAt: Date;
}

export async function getGitHubConnection(userId: string): Promise<GitHubConnectionView | null> {
  const row = await prisma.gitHubConnection.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    githubLogin: row.githubLogin,
    encryptedToken: row.encryptedToken,
    scopes: row.scopes,
    connectedAt: row.createdAt,
  };
}

export async function saveGitHubConnection(
  userId: string,
  input: GitHubConnectionInput,
): Promise<void> {
  await prisma.gitHubConnection.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { githubLogin: input.githubLogin, encryptedToken: input.encryptedToken, scopes: input.scopes },
  });
}

export async function deleteGitHubConnection(userId: string): Promise<void> {
  await prisma.gitHubConnection.deleteMany({ where: { userId } });
}
