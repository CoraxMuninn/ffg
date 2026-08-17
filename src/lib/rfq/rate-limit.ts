import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./constants";

/**
 * In-memory rate limiter for the RFQ endpoint.
 *
 * LIMITATIONS (documented):
 * - State lives only in this process's memory. It is NOT shared across multiple
 *   server instances/processes, and it resets when the process restarts.
 * - This is appropriate for a single-instance VPS deployment (the project's
 *   documented hosting target). For a horizontally-scaled deployment, this must
 *   be replaced with a shared store (e.g. Redis) or a CDN/WAF-level limiter.
 *
 * It still provides meaningful protection against simple spam and burst abuse
 * on a single-node deployment, which is the intended scope here.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}

/**
 * Returns true if the key is allowed to make another request, otherwise false.
 */
export function isRateLimited(key: string): boolean {
  cleanup();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX) return true;

  existing.count += 1;
  return false;
}

/** Removes a key from the limiter (mainly useful for tests). */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
