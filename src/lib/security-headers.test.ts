/**
 * Security-header policy regression suite (audit SEC-L1 / SEC-L2 / SEC-M1;
 * Roadmap Task 2.1).
 *
 * Imports the real `next.config.ts` and exercises its `headers()` policy, so
 * the assertions guard the actual configuration rather than a copy of it.
 * Covers the base hardening headers, the per-route CSP posture (public site
 * forbids `unsafe-eval`; admin is the only route that needs it), the removal
 * of unpkg from every directive (SEC-M1 — Decap is self-hosted), and the
 * OAuth-popup COOP/Robots posture.
 *
 * Run with:  npm test
 */

import { beforeAll, expect, test } from "vitest";

import nextConfig from "../../next.config";

interface HeaderEntry {
  key: string;
  value: string;
}
interface RouteGroup {
  source: string;
  headers: HeaderEntry[];
}

const ADMIN = "/admin";
const ADMIN_SUB = "/admin/:path*";
const OAUTH_AUTH = "/api/auth";
const OAUTH_CALLBACK = "/api/callback";
const PUBLIC = "/((?!admin|api/auth|api/callback).*)";

const ALL_GROUPS = [ADMIN, ADMIN_SUB, OAUTH_AUTH, OAUTH_CALLBACK, PUBLIC];
const OAUTH_GROUPS = [OAUTH_AUTH, OAUTH_CALLBACK];

let groups: RouteGroup[] = [];

beforeAll(async () => {
  groups = ((await nextConfig.headers?.()) ?? []) as RouteGroup[];
});

function headersFor(source: string): HeaderEntry[] {
  return groups.find((group) => group.source === source)?.headers ?? [];
}

function get(source: string, key: string): string | undefined {
  return headersFor(source).find((header) => header.key === key)?.value;
}

/* ── base hardening headers are present on every route group ─────────────── */

test("every route group sets a preload HSTS policy", () => {
  for (const source of ALL_GROUPS) {
    const hsts = get(source, "Strict-Transport-Security");
    expect(hsts, `${source} missing HSTS`).toBeDefined();
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  }
});

test("every route group disables MIME sniffing", () => {
  for (const source of ALL_GROUPS) {
    expect(get(source, "X-Content-Type-Options"), source).toBe("nosniff");
  }
});

test("every route group sets a restrictive Referrer-Policy", () => {
  for (const source of ALL_GROUPS) {
    expect(get(source, "Referrer-Policy"), source).toBe(
      "strict-origin-when-cross-origin",
    );
  }
});

test("every route group locks down powerful permissions", () => {
  for (const source of ALL_GROUPS) {
    const policy = get(source, "Permissions-Policy");
    expect(policy, source).toBeDefined();
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  }
});

test("every route group prevents clickjacking via X-Frame-Options", () => {
  for (const source of ALL_GROUPS) {
    expect(get(source, "X-Frame-Options"), source).toBe("SAMEORIGIN");
  }
});

/* ── Content-Security-Policy posture ─────────────────────────────────────── */

test("the public-site CSP forbids unsafe-eval", () => {
  const csp = get(PUBLIC, "Content-Security-Policy");
  expect(csp, "public CSP missing").toBeDefined();
  expect(csp).toContain("default-src 'self'");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'self'");
  expect(csp).toContain("upgrade-insecure-requests");
});

test("the public-site CSP allows the Cloudflare Turnstile integration", () => {
  const csp = get(PUBLIC, "Content-Security-Policy");
  expect(csp).toContain("https://challenges.cloudflare.com");
});

test("the admin CSP scopes unsafe-eval to /admin only (Decap AJV)", () => {
  const csp = get(ADMIN, "Content-Security-Policy");
  expect(csp, "admin CSP missing").toBeDefined();
  expect(csp).toContain("'unsafe-eval'");
  // The public site must NOT inherit this relaxation.
  expect(get(PUBLIC, "Content-Security-Policy")).not.toContain("'unsafe-eval'");
});

test("the admin CSP reaches GitHub for the Decap editorial workflow", () => {
  const csp = get(ADMIN, "Content-Security-Policy");
  expect(csp).toContain("https://api.github.com");
  expect(csp).toContain("form-action 'self' https://github.com");
});

test("unpkg is absent from every CSP directive (Decap is self-hosted)", () => {
  // SEC-M1: the Decap runtime is vendored locally, so no directive may
  // reference unpkg anywhere across the public or admin policies.
  for (const source of [ADMIN, ADMIN_SUB, PUBLIC]) {
    const csp = get(source, "Content-Security-Policy");
    expect(csp, source).toBeDefined();
    expect(csp).not.toContain("unpkg");
  }
});

/* ── OAuth broker route group ────────────────────────────────────────────── */

test("the OAuth broker documents do not isolate from their opener", () => {
  // Decap's handshake needs window.opener after the GitHub redirect. Isolating
  // COOP on these routes is what left /admin stuck on "Completing sign-in…".
  for (const source of OAUTH_GROUPS) {
    expect(get(source, "Cross-Origin-Opener-Policy"), source).toBe(
      "unsafe-none",
    );
  }
});

test("the admin opener may retain popups; the public site stays isolated", () => {
  expect(get(ADMIN, "Cross-Origin-Opener-Policy")).toBe(
    "same-origin-allow-popups",
  );
  expect(get(ADMIN_SUB, "Cross-Origin-Opener-Policy")).toBe(
    "same-origin-allow-popups",
  );
  expect(get(PUBLIC, "Cross-Origin-Opener-Policy")).toBe("same-origin");
});

test("the OAuth route group is not indexed and sets no public CSP", () => {
  // The callback renders its own per-response nonce CSP in the route handler,
  // so this group intentionally carries no static Content-Security-Policy.
  for (const source of OAUTH_GROUPS) {
    expect(get(source, "X-Robots-Tag"), source).toBe("noindex, nofollow");
    expect(get(source, "Content-Security-Policy"), source).toBeUndefined();
  }
});

test("the admin entry is not indexed", () => {
  expect(get(ADMIN, "X-Robots-Tag")).toBe("noindex, nofollow");
});

/* ── low-level hardening (audit SEC-L1; Roadmap Task 3.5) ─────────────────── */

test("the X-Powered-By header is disabled (no framework fingerprint)", () => {
  expect(nextConfig.poweredByHeader).toBe(false);
});

test("the public CSP documents the Next.js unsafe-inline constraint", () => {
  // Next.js 16 inlines its bootstrap scripts without nonces in static output,
  // so script-src 'unsafe-inline' is a verified framework requirement (it
  // would otherwise break hydration). This pins the constraint so the
  // relaxation cannot silently widen beyond the public script-src.
  const csp = get(PUBLIC, "Content-Security-Policy");
  expect(csp).toContain("script-src 'self' 'unsafe-inline'");
});
