/**
 * RFQ configuration — reads server-only environment variables.
 *
 * All values here are derived from the environment and never hardcoded with
 * real credentials. Variables prefixed with NEXT_PUBLIC_ are exposed to the
 * browser; everything else is server-only.
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
   * When true, the application trusts `X-Forwarded-For`/`X-Real-IP` set by a
   * reverse proxy. MUST only be enabled behind a proxy that overwrites these
   * headers; otherwise forwarded headers are client-spoofable.
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
};

/** Max RFQ submissions per IP within the rate-limit window. */
export const RATE_LIMIT_MAX = 5;
/** Rate-limit window in milliseconds (1 hour). */
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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
