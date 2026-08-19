import { SITE_URL } from "@/lib/seo/config";

/**
 * Typed startup/configuration validation and environment classification (audit
 * SEC-M6 / ARCH-M5, Roadmap Task 3.1).
 *
 * The supported production topology is a single Node process behind Nginx,
 * supervised by systemd (see docs/DEPLOYMENT.md). This module encodes that
 * topology's assumptions so a misconfigured deployment fails fast and visibly —
 * via the `/api/health` check — rather than silently degrading a security
 * control. It never prints secret values.
 */

export type Environment = "development" | "test" | "production";

export interface EnvProblem {
  level: "error" | "warning";
  message: string;
}

export interface EnvReport {
  environment: Environment;
  problems: EnvProblem[];
  /** True when there are no error-level problems. */
  ok: boolean;
}

export function classifyEnvironment(): Environment {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

/** True for loopback hosts (allowed over plain http in any environment). */
function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Server-only variables that must never be exposed to the browser. The matching
 * `NEXT_PUBLIC_*` name existing with a value would leak them into the bundle.
 */
const SECRET_VARS = [
  "RESEND_API_KEY",
  "TURNSTILE_SECRET_KEY",
  "GITHUB_OAUTH_CLIENT_SECRET",
  "RFQ_TO_EMAIL",
  "RFQ_FROM_EMAIL",
  "CRON_SECRET",
];

/**
 * Validates the full environment contract. Called by the health endpoint (and
 * safe to call from instrumentation). Returns a structured report; never throws.
 */
export function validateEnv(): EnvReport {
  const environment = classifyEnvironment();
  const problems: EnvProblem[] = [];
  const isProd = environment === "production";
  const push = (level: EnvProblem["level"], message: string) => problems.push({ level, message });

  // --- Site URL -----------------------------------------------------------
  if (!process.env.SITE_URL && !SITE_URL) {
    push("error", "SITE_URL is not configured.");
  } else if (isProd) {
    const url = SITE_URL;
    if (!url.startsWith("https://")) {
      push("error", `SITE_URL must use https in production (got ${redact(url)}).`);
    }
  }

  // --- Paired GitHub OAuth -------------------------------------------------
  const hasClientId = Boolean(process.env.GITHUB_OAUTH_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.GITHUB_OAUTH_CLIENT_SECRET);
  if (hasClientId !== hasClientSecret) {
    push(
      "error",
      "GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET must both be set or both be unset.",
    );
  }

  // --- Paired Resend delivery ---------------------------------------------
  const hasResendKey = Boolean(process.env.RESEND_API_KEY);
  const hasTo = Boolean(process.env.RFQ_TO_EMAIL);
  const hasFrom = Boolean(process.env.RFQ_FROM_EMAIL);
  if (hasResendKey || hasTo || hasFrom) {
    if (!hasResendKey || !hasTo || !hasFrom) {
      push(
        "error",
        "RESEND_API_KEY, RFQ_TO_EMAIL, and RFQ_FROM_EMAIL must all be set to deliver RFQ emails.",
      );
    }
    if (hasTo && !isValidEmail(process.env.RFQ_TO_EMAIL as string)) {
      push("error", "RFQ_TO_EMAIL is not a valid email address.");
    }
    if (hasFrom && !isValidEmail(process.env.RFQ_FROM_EMAIL as string)) {
      push("error", "RFQ_FROM_EMAIL is not a valid email address.");
    }
  } else if (isProd) {
    push("error", "RFQ email delivery is not configured (RESEND_API_KEY/RFQ_TO_EMAIL/RFQ_FROM_EMAIL).");
  }

  // --- Paired Turnstile ----------------------------------------------------
  const hasSiteKey = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const hasTurnstileSecret = Boolean(process.env.TURNSTILE_SECRET_KEY);
  if (hasSiteKey !== hasTurnstileSecret) {
    push(
      "error",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must both be set or both be unset.",
    );
  }
  if (hasSiteKey && hasTurnstileSecret) {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_ACTION) {
      push("warning", "Turnstile is configured without a fixed action (NEXT_PUBLIC_TURNSTILE_ACTION).");
    }
  } else if (isProd) {
    push("error", "Turnstile bot protection is not configured in production.");
  }

  // --- HTTPS for configured non-loopback origins --------------------------
  const checkOrigins = (raw: string | undefined, label: string) => {
    if (!raw) return;
    for (const value of raw.split(",").map((v) => v.trim()).filter(Boolean)) {
      if (isLoopbackOrigin(value)) continue;
      if (!/^https:\/\//i.test(value)) {
        push("error", `${label} entry "${redact(value)}" must use https in production.`);
      }
    }
  };
  if (isProd) {
    checkOrigins(process.env.OAUTH_ALLOWED_ORIGINS, "OAUTH_ALLOWED_ORIGINS");
    checkOrigins(process.env.RFQ_ALLOWED_ORIGINS, "RFQ_ALLOWED_ORIGINS");
  }

  // --- Trusted proxy (required for per-client rate limiting) --------------
  if (isProd && process.env.TRUST_PROXY !== "true") {
    push(
      "warning",
      "TRUST_PROXY is not 'true': RFQ rate limiting cannot attribute requests to clients behind the proxy.",
    );
  }

  // --- No server secret may be browser-exposed ----------------------------
  for (const secret of SECRET_VARS) {
    if (process.env[`NEXT_PUBLIC_${secret}`]) {
      push("error", `Secret ${secret} must not be exposed via NEXT_PUBLIC_${secret}.`);
    }
  }

  return {
    environment,
    problems,
    ok: problems.every((p) => p.level !== "error"),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** Redacts credentials embedded in a URL/value before it reaches a report. */
function redact(value: string): string {
  return value.replace(/\/\/[^@]+@/, "//***@");
}
