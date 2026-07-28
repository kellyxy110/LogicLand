import { describe, expect, it } from "vitest";
import { moderateForPublication } from "./sharing-moderation";

const clean = { name: "index.html", content: "<h1>My Click Counter</h1><p>Press the button!</p>" };

describe("moderation gate", () => {
  it("passes clean content", () => {
    const r = moderateForPublication({ files: [clean] });
    expect(r.passed).toBe(true);
    expect(r.findings).toHaveLength(0);
  });

  it("blocks a leaked API key and never echoes it", () => {
    const secret = "gsk_" + "A".repeat(40);
    const r = moderateForPublication({ files: [{ name: "app.js", content: `const k='${secret}'` }] });
    expect(r.passed).toBe(false);
    expect(r.findings.some((f) => f.category === "secret")).toBe(true);
    expect(JSON.stringify(r.findings)).not.toContain(secret);
  });

  it("blocks a private key block", () => {
    const r = moderateForPublication({
      files: [{ name: "id_rsa", content: "-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n" }],
    });
    expect(r.passed).toBe(false);
  });

  it("blocks email and phone PII", () => {
    const r = moderateForPublication({
      files: [{ name: "about.txt", content: "Contact me at kid@example.com or +1 555 123 9876" }],
    });
    expect(r.passed).toBe(false);
    expect(r.findings.map((f) => f.category)).toEqual(
      expect.arrayContaining(["pii_email", "pii_phone"]),
    );
  });

  it("blocks a street address", () => {
    const r = moderateForPublication({
      files: [{ name: "bio.txt", content: "I live at 12 Maple Street and love coding." }],
    });
    expect(r.passed).toBe(false);
    expect(r.findings.some((f) => f.category === "pii_address")).toBe(true);
  });

  it("warns (does not hard-block) on a social link alone", () => {
    const r = moderateForPublication({
      files: [{ name: "bio.txt", content: "Follow me https://instagram.com/coolkid" }],
    });
    expect(r.findings.some((f) => f.category === "pii_social" && f.severity === "warn")).toBe(true);
    expect(r.passed).toBe(true);
  });

  it("blocks prohibited language", () => {
    const r = moderateForPublication({ files: [{ name: "c.txt", content: "kill yourself" }] });
    expect(r.passed).toBe(false);
    expect(r.findings.some((f) => f.category === "prohibited")).toBe(true);
  });

  it("blocks a connection string with embedded credentials", () => {
    const r = moderateForPublication({
      files: [{ name: "cfg", content: "postgres://user:hunter2@db.example.com:5432/app" }],
    });
    expect(r.passed).toBe(false);
  });
});
