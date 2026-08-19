/**
 * RFQ API regression suite (audit SEC-M4 / SEC-M5 / SEC-L3 / ARCH-M9;
 * Roadmap Tasks 2.1, 3.2, 3.3).
 *
 * Exercises the real server modules through the `@/lib/rfq` barrel so the
 * tests run against current code, not a transcription of it. Covers the
 * security boundary the route composes: origin/CSRF, request content-type,
 * input validation + sanitization, trusted client-IP extraction, the coarse +
 * strict rate limiters, Turnstile verification (action/hostname/timeout), and
 * email escaping.
 *
 * Run with:  npm test
 */

import type { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";

import {
  hasExpectedContentType,
  isAllowedOrigin,
  checkPreVerification,
  checkSubmission,
  resetRateLimits,
  validateRfqInput,
  verifyTurnstile,
} from "@/lib/rfq";
import { getClientIp } from "@/lib/rfq/ip";
import {
  buildRfqEmailHtml,
  buildRfqEmailText,
  sendRfqEmail,
} from "@/lib/rfq/email";
import {
  LIMITS,
  MESSAGE_MIN_LENGTH,
  PRE_VERIFICATION_MAX,
  RATE_LIMIT_MAX,
} from "@/lib/rfq/constants";
import type { RfqPayload } from "@/lib/rfq/types";
import { validateRfqInputPreFix } from "../__fixtures__/pre-fix";

/** A real, enabled product slug present in content/en/products. */
const VALID_PRODUCT_SLUG = "frozen-chicken-feet";

function validInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Jane Buyer",
    company: "Acme Importers",
    email: "jane@acme.example",
    country: "Germany",
    phone: "+49 30 1234567",
    product: VALID_PRODUCT_SLUG,
    quantity: "20 MT",
    message: "Please quote for monthly shipments to Hamburg port.",
    destinationPort: "Hamburg",
    packaging: "10 kg cartons",
    ...overrides,
  };
}

/** Sets env vars and returns a restore function. */
function setEnv(vars: Record<string, string | undefined>): () => void {
  const saved: Record<string, string | undefined> = {};
  const env = process.env as Record<string, string | undefined>;
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = env[k];
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete env[k];
      else env[k] = v;
    }
  };
}

/* ── origin / CSRF ──────────────────────────────────────────────────────── */

test("isAllowedOrigin accepts the canonical production host over https", () => {
  expect(isAllowedOrigin("https://feizfood.com")).toBe(true);
});
test("isAllowedOrigin accepts the www alias over https", () => {
  expect(isAllowedOrigin("https://www.feizfood.com")).toBe(true);
});
test("isAllowedOrigin rejects the production host over http (no downgrade)", () => {
  expect(isAllowedOrigin("http://feizfood.com")).toBe(false);
});
test("isAllowedOrigin rejects an arbitrary https origin", () => {
  expect(isAllowedOrigin("https://evil.example")).toBe(false);
  expect(isAllowedOrigin("https://attacker.feizfood.com")).toBe(false);
});
test("isAllowedOrigin accepts registered extra origins exactly", () => {
  const restore = setEnv({ RFQ_ALLOWED_ORIGINS: "https://staging.feizfood.com" });
  expect(isAllowedOrigin("https://staging.feizfood.com")).toBe(true);
  expect(isAllowedOrigin("https://staging2.feizfood.com")).toBe(false);
  restore();
});
test("isAllowedOrigin accepts local development hosts", () => {
  expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
});
test("isAllowedOrigin rejects missing, empty, and malformed origins", () => {
  expect(isAllowedOrigin(null)).toBe(false);
  expect(isAllowedOrigin("")).toBe(false);
  expect(isAllowedOrigin("not a url")).toBe(false);
  expect(isAllowedOrigin("ftp://feizfood.com")).toBe(false);
});

/* ── content type ───────────────────────────────────────────────────────── */

