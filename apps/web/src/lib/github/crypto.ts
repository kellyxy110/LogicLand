// Token encryption for GitHub connections (ADR-022). AES-256-GCM; the key is
// derived (scrypt) from GITHUB_TOKEN_ENC_KEY so any strong secret works. The
// plaintext access token is never stored, logged, or sent to the client.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const SALT = "logicland-github-v1";
const IV_LEN = 12;
const TAG_LEN = 16;

export function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32);
}

/** Encrypt to base64(iv‖tag‖ciphertext). */
export function encryptToken(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Decrypt base64(iv‖tag‖ciphertext); throws on tamper/wrong key. */
export function decryptToken(payload: string, key: Buffer): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** The derived key from env, or null when GITHUB_TOKEN_ENC_KEY is unset. */
export function githubEncKey(): Buffer | null {
  const secret = process.env.GITHUB_TOKEN_ENC_KEY;
  return secret ? deriveKey(secret) : null;
}
