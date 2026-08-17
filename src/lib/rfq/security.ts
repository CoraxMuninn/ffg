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
 * Verifies a Cloudflare Turnstile token server-side.
 *
 * Development: if the secret is unset, the check is skipped (local RFQ UI).
 * Production: missing secret or missing token fails closed — never silently
 * accept submissions without bot verification. Never returns the secret.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = RFQ.turnstileSecretKey;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
