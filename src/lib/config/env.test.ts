/**
 * Environment contract validation suite (audit SEC-M6 / ARCH-M5; Roadmap 3.1).
 *
 * Confirms the health/config gate fails fast on missing/mismatched production
 * variables, non-HTTPS origins, and browser-exposed secrets, and passes a clean
 * production fixture.
 *
 * Run with:  npm test
 */

import { expect, test } from "vitest";

import { classifyEnvironment, validateEnv, type EnvReport } from "@/lib/config/env";

/** A complete, valid production fixture. */
const PROD: Record<string, string> = {
  NODE_ENV: "production",
  GITHUB_OAUTH_CLIENT_ID: "id",
  GITHUB_OAUTH_CLIENT_SECRET: "secret",
  RESEND_API_KEY: "rk",
  RFQ_TO_EMAIL: "sales@feizfood.com",
  RFQ_FROM_EMAIL: "rfq@feizfood.com",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "pk",
  TURNSTILE_SECRET_KEY: "ts",
  NEXT_PUBLIC_TURNSTILE_ACTION: "rfq-submit",
  TRUST_PROXY: "true",
};

/** Runs `validateEnv` against PROD with an overlay, on a clean env slate. */
function report(overlay: Record<string, string | undefined> = {}): EnvReport {
  const env = process.env as unknown as Record<string, string | undefined>;
  const keys = new Set([...Object.keys(PROD), ...Object.keys(overlay)]);
  const saved: Record<string, string | undefined> = {};
  for (const k of keys) saved[k] = env[k];
  try {
    for (const k of keys) delete env[k];
    Object.assign(env, PROD);
    for (const [k, v] of Object.entries(overlay)) {
      if (v === undefined) delete env[k];
      else env[k] = v;
    }
    return validateEnv();
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete env[k];
      else env[k] = saved[k];
    }
  }
}

const errors = (r: EnvReport) =>
  r.problems.filter((p) => p.level === "error").map((p) => p.message);

test("classifyEnvironment maps NODE_ENV to the three classes", () => {
  const cases: Array<[string | undefined, string]> = [
    ["production", "production"],
    ["test", "test"],
    ["development", "development"],
    [undefined, "development"],
  ];
  for (const [nodeEnv, expected] of cases) {
    const env = process.env as unknown as Record<string, string | undefined>;
    const previous = process.env.NODE_ENV;
    if (nodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = nodeEnv;
    try {
      expect(classifyEnvironment()).toBe(expected);
    } finally {
      if (previous === undefined) delete env.NODE_ENV;
      else env.NODE_ENV = previous;
    }
  }
});

test("a clean production fixture passes the health/config gate", () => {
  const r = report();
  expect(r.environment).toBe("production");
  expect(r.ok).toBe(true);
  expect(errors(r)).toEqual([]);
});

test("missing Resend configuration fails the gate in production", () => {
  const r = report({ RESEND_API_KEY: undefined });
  expect(r.ok).toBe(false);
  expect(errors(r).some((m) => m.includes("RESEND_API_KEY"))).toBe(true);
});

test("a Turnstile key without its secret fails the gate", () => {
  const r = report({ TURNSTILE_SECRET_KEY: undefined });
  expect(r.ok).toBe(false);
  expect(errors(r).some((m) => m.includes("TURNSTILE"))).toBe(true);
});

test("OAuth client id without secret fails the gate (paired keys)", () => {
  const r = report({ GITHUB_OAUTH_CLIENT_SECRET: undefined });
  expect(r.ok).toBe(false);
  expect(errors(r).some((m) => m.includes("GITHUB_OAUTH"))).toBe(true);
});

test("a non-HTTPS RFQ origin fails the gate in production", () => {
  const r = report({ RFQ_ALLOWED_ORIGINS: "http://staging.feizfood.com" });
  expect(r.ok).toBe(false);
  expect(errors(r).some((m) => m.includes("https"))).toBe(true);
});

test("a loopback origin is allowed even though it is not HTTPS", () => {
  const r = report({ RFQ_ALLOWED_ORIGINS: "http://localhost:3000" });
  expect(errors(r).some((m) => m.includes("RFQ_ALLOWED_ORIGINS"))).toBe(false);
});

test("a NEXT_PUBLIC_-prefixed secret fails the gate", () => {
  const r = report({ NEXT_PUBLIC_RESEND_API_KEY: "leaked" });
  expect(r.ok).toBe(false);
  expect(errors(r).some((m) => m.includes("NEXT_PUBLIC_RESEND_API_KEY"))).toBe(true);
});

test("production without TRUST_PROXY produces a warning but stays healthy", () => {
  const r = report({ TRUST_PROXY: undefined });
  expect(r.ok).toBe(true); // warning, not error
  expect(r.problems.some((p) => p.level === "warning" && p.message.includes("TRUST_PROXY"))).toBe(true);
});

test("development is lenient: no Resend/Turnstile is not a hard error", () => {
  const r = report({
    NODE_ENV: "development",
    RESEND_API_KEY: undefined,
    RFQ_TO_EMAIL: undefined,
    RFQ_FROM_EMAIL: undefined,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
    TURNSTILE_SECRET_KEY: undefined,
    TRUST_PROXY: undefined,
  });
  expect(r.environment).toBe("development");
  expect(r.ok).toBe(true);
});
