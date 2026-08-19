/**
 * Shared RFQ types.
 *
 * Used by both the client form and the server API so the payload contract stays
 * in one place. `RfqPayload` is the validated, server-side form of the request.
 */

/** Raw values as submitted by the client form. */
export interface RfqFormData {
  name: string;
  company: string;
  email: string;
  country: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
  destinationPort: string;
  packaging: string;
  /** Honeypot — must remain empty for legitimate submissions. */
  website?: string;
  /** Cloudflare Turnstile token (optional when Turnstile is configured). */
  turnstileToken?: string;
}

/** Validated and normalized data passed to the email layer. */
export interface RfqPayload {
  name: string;
  company: string;
  email: string;
  country: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
  destinationPort: string;
  packaging: string;
}

/** Success/error shape returned by the API. */
export interface RfqApiResult {
  ok: boolean;
  error?: string;
}

/**
 * A rate-limit decision for a single key/limiter.
 *
 * `retryAfterMs` is the time the caller must wait before another attempt is
 * admitted; it is surfaced to the client as a `Retry-After` header on 429
 * (audit SEC-M4).
 */
export interface RateLimitDecision {
  allowed: boolean;
  /** Seconds to wait before retrying (0 when allowed). */
  retryAfterSec: number;
  /** Configured maximum for this limiter. */
  limit: number;
  /** Remaining attempts in the current window. */
  remaining: number;
}

/** Lifecycle state of a durable RFQ delivery attempt (audit ARCH-M9). */
export type DeliveryStatus = "pending" | "sent" | "failed";

/**
 * A persisted outbox record. Stores no buyer payload — only the idempotency
 * key and operational metadata — so the on-disk store is not a second copy of
 * buyer PII (audit ARCH-M9 privacy requirement).
 */
export interface OutboxEntry {
  /** Idempotency key (client `Idempotency-Key` or server-generated). */
  key: string;
  status: DeliveryStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  /** Earliest time the next retry may run (epoch ms). */
  nextAttemptAt: number;
  /** Final state timestamp; entries are pruned after retention from here. */
  settledAt: number | null;
  /** Non-PII error category from the last attempt, if any. */
  lastErrorCategory: string | null;
  /**
   * Validated buyer payload, held ONLY while a delivery is pending so a
   * transient failure can be retried. Cleared the instant delivery succeeds so
   * no buyer PII is kept at rest once an enquiry is delivered (audit ARCH-M9).
   */
  payload: RfqPayload | null;
}

/** Buyer-facing outcome semantics for a delivery attempt (audit ARCH-M9). */
export type DeliveryOutcome =
  /** Delivered immediately. */
  | { kind: "sent"; duplicate: boolean }
  /** Accepted and queued for retry after a transient failure. */
  | { kind: "queued" }
  /** Rejected permanently (operator alerted). */
  | { kind: "failed"; error: string };
