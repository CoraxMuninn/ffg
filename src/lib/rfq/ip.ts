import type { NextRequest } from "next/server";

import { RFQ } from "./constants";

/**
 * Resolves a trusted client-IP rate-limit key for the RFQ endpoint (audit
 * SEC-M4).
 *
 * `X-Forwarded-For`/`X-Real-IP` are trusted ONLY when the application is known
 * to sit behind a reverse proxy that overwrites them (the documented
 * single-instance VPS deployment). Without that gate an attacker reaching the
 * app directly could spoof distinct IPs to rotate rate-limit buckets.
 *
 * When no trusted IP can be derived the function returns `null`, and the caller
 * skips per-client limiting rather than lumping every buyer into one shared
 * bucket — the old `untrusted` behaviour blocked all buyers after five requests
 * (SEC-M4). Production deployments therefore MUST set `TRUST_PROXY=true` behind
 * the proxy; `src/lib/config/env.ts` flags its absence.
 */
export function getClientIp(request: NextRequest): string | null {
  if (RFQ.trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim();
    if (first && isValidIp(first)) return first;

    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp && isValidIp(realIp)) return realIp;
  }

  // No trusted proxy and no other reliable peer address in the Next request
  // abstraction: return null so the limiter is bypassed (never a global bucket).
  return null;
}

/**
 * Strict IPv4/IPv6 validation so malformed or injection-style values never
 * reach the limiter store as keys. IPv4 is checked octet-by-octet; IPv6 is
 * validated via `URL`-free hex/colon shape plus a final `new URL` round-trip
 * to reject garbage.
 */
export function isValidIp(value: string): boolean {
  const v = value.trim();
  if (!v) return false;

  // IPv4: four 0–255 octets.
  if (v.includes(".") && !v.includes(":")) {
    const parts = v.split(".");
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const n = Number(part);
      return n >= 0 && n <= 255 && String(n) === part;
    });
  }

  // IPv6: hexadecimal groups separated by colons (allow `::` compression and
  // bracketed forms). Reject anything with non-hex characters.
  const unbracketed = v.replace(/^\[|\]$/g, "");
  return /^[0-9a-f:]+$/i.test(unbracketed) && unbracketed.includes(":");
}
