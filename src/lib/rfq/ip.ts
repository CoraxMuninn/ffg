import type { NextRequest } from "next/server";

import { RFQ } from "./constants";

/**
 * Resolves a rate-limit key for the RFQ endpoint.
 *
 * `X-Forwarded-For` is only trusted when the application is known to sit behind
 * a reverse proxy that sets/overwrites it (the documented VPS deployment). This
 * is gated by `TRUST_PROXY`; when not set, forwarded headers are NOT trusted so
 * an attacker reaching the app directly cannot spoof distinct IPs to bypass the
 * rate limit. In that case all requests share a single conservative bucket.
 */
export function getClientIp(request: NextRequest): string {
  if (RFQ.trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim();
    if (first && isValidIp(first)) return first;

    const realIp = request.headers.get("x-real-ip");
    if (realIp && isValidIp(realIp)) return realIp;
  }

  // No trusted proxy: do not trust forwarded headers. Use a stable key so
  // spoofing cannot rotate rate-limit buckets.
  return "untrusted";
}

/** Basic IPv4/IPv6 validation to avoid malformed keys in the limiter. */
function isValidIp(value: string): boolean {
  if (value.includes(".")) {
    const parts = value.split(".");
    return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p));
  }
  return /^[0-9a-f:]+$/i.test(value) && value.includes(":");
}
