import { RFQ } from "./constants";

/**
 * Structured, non-PII operational events for the RFQ delivery pipeline (audit
 * ARCH-M9). Every event is emitted as a single JSON line on stdout so a log
 * aggregator can consume it, and carries the idempotency `key` as a correlation
 * id. Buyer payload (names, emails, message text) is NEVER logged.
 *
 * Error-level events additionally trigger the optional operator-alert webhook
 * (best-effort, bounded) so permanent delivery failures are visible to
 * operators without polling.
 */

export type EventLevel = "info" | "warn" | "error";

export interface OperationalEvent {
  /** Stable event type, e.g. `rfq.email.sent`. */
  type: string;
  level: EventLevel;
  /** Idempotency key — a correlation id, never buyer PII. */
  key: string;
  [field: string]: unknown;
}

const isSilent = process.env.RFQ_EVENTS_SILENT === "true";

/** Emits a structured JSON event line. No-op in the test environment. */
export function emitEvent(event: OperationalEvent): void {
  if (process.env.NODE_ENV === "test" || isSilent) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event });
  console.log(line);

  if (event.level === "error") {
    void notifyOperator(event).catch(() => {
      /* alert delivery is best-effort; never throw */
    });
  }
}

/**
 * Best-effort operator alert via the configured webhook. Fire-and-forget and
 * bounded so it can never block the request path.
 */
async function notifyOperator(event: OperationalEvent): Promise<void> {
  const webhook = RFQ.operatorAlertWebhook;
  if (!webhook) return;
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(3_000),
  }).catch(() => {
    /* ignore — alerting is best-effort */
  });
}
