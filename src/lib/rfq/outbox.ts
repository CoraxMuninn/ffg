import fs from "node:fs";
import path from "node:path";

import {
  OUTBOX_BACKOFF_CAP_MS,
  OUTBOX_MAX_ATTEMPTS,
  OUTBOX_RETRY_BASE_DELAY_MS,
  OUTBOX_RETENTION_MS,
  RFQ,
} from "./constants";
import { emitEvent } from "./events";
import type { DeliveryOutcome, OutboxEntry, RfqPayload } from "./types";

/**
 * Durable, idempotent RFQ delivery outbox (audit ARCH-M9).
 *
 * Guarantees a qualified buyer enquiry is never silently lost or duplicated by
 * a transient Resend/network problem:
 *
 * - **Idempotent**: an entry already in `sent` state short-circuits with no
 *   second send, so duplicate requests or buyer retries produce at most one
 *   sales message.
 * - **Recoverable**: a transient failure leaves the entry `pending` with the
 *   payload retained and a backoff-scheduled retry; `retryPending` re-attempts
 *   (driven lazily by traffic and/or a cron/systemd timer).
 * - **Observable**: every transition emits a structured non-PII event; a
 *   permanent failure raises an operator-visible alert.
 * - **Privacy**: buyer payload is held ONLY while delivery is pending and is
 *   wiped the instant it succeeds. Events/logs never contain payload.
 *
 * Storage is a single JSON file (atomic temp-write + rename), appropriate and
 * safe for the supported single-instance VPS topology: one writer, synchronous
 * I/O, atomic under Node's single-threaded event loop. Retention is documented
 * in DEPLOYMENT.md.
 */

const FILENAME = "rfq-outbox.json";

function outboxPath(): string {
  return path.join(RFQ.outboxDir, FILENAME);
}

type Store = Record<string, OutboxEntry>;

function loadStore(): Store {
  try {
    const raw = fs.readFileSync(outboxPath(), "utf8");
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store): void {
  const dir = RFQ.outboxDir;
  fs.mkdirSync(dir, { recursive: true });
  const target = outboxPath();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, target);
}

/** Prunes settled entries past their retention window (best-effort, in-place). */
function prune(store: Store): void {
  const now = Date.now();
  for (const [key, entry] of Object.entries(store)) {
    if (entry.settledAt !== null && now - entry.settledAt > OUTBOX_RETENTION_MS) {
      delete store[key];
    }
  }
}

export function getEntry(key: string): OutboxEntry | null {
  return loadStore()[key] ?? null;
}

/** Result a delivery attempt callback reports back to the outbox. */
export interface DeliveryAttemptResult {
  ok: boolean;
  /** "permanent" gives up immediately; "transient" schedules a retry. */
  category?: "permanent" | "transient";
}

/**
 * Runs one delivery attempt for `key`, enforcing idempotency and persistence.
 *
 * - An already-`sent` entry returns `{ kind: "sent", duplicate: true }` with no
 *   second send.
 * - A transient failure returns `{ kind: "queued" }` (entry stays `pending`,
 *   payload retained for retry).
 * - A permanent failure, or exceeding `OUTBOX_MAX_ATTEMPTS`, returns
 *   `{ kind: "failed" }`, wipes the payload, and raises an operator alert.
 */
export async function attemptDelivery(
  key: string,
  payload: RfqPayload,
  send: (payload: RfqPayload) => Promise<DeliveryAttemptResult>,
): Promise<DeliveryOutcome> {
  const store = loadStore();
  prune(store);
  const now = Date.now();
  const existing = store[key];

  // Idempotency: a previously delivered enquiry is never re-sent.
  if (existing?.status === "sent") {
    emitEvent({ type: "rfq.duplicate.skipped", level: "info", key });
    return { kind: "sent", duplicate: true };
  }

  const entry: OutboxEntry = existing ?? {
    key,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    nextAttemptAt: now,
    settledAt: null,
    lastErrorCategory: null,
    payload: null,
  };
  // Prefer the stored payload on retry; seed it on first attempt.
  if (!entry.payload) entry.payload = payload;
  const pendingPayload: RfqPayload = entry.payload;

  entry.attempts += 1;
  entry.updatedAt = now;

  let result: DeliveryAttemptResult;
  try {
    result = await send(pendingPayload);
  } catch {
    result = { ok: false, category: "transient" };
  }

  if (result.ok) {
    entry.status = "sent";
    entry.settledAt = now;
    entry.lastErrorCategory = null;
    entry.nextAttemptAt = now;
    entry.payload = null; // wipe buyer PII now that it is delivered
    store[key] = entry;
    saveStore(store);
    emitEvent({ type: "rfq.email.sent", level: "info", key, attempts: entry.attempts });
    return { kind: "sent", duplicate: false };
  }

  const exhausted = entry.attempts >= OUTBOX_MAX_ATTEMPTS;
  const permanent = result.category === "permanent" || exhausted;
  entry.lastErrorCategory = permanent
    ? result.category === "permanent"
      ? "PERMANENT"
      : "EXHAUSTED"
    : "TRANSIENT";

  if (permanent) {
    entry.status = "failed";
    entry.settledAt = now;
    entry.nextAttemptAt = now;
    entry.payload = null; // do not retain PII for a permanently failed enquiry
    store[key] = entry;
    saveStore(store);
    emitEvent({
      type: "rfq.email.permanent_failure",
      level: "error",
      key,
      attempts: entry.attempts,
      reason: entry.lastErrorCategory,
    });
    return { kind: "failed", error: "DELIVERY_FAILED" };
  }

  // Transient: schedule a retry with exponential backoff (capped), keep payload.
  const delay = Math.min(
    OUTBOX_RETRY_BASE_DELAY_MS * 2 ** (entry.attempts - 1),
    OUTBOX_BACKOFF_CAP_MS,
  );
  entry.status = "pending";
  entry.nextAttemptAt = now + delay;
  store[key] = entry;
  saveStore(store);
  emitEvent({
    type: "rfq.email.queued",
    level: "warn",
    key,
    attempts: entry.attempts,
    nextAttemptAt: entry.nextAttemptAt,
  });
  return { kind: "queued" };
}

/**
 * Re-attempts all due pending entries (used by the lazy in-request retry and
 * the cron/systemd-triggered endpoint). Returns the number processed.
 */
export async function retryPending(
  send: (key: string, payload: RfqPayload) => Promise<DeliveryAttemptResult>,
  options: { max?: number; now?: number } = {},
): Promise<number> {
  const store = loadStore();
  prune(store);
  const now = options.now ?? Date.now();
  const max = options.max ?? 10;

  const due = Object.values(store)
    .filter((entry) => entry.status === "pending" && entry.nextAttemptAt <= now && entry.payload)
    .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt)
    .slice(0, max);

  let processed = 0;
  for (const entry of due) {
    // attemptDelivery re-loads and persists atomically per entry.
    await attemptDelivery(entry.key, entry.payload as RfqPayload, (p) => send(entry.key, p));
    processed += 1;
  }
  return processed;
}

/** Test helper: clears the outbox store entirely. */
export function clearOutbox(): void {
  try {
    fs.rmSync(outboxPath(), { force: true });
  } catch {
    /* ignore */
  }
}
