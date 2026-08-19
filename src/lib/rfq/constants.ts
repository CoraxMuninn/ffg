/**
 * RFQ configuration — reads server-only environment variables.
 *
 * All values are derived from the environment and never hardcoded with real
 * credentials. Variables prefixed with NEXT_PUBLIC_ are exposed to the browser;
 * everything else is server-only. See `.env.example` for the full contract.
 */

export const RFQ = {
  /** Resend API key (server-only). */
  get resendApiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  },
  /** Sales inbox that receives RFQ emails (server-only). */
  get toEmail(): string | undefined {
    return process.env.RFQ_TO_EMAIL;
  },
  /** Verified sender address configured in Resend (server-only). */
  get fromEmail(): string | undefined {
    return process.env.RFQ_FROM_EMAIL;
  },
  /** Cloudflare Turnstile site key (public — safe to expose). */
  get turnstileSiteKey(): string | undefined {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  },
  /** Cloudflare Turnstile secret key (server-only). */
  get turnstileSecretKey(): string | undefined {
    return process.env.TURNSTILE_SECRET_KEY;
  },
  /**
   * Fixed Turnstile action verified server-side (audit SEC-M5). Public so the
   * client widget renders with the same value the broker checks. Required in
   * production when Turnstile is configured.
   */
  get turnstileAction(): string | undefined {
    return process.env.NEXT_PUBLIC_TURNSTILE_ACTION;
  },
  /**
   * Approved widget hostnames (comma-separated). The Turnstile response names
   * the host the challenge rendered on; this is the allowlist it is checked
   * against. Defaults to the canonical site domain and its www alias.
   */
  get turnstileHostnames(): string[] {
    const raw = process.env.TURNSTILE_HOSTNAMES;
    if (!raw) return [];
    return raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  },
  /**
   * When true, the application trusts `X-Forwarded-For`/`X-Real-IP` set by the
   * reverse proxy. MUST only be enabled behind a proxy that overwrites these
   * headers; otherwise forwarded headers are client-spoofable. Required in the
   * supported single-instance VPS deployment (behind Nginx).
   */
  get trustProxy(): boolean {
    return process.env.TRUST_PROXY === "true";
  },
  /**
   * Extra allowed Origin values for RFQ (comma-separated full origins),
   * e.g. https://staging.feizfood.com
   */
  get extraAllowedOrigins(): string[] {
    const raw = process.env.RFQ_ALLOWED_ORIGINS;
    if (!raw) return [];
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  },
  /** Directory for the durable RFQ delivery outbox (server-only). */
  get outboxDir(): string {
    return process.env.RFQ_OUTBOX_DIR ?? ".data";
  },
  /** Hard timeout for a single Resend delivery attempt, in ms. */
  get sendTimeoutMs(): number {
    const raw = Number(process.env.RFQ_SEND_TIMEOUT_MS);
    return Number.isFinite(raw) && raw > 0 ? raw : 8_000;
  },
  /** Hard timeout for the Turnstile siteverify call, in ms. */
  get turnstileTimeoutMs(): number {
    const raw = Number(process.env.TURNSTILE_TIMEOUT_MS);
    return Number.isFinite(raw) && raw > 0 ? raw : 5_000;
  },
  /** Shared secret guarding the internal retry endpoint (server-only). */
  get cronSecret(): string | undefined {
    return process.env.CRON_SECRET;
  },
  /** Optional webhook that receives operator alerts on permanent failure. */
  get operatorAlertWebhook(): string | undefined {
    return process.env.OPERATOR_ALERT_WEBHOOK;
  },
} as const;

/** Accepted-submission limit: max RFQ submissions per IP within the window. */
export const RATE_LIMIT_MAX = 5;
/** Accepted-submission window in milliseconds (1 hour). */
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Coarse pre-verification limit (audit SEC-M4). Counts every attempt that
 * reaches the limiter — including invalid and failed ones — so spam and
 * brute-force Turnstile/validation attempts are bounded before the expensive
 * verification step, without sharing one global bucket across all buyers.
 */
export const PRE_VERIFICATION_MAX = 30;
export const PRE_VERIFICATION_WINDOW_MS = 60 * 60 * 1000;

/** Maximum accepted request body size in bytes (audit SEC-M5). */
export const MAX_BODY_BYTES = 100_000;

/** Field length limits (defensive caps against abuse). */
export const LIMITS = {
  name: 120,
  company: 160,
  email: 254,
  country: 100,
  phone: 40,
  product: 120,
  quantity: 80,
  message: 4000,
  destinationPort: 160,
  packaging: 500,
} as const;

/** Minimum length for the required message field. */
export const MESSAGE_MIN_LENGTH = 10;

/**
 * Email shape used by BOTH the client (inline validation) and the server
 * (authoritative validation). One source of truth (Roadmap Task 6.2) so the two
 * never drift; the server remains stricter overall (length caps, product
 * allowlist, sanitization).
 */
export const RFQ_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Outbox retention: entries are pruned this long after their final state. */
export const OUTBOX_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
/** Maximum delivery attempts before an enquiry is marked permanently failed. */
export const OUTBOX_MAX_ATTEMPTS = 6;
/** Base backoff (ms) between retry attempts; doubled each attempt. */
export const OUTBOX_RETRY_BASE_DELAY_MS = 60_000;
/** Maximum backoff between retry attempts (ms). */
export const OUTBOX_BACKOFF_CAP_MS = 30 * 60 * 1000;
