import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  isAllowedOrigin,
  isHoneypotTriggered,
  hasExpectedContentType,
  verifyTurnstile,
  validateRfqInput,
  isRateLimited,
  sendRfqEmail,
  getClientIp,
  type RfqFormData,
} from "@/lib/rfq";

/**
 * POST /api/rfq
 *
 * Flow: request → content-type/origin checks → honeypot → Turnstile →
 * server-side validation → rate limit → Resend → sales email.
 *
 * The client never calls Resend directly. The buyer's email becomes the
 * Reply-To; the sender is always the configured verified address.
 */
export async function POST(request: NextRequest) {
  // 1. Method + content-type + origin (same-site CSRF protection).
  if (!hasExpectedContentType(request.headers.get("content-type"))) {
    return NextResponse.json({ ok: false, error: "UNSUPPORTED" }, { status: 415 });
  }
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  // 2. Parse body defensively (reject non-object / oversized).
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 100_000) {
      return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  const data = body as Partial<RfqFormData>;

  // 3. Honeypot — silent rejection for bots.
  if (isHoneypotTriggered(data.website)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 4. Turnstile verification (server-side, secret never leaves the server).
  const turnstileOk = await verifyTurnstile(data.turnstileToken);
  if (!turnstileOk) {
    return NextResponse.json({ ok: false, error: "TURNSTILE_FAILED" }, { status: 400 });
  }

  // 5. Server-side validation + sanitization.
  const result = validateRfqInput(body);
  if (!result.valid || !result.payload) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  // 6. Rate limiting per IP (5/hour).
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  // 7. Send the email via Resend.
  const sendResult = await sendRfqEmail(result.payload);
  if (!sendResult.ok) {
    const status = sendResult.error === "NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ ok: false, error: sendResult.error }, { status });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
