/**
 * RFQ delivery outbox regression suite (audit ARCH-M9; Roadmap Task 3.4).
 *
 * Verifies idempotency (at most one sales message per key), transient-failure
 * recovery with payload retained then wiped on success, permanent-failure
 * handling, and exhaustion. Uses an isolated temp outbox per test.
 *
 * Run with:  npm test
 */

import os from "node:os";
import path from "node:path";

import { expect, test, vi } from "vitest";

import { attemptDelivery, clearOutbox, getEntry, retryPending } from "@/lib/rfq/outbox";
import type { RfqPayload } from "@/lib/rfq/types";

const PAYLOAD: RfqPayload = {
  name: "Jane Buyer",
  company: "Acme",
  email: "jane@acme.example",
  country: "Germany",
  phone: "",
  product: "Frozen Chicken Feet",
  quantity: "20 MT",
  message: "Please quote monthly shipments.",
  destinationPort: "",
  packaging: "",
};

/** Points the outbox at a fresh temp dir and returns a cleanup. */
function useTempOutbox(): () => void {
  const dir = path.join(os.tmpdir(), `ffg-outbox-${Math.random().toString(36).slice(2)}`);
  const previous = process.env.RFQ_OUTBOX_DIR;
  process.env.RFQ_OUTBOX_DIR = dir;
  return () => {
    process.env.RFQ_OUTBOX_DIR = previous;
    clearOutbox();
  };
}

test("a duplicate key is delivered at most once (idempotency)", async () => {
  const cleanup = useTempOutbox();
  const send = vi.fn<(payload: RfqPayload) => Promise<{ ok: boolean }>>(async () => ({ ok: true }));

  const first = await attemptDelivery("dup-key", PAYLOAD, send);
  const second = await attemptDelivery("dup-key", PAYLOAD, send);

  expect(first.kind).toBe("sent");
  expect(second.kind).toBe("sent");
  expect((second as { duplicate?: boolean }).duplicate).toBe(true);
  expect(send).toHaveBeenCalledTimes(1);
  cleanup();
});

test("a transient failure queues the enquiry and retains the payload for retry", async () => {
  const cleanup = useTempOutbox();
  let calls = 0;
  const send = vi.fn<(payload: RfqPayload) => Promise<{ ok: boolean; category?: "permanent" | "transient" }>>(async () => {
    calls += 1;
    return calls < 2 ? { ok: false, category: "transient" as const } : { ok: true };
  });

  const first = await attemptDelivery("retry-key", PAYLOAD, send);
  expect(first.kind).toBe("queued");
  const pending = getEntry("retry-key");
  expect(pending?.status).toBe("pending");
  expect(pending?.payload).not.toBeNull();

  const futureNow = Date.now() + 60 * 60 * 1000;
  const processed = await retryPending(async (_key, p) => send(p), { now: futureNow });
  expect(processed).toBe(1);
  expect(getEntry("retry-key")?.status).toBe("sent");
  cleanup();
});

test("payload is wiped the instant delivery succeeds (privacy)", async () => {
  const cleanup = useTempOutbox();
  await attemptDelivery("wipe-key", PAYLOAD, async () => ({ ok: true }));
  const entry = getEntry("wipe-key");
  expect(entry?.status).toBe("sent");
  expect(entry?.payload).toBeNull();
  cleanup();
});

test("a permanent failure fails closed and wipes the payload", async () => {
  const cleanup = useTempOutbox();
  const send = vi.fn<(payload: RfqPayload) => Promise<{ ok: boolean; category: "permanent" | "transient" }>>(
    async () => ({ ok: false, category: "permanent" as const }),
  );

  const outcome = await attemptDelivery("perm-key", PAYLOAD, send);
  expect(outcome.kind).toBe("failed");

  const entry = getEntry("perm-key");
  expect(entry?.status).toBe("failed");
  expect(entry?.payload).toBeNull();
  cleanup();
});

test("transient failures give up after the max attempt count", async () => {
  const cleanup = useTempOutbox();
  const send = vi.fn<(payload: RfqPayload) => Promise<{ ok: boolean; category: "permanent" | "transient" }>>(
    async () => ({ ok: false, category: "transient" as const }),
  );

  const first = await attemptDelivery("exh-key", PAYLOAD, send);
  expect(first.kind).toBe("queued");

  let lastKind = first.kind;
  for (let i = 0; i < 10; i += 1) {
    const outcome = await attemptDelivery("exh-key", PAYLOAD, async (p) => send(p));
    lastKind = outcome.kind;
    if (outcome.kind === "failed") break;
  }
  expect(lastKind).toBe("failed");
  expect(getEntry("exh-key")?.status).toBe("failed");
  cleanup();
});