test("hasExpectedContentType accepts application/json", () => {
  expect(hasExpectedContentType("application/json")).toBe(true);
  expect(hasExpectedContentType("application/json; charset=utf-8")).toBe(true);
  expect(hasExpectedContentType("  Application/JSON ; charset=utf-8 ")).toBe(true);
});
test("hasExpectedContentType rejects non-JSON media types", () => {
  expect(hasExpectedContentType("text/plain")).toBe(false);
  expect(hasExpectedContentType("multipart/form-data")).toBe(false);
});
test("hasExpectedContentType rejects substrings that only look like JSON", () => {
  expect(hasExpectedContentType("application/jsonp")).toBe(false);
  expect(hasExpectedContentType("text/application/jsonx")).toBe(false);
});
test("hasExpectedContentType rejects missing content type", () => {
  expect(hasExpectedContentType(null)).toBe(false);
  expect(hasExpectedContentType("")).toBe(false);
});

/* ── validation + sanitization ──────────────────────────────────────────── */

test("validateRfqInput accepts a complete valid submission", () => {
  const result = validateRfqInput(validInput());
  expect(result.valid).toBe(true);
  expect(result.payload?.product).toBeTruthy();
});
test("validateRfqInput rejects non-object bodies", () => {
  expect(validateRfqInput(null).error).toBe("INVALID_REQUEST");
  expect(validateRfqInput("a string").error).toBe("INVALID_REQUEST");
  expect(validateRfqInput([1, 2, 3]).error).toBe("INVALID_REQUEST");
});
test("validateRfqInput enforces required fields", () => {
  expect(validateRfqInput(validInput({ name: "" })).error).toBe("REQUIRED");
  expect(validateRfqInput(validInput({ company: "  " })).error).toBe("REQUIRED");
  expect(validateRfqInput(validInput({ country: "" })).error).toBe("REQUIRED");
});
test("validateRfqInput validates email format", () => {
  expect(validateRfqInput(validInput({ email: "not-an-email" })).error).toBe("EMAIL");
  expect(validateRfqInput(validInput({ email: "a@b" })).error).toBe("EMAIL");
});
test("validateRfqInput requires a meaningful quantity", () => {
  expect(validateRfqInput(validInput({ quantity: "" })).error).toBe("QUANTITY");
});
test("validateRfqInput enforces a minimum message length", () => {
  expect(validateRfqInput(validInput({ message: "short" })).error).toBe("MESSAGE");
  expect(validateRfqInput(validInput({ message: "x".repeat(MESSAGE_MIN_LENGTH) })).valid).toBe(true);
});
test("validateRfqInput enforces field length caps", () => {
  expect(validateRfqInput(validInput({ name: "x".repeat(LIMITS.name + 1) })).error).toBe("INVALID");
});
test("validateRfqInput rejects a product not in the CMS allowlist", () => {
  expect(validateRfqInput(validInput({ product: "unicorn-meat" })).error).toBe("PRODUCT");
});
test("validateRfqInput strips CRLF and control characters (header-injection defense)", () => {
  const result = validateRfqInput(
    validInput({ message: "Quote please\r\nBcc: x@evil.example", company: "Acme\r\nCo" }),
  );
  expect(result.valid).toBe(true);
  const payload = result.payload as RfqPayload;
  expect(payload.message).not.toContain("\r");
  expect(payload.message).not.toContain("\n");
  expect(payload.company).not.toContain("\n");
});
test("PRE-FIX: the vulnerable validator leaves CRLF intact", () => {
  const preFix = validateRfqInputPreFix(
    validInput({ message: "Quote please\r\nBcc: x@evil.example" }),
  );
  expect(preFix.payload?.message).toContain("\r\n");
  const current = validateRfqInput(
    validInput({ message: "Quote please\r\nBcc: x@evil.example" }),
  );
  expect((current.payload as RfqPayload).message).not.toContain("\r\n");
});

/* ── client IP / trusted-proxy extraction (SEC-M4) ──────────────────────── */

function rfqRequest(headers: Record<string, string> = {}): NextRequest {
  return new Request("http://localhost:3000/api/rfq", {
    headers,
  }) as unknown as NextRequest;
}

