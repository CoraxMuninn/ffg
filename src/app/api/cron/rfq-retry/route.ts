import { NextResponse } from "next/server";

import { RFQ } from "@/lib/rfq/constants";
import { retryPending, sendRfqEmail } from "@/lib/rfq";

/**
 * Internal RFQ outbox-retry endpoint (audit ARCH-M9, Roadmap Task 3.4).
 *
 * Invoked on a schedule (a systemd timer — see docs/DEPLOYMENT.md) to drain
 * pending deliveries that were not picked up by the lazy in-request retry on a
 * quiet site. Protected by a shared `CRON_SECRET` bearer token so it cannot be
 * triggered anonymously. Returns the number of entries processed.
 *
 *   POST /api/cron/rfq-retry
 *   Authorization: Bearer <CRON_SECRET>
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = RFQ.cronSecret;
  if (!secret) {
    // Retry-via-cron is disabled unless a secret is configured.
    return NextResponse.json({ ok: false, error: "DISABLED" }, { status: 404 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!presented || presented !== secret) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const processed = await retryPending(async (key, payload) => {
    const result = await sendRfqEmail(payload, { idempotencyKey: key });
    return { ok: result.ok, category: result.category };
  });

  return NextResponse.json(
    { ok: true, processed },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
