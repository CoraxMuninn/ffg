import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  attemptDelivery,
  getClientIp,
  hasExpectedContentType,
  isAllowedOrigin,
  isHoneypotTriggered,
  retryPending,
  sendRfqEmail,
  validateRfqInput,
  verifyTurnstile,
  checkPreVerification,
  checkSubmission,
  MAX_BODY_BYTES,
  type RfqFormData,
} from "@/lib/rfq";

export const runtime = "nodejs";
/** Reads request headers/cookies and the durable outbox, so never static. */
export const dynamic = "force-dynamic";

/** Accepts a client `Idempotency-Key` or mints a fresh one. */
function resolveIdempotencyKey(header: string | null): string {
  const value = header?.trim();
  if (value && /^[A-Za-z0-9_-]{8,128}$/.test(value)) return value;
  return crypto.randomUUID();
}

function rateLimited(retryAfterSec: number) {
  return NextResponse.json(
    { ok: false, error: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/**
 * POST /api/rfq
 *
 * Flow: content-type → origin → body-size → honeypot → coarse rate limit →
 * validation → Turnstile → submission rate limit → idempotent durable delivery.
 *
 * Reliability: delivery goes through a persistent outbox, so a transient
 * Resend/network failure is retried and a duplicate submission is never sent
 * twice (audit ARCH-M9).
 */
export async function POST(request: NextRequest) {
  // 1. Content type (reject substrings that only look like JSON).
  if (!hasExpectedContentType(request.headers.get("content-type"))) {
    return NextResponse.json({ ok: false, error: "UNSUPPORTED" }, { status: 415 });
  }

  // 2. Origin / CSRF.
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  // 3. Reject oversized bodies before reading (audit SEC-M5).
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  // 4. Parse defensively; cap the bytes actually read as defense in depth.
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  const data = body as Partial<RfqFormData>;

  // 5. Honeypot — silent rejection for bots.
  if (isHoneypotTriggered(data.website)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 6. Coarse per-client rate limit (covers invalid/failed attempts too).
  const clientIp = getClientIp(request);
  if (clientIp) {
    const pre = checkPreVerification(clientIp);
    if (!pre.allowed) return rateLimited(pre.retryAfterSec);
  }

  // 7. Server-side validation + sanitization.
  const result = validateRfqInput(body);
  if (!result.valid || !result.payload) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  // 8. Turnstile verification (bounded, action/hostname-bound, fail-closed).
  const turnstileOk = await verifyTurnstile(data.turnstileToken, clientIp);
  if (!turnstileOk) {
    return NextResponse.json({ ok: false, error: "TURNSTILE_FAILED" }, { status: 400 });
  }

  // 9. Strict per-client limit on accepted submissions.
  if (clientIp) {
    const sub = checkSubmission(clientIp);
    if (!sub.allowed) return rateLimited(sub.retryAfterSec);
  }

  // 10. Idempotent durable delivery.
  const idempotencyKey = resolveIdempotencyKey(request.headers.get("idempotency-key"));

  // Best-effort: drain a few due retries opportunistically (bounded, async).
  void retryPending(
    async (key, payload) => {
      const r = await sendRfqEmail(payload, { idempotencyKey: key });
      return { ok: r.ok, category: r.category };
    },
    { max: 3 },
  ).catch(() => {
    /* lazy retry is best-effort */
  });

  const outcome = await attemptDelivery(
    idempotencyKey,
    result.payload,
    async (payload) => {
      const r = await sendRfqEmail(payload, { idempotencyKey: idempotencyKey });
      return { ok: r.ok, category: r.category };
    },
  );

  if (outcome.kind === "sent") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (outcome.kind === "queued") {
    // Accepted but not yet delivered; the outbox will retry.
    return NextResponse.json({ ok: true, status: "queued" }, { status: 202 });
  }
  // Permanent failure — operator already alerted via the outbox event.
  return NextResponse.json({ ok: false, error: outcome.error }, { status: 502 });
}
