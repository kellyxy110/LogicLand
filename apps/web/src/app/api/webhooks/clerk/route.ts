// Clerk webhook → Prisma user sync.
//
// Registered in the Clerk dashboard at
//   https://logicland.vercel.app/api/webhooks/clerk
// for the user.created / user.updated / user.deleted events. Verifies the Svix
// signature with CLERK_WEBHOOK_SIGNING_SECRET using Node's crypto (no svix dep).
//
// This route is public (see middleware's /api/webhooks matcher) because Clerk,
// not a signed-in user, calls it — the signature check is the auth.
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma, type Role } from "@logicland/database";

export const runtime = "nodejs";

const VALID_ROLES = ["TEACHER", "PARENT", "STUDENT", "ADMIN"];

/** Verify an incoming Svix (Clerk) webhook signature. */
function verify(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  signatureHeader: string,
): boolean {
  // whsec_<base64>; the HMAC key is the decoded portion after the prefix.
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");
  // Header is space-separated "v1,<sig> v1,<sig>"; any match passes.
  return signatureHeader.split(" ").some((part) => {
    const sig = part.split(",")[1] ?? part;
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  if (!verify(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as { type: string; data: Record<string, unknown> };
  const data = event.data;

  if (event.type === "user.created" || event.type === "user.updated") {
    const clerkId = String(data.id);
    const emails = (data.email_addresses as { email_address: string }[] | undefined) ?? [];
    const email = emails[0]?.email_address ?? `${clerkId}@logicland.local`;
    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ") || "Explorer";
    const roleRaw = String(
      (data.public_metadata as { role?: string } | undefined)?.role ?? "STUDENT",
    ).toUpperCase();
    const role = (VALID_ROLES.includes(roleRaw) ? roleRaw : "STUDENT") as Role;

    await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, role },
      create: { clerkId, email, name, role },
    });
  } else if (event.type === "user.deleted") {
    await prisma.user.deleteMany({ where: { clerkId: String(data.id) } });
  }

  return NextResponse.json({ ok: true });
}
