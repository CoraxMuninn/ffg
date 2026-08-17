import { NextResponse } from "next/server";

import {
  OAUTH_SCOPE,
  STATE_COOKIE,
  STATE_COOKIE_PATH,
  getClientId,
  isOAuthConfigured,
  isSecureCookieRequired,
  resolveOrigin,
} from "@/lib/cms/oauth";

/**
 * Step 1 of the Decap CMS GitHub login: redirect to GitHub's authorize page.
 *
 * Decap opens this endpoint in a popup. We generate a single-use `state`
 * value, store it in a short-lived HttpOnly cookie, and hand the same value to
 * GitHub. `/api/callback` then requires the two to match, which is what stops
 * an attacker from replaying a code they obtained elsewhere (CSRF).
 *
 * No secret is used here — only the public client ID.
 */
export const runtime = "nodejs";
/** Reads request headers/cookies, so it must not be statically evaluated. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isOAuthConfigured()) {
    return new NextResponse(
      "GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  // The origin is resolved from an exact allowlist, not from request headers
  // (audit SEC-M2). An unrecognized host must not be turned into a GitHub
  // redirect_uri, so this fails closed rather than falling back to a guess.
  const origin = resolveOrigin(request);

  if (!origin) {
    return new NextResponse(
      "This host is not an approved OAuth origin for this deployment.",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const state = crypto.randomUUID();

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", getClientId() as string);
  authorizeUrl.searchParams.set("redirect_uri", `${origin}/api/callback`);
  authorizeUrl.searchParams.set("scope", OAUTH_SCOPE);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    // Forced on in production: previously this followed the resolved origin,
    // so an `X-Forwarded-Proto: http` claim silently dropped the Secure flag
    // (audit SEC-M2). Production is HTTPS-only, so the flag is unconditional
    // there; local HTTP development still needs it off, or the browser
    // discards the cookie and login breaks.
    secure: isSecureCookieRequired() || origin.startsWith("https://"),
    // The GitHub redirect returns to this origin as a top-level navigation,
    // so Lax is sufficient and stricter than the None the flow would
    // otherwise need.
    sameSite: "lax",
    path: STATE_COOKIE_PATH,
    maxAge: 10 * 60,
  });

  return response;
}
