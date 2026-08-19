import { NextResponse } from "next/server";

import {
  OAUTH_POPUP_COOP,
  STATE_COOKIE,
  STATE_COOKIE_PATH,
  callbackCsp,
  generateScriptNonce,
  getClientId,
  getClientSecret,
  isOAuthConfigured,
  renderPopupResponse,
  resolveOrigin,
} from "@/lib/cms/oauth";

/**
 * Step 2 of the Decap CMS GitHub login: exchange the code for a token.
 *
 * GitHub redirects the popup here with `?code=…&state=…`. We verify the state
 * against the cookie set in `/api/auth`, exchange the code for an access token
 * using the server-only client secret, and hand the token to the Decap window
 * via `postMessage`.
 *
 * The token is returned to the opener and never persisted server-side; Decap
 * keeps it in the browser for the editing session, exactly as it does with
 * Netlify's broker.
 *
 * Security note: this endpoint renders an inline script, so every value it
 * embeds is attacker-reachable via the query string. Three layers apply —
 * state is validated before any provider response is handled, provider error
 * text is never reflected, and all interpolation goes through
 * `serializeForScript` under a per-response nonce CSP.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function popup(
  status: "success" | "error",
  payload: Record<string, unknown>,
  origin: string,
  init?: ResponseInit,
) {
  // One nonce per response: it authorizes this document's single inline
  // script and nothing else.
  const nonce = generateScriptNonce();

  const response = new NextResponse(
    renderPopupResponse(status, payload, origin, nonce),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": callbackCsp(nonce),
        // Must stay unsafe-none: see OAUTH_POPUP_COOP. next.config.ts mirrors
        // this so a document that somehow skips the route helper still keeps
        // window.opener after the GitHub hop.
        "Cross-Origin-Opener-Policy": OAUTH_POPUP_COOP,
      },
      ...init,
    },
  );
  // The state cookie is single-use.
  response.cookies.delete({ name: STATE_COOKIE, path: STATE_COOKIE_PATH });
  return response;
}

/**
 * Reads the CSRF state issued by `/api/auth` from the request cookie.
 */
function readStateCookie(request: Request): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
}

export async function GET(request: Request) {
  // Resolved from the deployment allowlist (audit SEC-M2). If the host is not
  // approved we cannot render the popup at all: its whole purpose is to
  // `postMessage` a token, and the only available target would be an
  // unverified attacker-supplied origin. Fail closed with inert plain text.
  const origin = resolveOrigin(request);

  if (!origin) {
    return new NextResponse(
      "This host is not an approved OAuth origin for this deployment.",
      {
        status: 400,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "Cross-Origin-Opener-Policy": OAUTH_POPUP_COOP,
        },
      },
    );
  }

  if (!isOAuthConfigured()) {
    return popup("error", { message: "GitHub OAuth is not configured." }, origin);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  // CSRF: the state must match the value issued by /api/auth. This runs before
  // the denial branch as well as the success branch, so an unsolicited
  // callback — including a crafted `?error=…` link — is rejected outright
  // instead of being rendered back to the editor.
  const expectedState = readStateCookie(request);

  if (!state || !expectedState || expectedState !== state) {
    return popup(
      "error",
      { message: "Invalid or expired authorization state. Please try again." },
      origin,
    );
  }

  // GitHub reports user-facing denials via `error`. The provider's own text is
  // deliberately NOT reflected: it is attacker-controllable via the query
  // string and offers the editor no actionable detail.
  if (oauthError) {
    return popup("error", { message: "Authorization was denied." }, origin);
  }

  if (!code) {
    return popup("error", { message: "Missing authorization code." }, origin);
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: getClientId(),
          client_secret: getClientSecret(),
          code,
          redirect_uri: `${origin}/api/callback`,
        }),
      },
    );

    const data = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!data.access_token) {
      // As above: GitHub's `error_description` is not echoed into the popup.
      return popup("error", { message: "Token exchange failed." }, origin);
    }

    // Decap expects `token` plus the provider name.
    return popup(
      "success",
      { token: data.access_token, provider: "github" },
      origin,
    );
  } catch {
    return popup("error", { message: "Could not reach GitHub." }, origin);
  }
}
