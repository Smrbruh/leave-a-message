import { NextRequest, NextResponse } from "next/server";
import { messageSchema, MAX_REQUEST_BYTES } from "@/lib/validation";
import { deliverToTelegram, TelegramDeliveryError } from "@/lib/telegram";
import { checkRateLimit, checkDuplicate } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  return ip || req.headers.get("x-real-ip") || "unknown";
}

const GENERIC_ERROR = { ok: false, error: "Something went wrong. Please try again." } as const;

export async function POST(req: NextRequest) {
  // 1. Reject oversized payloads outright, before touching JSON.parse.
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { ok: false, error: "That message is too large to send." },
      { status: 413 }
    );
  }

  // 2. Parse the body defensively — malformed JSON should never 500.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  // 3. Validate shape and content.
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid submission.";
    return NextResponse.json({ ok: false, error: firstIssue }, { status: 400 });
  }
  const payload = parsed.data;

  // 4. Honeypot — bots that fill hidden fields get a silent, fake success.
  if (payload.company && payload.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const clientKey = getClientKey(req);

  // 5. Rate limit per client.
  const rateLimit = checkRateLimit(clientKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many messages sent recently. Please try again shortly." },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } }
    );
  }

  // 6. Duplicate-submission guard (double click / accidental retry).
  const isDuplicate = checkDuplicate(clientKey, `${payload.mode}:${payload.name ?? ""}:${payload.message}`);
  if (isDuplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 7. Deliver to Telegram, splitting long messages server-side as needed.
  try {
    await deliverToTelegram(payload);
  } catch (err) {
    if (err instanceof TelegramDeliveryError) {
      console.error("[message] Telegram delivery failed:", err.message);
    } else {
      console.error("[message] Unexpected delivery error:", err);
    }
    return NextResponse.json(GENERIC_ERROR, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