test("getClientIp returns null (not a global bucket) when TRUST_PROXY is unset", () => {
  const restore = setEnv({ TRUST_PROXY: undefined });
  // No global 'untrusted' bucket: the caller simply skips per-client limiting.
  expect(getClientIp(rfqRequest({ "x-forwarded-for": "1.2.3.4" }))).toBe(null);
  restore();
});
test("getClientIp reads the first valid IP from X-Forwarded-For when trusted", () => {
  const restore = setEnv({ TRUST_PROXY: "true" });
  expect(getClientIp(rfqRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  restore();
});
test("getClientIp falls back to X-Real-IP", () => {
  const restore = setEnv({ TRUST_PROXY: "true" });
  expect(getClientIp(rfqRequest({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  restore();
});
test("getClientIp rejects a malformed forwarded value (no trust in garbage)", () => {
  const restore = setEnv({ TRUST_PROXY: "true" });
  expect(getClientIp(rfqRequest({ "x-forwarded-for": "not-an-ip" }))).toBe(null);
  restore();
});
test("getClientIp accepts a valid IPv6 address", () => {
  const restore = setEnv({ TRUST_PROXY: "true" });
  expect(getClientIp(rfqRequest({ "x-forwarded-for": "::1" }))).toBe("::1");
  restore();
});

/* ── rate limiting (SEC-M4: per-key, no global bucket, Retry-After) ─────── */

test("checkSubmission allows RATE_LIMIT_MAX then blocks with Retry-After", () => {
  const key = `sub-${Math.random()}`;
  resetRateLimits(key);
  for (let i = 1; i <= RATE_LIMIT_MAX; i += 1) {
    const d = checkSubmission(key);
    expect(d.allowed, `request ${i}`).toBe(true);
    expect(d.retryAfterSec).toBe(0);
  }
  const blocked = checkSubmission(key);
  expect(blocked.allowed).toBe(false);
  expect(blocked.retryAfterSec).toBeGreaterThan(0);
  resetRateLimits(key);
});

test("checkPreVerification allows PRE_VERIFICATION_MAX then blocks", () => {
  const key = `pre-${Math.random()}`;
  resetRateLimits(key);
  for (let i = 1; i <= PRE_VERIFICATION_MAX; i += 1) {
    expect(checkPreVerification(key).allowed, `attempt ${i}`).toBe(true);
  }
  expect(checkPreVerification(key).allowed).toBe(false);
  resetRateLimits(key);
});

test("rate-limit buckets are independent per client IP (no shared quota)", () => {
  const a = `iso-a-${Math.random()}`;
  const b = `iso-b-${Math.random()}`;
  resetRateLimits(a);
  resetRateLimits(b);
  for (let i = 0; i < RATE_LIMIT_MAX; i += 1) checkSubmission(a);
  // A exhausted, B untouched.
  expect(checkSubmission(a).allowed).toBe(false);
  expect(checkSubmission(b).allowed).toBe(true);
  resetRateLimits(a);
  resetRateLimits(b);
});

test("resetRateLimits clears a key from both limiters", () => {
  const key = `clr-${Math.random()}`;
  resetRateLimits(key);
  for (let i = 0; i < RATE_LIMIT_MAX; i += 1) checkSubmission(key);
  expect(checkSubmission(key).allowed).toBe(false);
  resetRateLimits(key);
  expect(checkSubmission(key).allowed).toBe(true);
});

/* ── Turnstile verification (SEC-M5: action, hostname, timeout) ─────────── */

function mockSiteVerify(response: Record<string, unknown>) {
  const fn = vi.fn<
    (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>
  >(async () => ({
    ok: true,
    status: 200,
    json: async () => response,
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

test("verifyTurnstile skips in development when no secret is set", async () => {
  const restore = setEnv({ TURNSTILE_SECRET_KEY: undefined, NODE_ENV: "development" });
  expect(await verifyTurnstile(undefined)).toBe(true);
  restore();
});

test("verifyTurnstile fails closed in production when no secret is set", async () => {
  const restore = setEnv({ TURNSTILE_SECRET_KEY: undefined, NODE_ENV: "production" });
  expect(await verifyTurnstile("any-token")).toBe(false);
  restore();
});

test("verifyTurnstile rejects a missing token when configured", async () => {
  const restore = setEnv({ TURNSTILE_SECRET_KEY: "sek", NODE_ENV: "production" });
  expect(await verifyTurnstile(undefined)).toBe(false);
  restore();
});

test("verifyTurnstile sends the trusted client IP and accepts a valid token", async () => {
  const restore = setEnv({
    TURNSTILE_SECRET_KEY: "sek",
    NEXT_PUBLIC_TURNSTILE_ACTION: "rfq-submit",
    TURNSTILE_HOSTNAMES: "feizfood.com",
    NODE_ENV: "production",
  });
  const fn = mockSiteVerify({
    success: true,
    action: "rfq-submit",
    hostname: "feizfood.com",
  });
  expect(await verifyTurnstile("good", "203.0.113.7")).toBe(true);
  // The client IP was forwarded for attribution.
  expect(fn.mock.calls[0][1]?.body).toContain("remoteip=203.0.113.7");
  vi.unstubAllGlobals();
  restore();
});

test("verifyTurnstile rejects an action mismatch", async () => {
  const restore = setEnv({
    TURNSTILE_SECRET_KEY: "sek",
    NEXT_PUBLIC_TURNSTILE_ACTION: "rfq-submit",
    NODE_ENV: "production",
  });
  mockSiteVerify({ success: true, action: "other-action", hostname: "feizfood.com" });
  expect(await verifyTurnstile("good")).toBe(false);
  vi.unstubAllGlobals();
  restore();
});

test("verifyTurnstile rejects an unapproved hostname", async () => {
  const restore = setEnv({
    TURNSTILE_SECRET_KEY: "sek",
    NEXT_PUBLIC_TURNSTILE_ACTION: "rfq-submit",
    TURNSTILE_HOSTNAMES: "feizfood.com",
    NODE_ENV: "production",
  });
  mockSiteVerify({ success: true, action: "rfq-submit", hostname: "evil.example" });
  expect(await verifyTurnstile("good")).toBe(false);
  vi.unstubAllGlobals();
  restore();
});

test("verifyTurnstile fails closed on a fetch timeout/error", async () => {
  const restore = setEnv({
    TURNSTILE_SECRET_KEY: "sek",
    NEXT_PUBLIC_TURNSTILE_ACTION: "rfq-submit",
    NODE_ENV: "production",
  });
  vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))));
  expect(await verifyTurnstile("good")).toBe(false);
  vi.unstubAllGlobals();
  restore();
});

/* ── email escaping + classification ────────────────────────────────────── */

const MALICIOUS: RfqPayload = {
  name: "Jane<img src=x onerror=alert(1)>",
  company: "A&Co<b>markup",
  email: "jane@acme.example",
  country: "Germany",
  phone: "",
  product: "Frozen Chicken Feet",
  quantity: "20 MT",
  message: "Quote<svg/onload=alert(2)> please & thanks",
  destinationPort: "",
  packaging: "",
};

test("buildRfqEmailHtml escapes markup in every interpolated field", () => {
  const html = buildRfqEmailHtml(MALICIOUS, "2026-01-01T00:00:00.000Z");
  expect(html).not.toContain("<img src=x onerror=alert(1)>");
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(html).toContain("A&amp;Co&lt;b&gt;markup");
});
test("buildRfqEmailText includes the buyer values without HTML encoding", () => {
  const text = buildRfqEmailText(MALICIOUS, "2026-01-01T00:00:00.000Z");
  expect(text).toContain("New RFQ — Feiz Food Group");
  expect(text).toContain("Quote<svg/onload=alert(2)> please & thanks");
});
test("sendRfqEmail classifies a missing configuration as permanent", async () => {
  const restore = setEnv({
    RESEND_API_KEY: undefined,
    RFQ_TO_EMAIL: undefined,
    RFQ_FROM_EMAIL: undefined,
  });
  const result = await sendRfqEmail(MALICIOUS);
  expect(result.ok).toBe(false);
  expect(result.error).toBe("NOT_CONFIGURED");
  expect(result.category).toBe("permanent");
  restore();
});
