import {
  PRE_VERIFICATION_MAX,
  PRE_VERIFICATION_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "./constants";
import type { RateLimitDecision } from "./types";

/**
 * Fixed-window rate limiter for the RFQ endpoint (audit SEC-M4).
 *
 * State is process-local and therefore appropriate ONLY for the supported
 * single-instance VPS topology (Task 3.1); it is not shared across instances or
 * preserved across restarts, which is documented. What matters here is that the
 * accounting is correct within a process:
 *
 * - **Atomic**: the check is fully synchronous, so under Node's single-threaded
 *   event loop the read–increment–write cannot interleave with another request.
 * - **Store-native expiration**: every entry carries its own `resetAt`; expired
 *   entries are evicted lazily on access and by a periodic sweep, so the store
 *   cannot grow unbounded.
 * - **Per-key quotas**: each key (trusted client IP) gets its own bucket, so
 *   distinct buyers never share one quota and no global bucket exists.
 *
 * The limiter returns a structured decision including `retryAfterSec`, which
 * the route surfaces as a `Retry-After` header on 429.
 */
interface Entry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private readonly store = new Map<string, Entry>();
  private lastSweep = 0;
  private static readonly SWEEP_INTERVAL_MS = 5_000;

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): RateLimitDecision {
    this.sweep();
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        retryAfterSec: 0,
        limit: this.max,
        remaining: this.max - 1,
      };
    }

    if (entry.count >= this.max) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        limit: this.max,
        remaining: 0,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      retryAfterSec: 0,
      limit: this.max,
      remaining: this.max - entry.count,
    };
  }

  /** Removes a key's bucket (mainly for tests). */
  reset(key: string): void {
    this.store.delete(key);
  }

  private sweep(): void {
    const now = Date.now();
    if (now - this.lastSweep < RateLimiter.SWEEP_INTERVAL_MS) return;
    this.lastSweep = now;
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) this.store.delete(key);
    }
  }
}

const preVerificationLimiter = new RateLimiter(
  PRE_VERIFICATION_MAX,
  PRE_VERIFICATION_WINDOW_MS,
);
const submissionLimiter = new RateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

/**
 * Coarse limit applied to every attempt that reaches the limiter (valid,
 * invalid, and failed), bounding brute-force/verification spam per client IP
 * before the expensive Turnstile/validation step (SEC-M4 / SEC-M5).
 */
export function checkPreVerification(ip: string): RateLimitDecision {
  return preVerificationLimiter.check(ip);
}

/** Strict limit applied to accepted submissions about to be delivered. */
export function checkSubmission(ip: string): RateLimitDecision {
  return submissionLimiter.check(ip);
}

/** Test helper: clears both limiters for a key. */
export function resetRateLimits(key: string): void {
  preVerificationLimiter.reset(key);
  submissionLimiter.reset(key);
}
