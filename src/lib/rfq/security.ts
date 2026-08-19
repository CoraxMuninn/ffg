import { SITE_DOMAIN } from "@/lib/seo/config";
import { RFQ } from "./constants";

/**
 * RFQ security checks: origin validation, honeypot detection, and Cloudflare
 * Turnstile verification. Each check is independent so it can be composed
 * clearly in the API route.
 */

/**
 * Origin / CSRF protection.
 *
 * This is a same-site form → API architecture. We only accept requests whose
 * Origin header matches the real production hostname (and its `www` alias) over
 * HTTPS, or a local development host. Arbitrary HTTPS origins are rejected.
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  const productionHost = SITE_DOMAIN.toLowerCase();

  // Production hosts must be served over HTTPS.
  if (host === productionHost || host === `www.${productionHost}`) {
    return parsed.protocol === "https:";
  }

  // Local development hosts (http or https on localhost / loopback).
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  }

  // Staging / extra hosts from RFQ_ALLOWED_ORIGINS (full origin, e.g. https://staging.example.com).
  if (RFQ.extraAllowedOrigins.includes(origin)) {
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  }

  return false;
}

/** Honeypot: a field legitimate users never fill. Filled = bot. */
export function isHoneypotTriggered(website: unknown): boolean {
  return typeof website === "string" && website.trim().length > 0;
}

/**
 * Limits accepted request bodies to the documented use case.
 *
 * Parses the media type strictly (split on `;`, trim, lowercase) rather than
 * doing a substring match, which would accept values like `application/jsonp`
 * or `text/application/jsonx`.
 */
export function hasExpectedContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

/**
 * The hostnames a legitimate Turnstile token may have been generated on. The
 * widget renders on the public site, so this is the deployment's canonical
 * domain plus any registered extras (audit SEC-M5). Defaults to the site domain
 * and its `www` alias when no explicit list is configured.
 */
export function getApprovedTurnstileHostnames(): string[] {
  const explicit = RFQ.turnstileHostnames;
  if (explicit.length > 0) return explicit;
  return [SITE_DOMAIN.toLowerCase(), `www.${SITE_DOMAIN.toLowerCase()}`];
}

interface TurnstileSiteVerifyResponse {
  success?: boolean;
  /** The action the widget was rendered with. */
  action?: string;
  /** The hostname the challenge was solved on. */
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token server-side (audit SEC-M5).
 *
 * Beyond `success`, the token is bound to a fixed `action` (matching the value
 * the client widget renders with) and an approved `hostname`, the request is
 * attributed to the trusted client IP (`remoteip`), and the call is bounded by
 * a timeout so an unavailable Cloudflare cannot hang the request. Failed,
 * mismatched, expired, or timed-out verifications fail closed.
 *
 * Development: if the secret is unset, the check is skipped (local RFQ UI).
 * Production: missing secret fails closed — never silently accept submissions
 * without bot verification. Never returns the secret.
 */
export async function verifyTurnstile(
  token: string | undefined,
  clientIp?: string | null,
): Promise<boolean> {
  const secret = RFQ.turnstileSecretKey;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  if (!token) return false;

  let data: TurnstileSiteVerifyResponse;
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (clientIp) form.set("remoteip", clientIp);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        signal: AbortSignal.timeout(RFQ.turnstileTimeoutMs),
      },
    );

    data = (await res.json()) as TurnstileSiteVerifyResponse;
  } catch {
    // Network error or timeout: fail closed. Coarse rate limits ensure a
    // legitimate buyer can retry shortly without enumeration risk.
    return false;
  }

  if (data.success !== true) return false;

  const expectedAction = RFQ.turnstileAction;
  if (expectedAction && data.action !== expectedAction) return false;

  const approved = getApprovedTurnstileHostnames();
  if (approved.length > 0 && (!data.hostname || !approved.includes(data.hostname.toLowerCase()))) {
    return false;
  }

  return true;
}
