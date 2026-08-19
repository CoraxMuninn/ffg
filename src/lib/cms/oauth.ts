/**
 * GitHub OAuth broker configuration for Decap CMS.
 *
 * Decap's `github` backend is a browser-only client: it can call the GitHub
 * API with a token, but it cannot obtain one, because the OAuth code→token
 * exchange requires a client secret that must never reach the browser. Decap
 * therefore expects an external "OAuth broker" — historically Netlify's — to
 * perform that exchange.
 *
 * Rather than depend on a third-party broker, this project hosts the two
 * endpoints itself (`/api/auth` and `/api/callback`), which keeps the secret
 * server-side on Vercel and adds no new service to the stack.
 *
 * All values are read from the environment; nothing is hardcoded.
 */

// Relative import keeps this security module self-contained; the Vitest suite
// (Roadmap Task 2.1) and the Next bundle both resolve it identically.
// `seo/config` is the site's single source of truth for the canonical domain.
import { SITE_DOMAIN, SITE_URL } from "../seo/config";

/** GitHub OAuth App client ID (public — it appears in the authorize URL). */
export function getClientId(): string | undefined {
  return process.env.GITHUB_OAUTH_CLIENT_ID;
}

/** GitHub OAuth App client secret (server-only — never sent to the browser). */
export function getClientSecret(): string | undefined {
  return process.env.GITHUB_OAUTH_CLIENT_SECRET;
}

/** True when both halves of the OAuth app are configured. */
export function isOAuthConfigured(): boolean {
  return Boolean(getClientId() && getClientSecret());
}

/**
 * Scope requested from GitHub.
 *
 * `public_repo`, not `repo` (audit SEC-M3).
 *
 * `repo` grants read/write to **every** repository the editor can reach,
 * including unrelated private ones. The CMS only ever touches the single
 * public repository named in `public/admin/config.yml`, so that breadth was
 * pure blast radius: a token stolen from the browser reached far beyond this
 * website. `public_repo` is the narrowest GitHub OAuth scope that still allows
 * writing to a public repository, and it grants no private-repository access
 * at all.
 *
 * Decap's GitHub backend performs only repository-content operations
 * (contents, git refs/blobs/trees/commits, pulls, issue labels) plus `/user`
 * to identify the editor — `/user` needs no scope beyond authentication, so
 * `public_repo` covers the entire editorial workflow.
 *
 * A repository-scoped GitHub App would be narrower still, but Decap 3.15.1's
 * GitHub backend cannot use one: it has no installation-token support, and its
 * config schema constrains `auth_scope` to exactly `["repo", "public_repo"]`.
 * See docs/CMS-ADMIN-SETUP.md § "Authorization scope" for that decision.
 *
 * IMPORTANT: this scope depends on `CoraxMuninn/ffg` being public. If the
 * repository is ever made private, `public_repo` stops working and the CMS
 * will fail to load content — see the documented procedure before changing it.
 */
export const OAUTH_SCOPE = "public_repo";

/**
 * Cross-Origin-Opener-Policy for the OAuth broker documents only.
 *
 * Decap's GitHub login is a popup. After GitHub redirects back to
 * `/api/callback`, the popup must still have `window.opener` so it can run
 * the two-step `postMessage` handshake (`authorizing:github` → Decap reply →
 * `authorization:github:success:…`).
 *
 * `same-origin` isolates the popup the moment it returns from github.com.
 * `same-origin-allow-popups` is the correct value for the *opener* (`/admin`)
 * but still forces a browsing-context-group swap when it is set on the popup
 * itself after a cross-origin hop — `window.opener` becomes `null` and the
 * popup stays on "Completing sign-in…". `unsafe-none` is the documented
 * value for OAuth redirect documents; it does not widen the origin allowlist,
 * does not relax state/CSRF, and `postMessage` stays pinned to the approved
 * origin (never `*`). The public site keeps `same-origin`.
 */
export const OAUTH_POPUP_COOP = "unsafe-none";

/**
 * Shown in the callback popup when `window.opener` is missing, instead of
 * hanging forever on "Completing sign-in…".
 */
export const OAUTH_POPUP_LOST_OPENER_MESSAGE =
  "Sign-in could not finish because this window lost its opener. Close it and try Login with GitHub again.";

/** Cookie holding the CSRF state between /api/auth and /api/callback. */
export const STATE_COOKIE = "decap_oauth_state";

/**
 * Path the state cookie is scoped to.
 *
 * Narrowed from `/api` to the exact callback path: `/api/auth` sets the cookie
 * and only `/api/callback` ever reads it, so no other route — including the
 * RFQ endpoints under `/api` — needs to receive it (audit SEC-M2). Because the
 * GitHub redirect is a top-level navigation straight to this path, `SameSite`
 * can stay `Lax`.
 */
export const STATE_COOKIE_PATH = "/api/callback";

/**
 * True when the OAuth state cookie must carry the `Secure` attribute.
 *
 * Tied to the build environment rather than to the request's claimed
 * protocol, which is client-controllable via `X-Forwarded-Proto`.
 */
export function isSecureCookieRequired(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Extra OAuth origins approved for this deployment (comma-separated full
 * origins, e.g. `https://staging.feizfood.com`).
 *
 * Preview/staging deployments must be registered here explicitly. This is a
 * deliberate trade-off (audit SEC-M2): a preview host can no longer authorize
 * itself simply by sending its own `X-Forwarded-Host`.
 */
export function getExtraAllowedOrigins(): string[] {
  const raw = process.env.OAUTH_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/** Local development hostnames, allowed only outside production. */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * True when `host` (a `host[:port]` authority, not a full URL) is loopback.
 *
 * Parsing is delegated to `URL` so that ports, IPv6 brackets, and case are
 * handled the same way everywhere; an unparseable authority is simply not
 * local.
 */
function isLocalHost(host: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(`http://${host}`).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Parses an origin string into its exact canonical form, or `null`.
 *
 * `URL.origin` is used rather than string comparison so the check is on
 * scheme + host + **exact port** (audit SEC-L3): `https://feizfood.com:8443`
 * does not normalize to `https://feizfood.com`. Anything carrying credentials,
 * a path, a query, or a fragment is rejected outright — a value like
 * `https://feizfood.com@evil.example` parses to the *attacker's* host, so it
 * must never survive normalization.
 */
export function normalizeOrigin(value: string): string | null {
  if (!value || value.includes(",")) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) return null;
  if (!parsed.hostname) return null;

  return parsed.origin;
}

/**
 * The exact set of origins this deployment may use as an OAuth destination.
 *
 * Production is fixed to the canonical domain and its `www` alias over HTTPS.
 * Local hosts are added only outside production, so a production build can
 * never be talked into an `http://localhost` redirect.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  const production = normalizeOrigin(SITE_URL);
  if (production) {
    origins.add(production);
    const wwwAlias = normalizeOrigin(`https://www.${SITE_DOMAIN}`);
    if (wwwAlias) origins.add(wwwAlias);
  }

  for (const extra of getExtraAllowedOrigins()) {
    const normalized = normalizeOrigin(extra);
    // Registered origins are still validated: a typo or a bare hostname is
    // dropped rather than silently widening the allowlist.
    if (normalized) origins.add(normalized);
  }

  if (process.env.NODE_ENV !== "production") {
    for (const host of LOCAL_HOSTNAMES) {
      // Any port, because `next dev` is routinely moved off 3000.
      origins.add(`http://${host}`);
    }
  }

  return [...origins];
}

/**
 * True when `origin` is an approved OAuth destination for this deployment.
 *
 * Development loopback matching ignores the port (dev servers move around);
 * every other comparison is exact, including the port.
 */
export function isAllowedOAuthOrigin(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const allowed = getAllowedOrigins();
  if (allowed.includes(normalized)) return true;

  if (process.env.NODE_ENV !== "production") {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" && LOCAL_HOSTNAMES.has(parsed.hostname)) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves this deployment's own origin, or `null` if it cannot be trusted.
 *
 * Previously this returned `${x-forwarded-proto}://${x-forwarded-host}`
 * unconditionally, which let any client rewrite the GitHub `redirect_uri`, the
 * `postMessage` target the token is delivered to, and — via a `http` protocol
 * claim — whether the state cookie was marked Secure (audit SEC-M2).
 *
 * Forwarded headers are now treated as an untrusted *claim*: they still decide
 * which origin is proposed (the app runs behind a proxy that terminates TLS,
 * so they are the only way to learn the public host), but the result is only
 * returned if it appears in the deployment's exact allowlist. An unknown host,
 * a downgraded protocol, an unexpected port, or a malformed value yields
 * `null`, and the caller fails closed instead of continuing with an
 * attacker-chosen destination.
 */
export function resolveOrigin(request: Request): string | null {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  const host = forwardedHost?.trim() || url.host;

  // A proxy may append to an existing header, producing "https, http". Such a
  // value is ambiguous, so it is rejected rather than being split apart.
  const protocol =
    forwardedProto?.trim().toLowerCase() ?? (isLocalHost(host) ? "http" : "https");

  if (protocol !== "http" && protocol !== "https") return null;

  const candidate = normalizeOrigin(`${protocol}://${host}`);
  if (!candidate) return null;

  return isAllowedOAuthOrigin(candidate) ? candidate : null;
}

/**
 * Serializes a value for embedding inside an inline `<script>` element.
 *
 * `JSON.stringify` alone is JavaScript-string-safe but NOT
 * HTML-script-context-safe: the HTML parser finds the `</script>` end tag
 * before the JavaScript parser ever sees the string, so a payload containing
 * `</script>` terminates the element early and everything after it becomes
 * live markup. Escaping `<` and `>` removes that entire class of break-out.
 *
 * `&` is escaped so the value cannot be reconstructed via HTML entities, and
 * U+2028/U+2029 are escaped because they are literal line terminators in
 * JavaScript source (though not in JSON), which would otherwise produce a
 * syntax error or an injected statement break.
 *
 * The result stays valid JSON — the escapes are `\uXXXX` sequences inside the
 * JSON string literal — so the browser parses back the exact original value.
 */
export function serializeForScript(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Generates a single-use CSP nonce for the callback's inline script.
 *
 * Base64 of 16 random bytes: the value must be unpredictable per response,
 * otherwise an attacker who learns it could authorize their own inline script.
 */
export function generateScriptNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Content-Security-Policy for the callback popup response.
 *
 * The document loads no external resources, so everything is denied by default
 * and only the one nonce-tagged inline script is allowed to run. This is the
 * defense-in-depth layer behind `serializeForScript`: even if a future edit
 * reintroduced an injection point, the injected script would carry no nonce
 * and would not execute.
 */
export function callbackCsp(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * Builds the HTML returned by the callback popup.
 *
 * Decap listens for a `postMessage` from the popup in a specific two-step
 * handshake: the popup announces itself, Decap replies, and only then does the
 * popup send the credentials. `message` is a JSON-encoded payload string.
 *
 * The target origin is pinned to this deployment's own origin rather than "*",
 * so the token is never broadcast to an unexpected opener.
 *
 * If `window.opener` is missing (COOP isolation, the page opened as a top-level
 * tab, …) the script stops and replaces the spinner with an explicit error
 * instead of waiting forever for a reply that cannot arrive.
 *
 * Every interpolated value goes through `serializeForScript`, and the script
 * carries `nonce` so it matches the response's `callbackCsp`.
 */
export function renderPopupResponse(
  status: "success" | "error",
  payload: Record<string, unknown>,
  origin: string,
  nonce: string,
): string {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Signing in…</title>
  </head>
  <body>
    <p>Completing sign-in…</p>
    <script nonce="${nonce}">
      (function () {
        var message = ${serializeForScript(message)};
        var origin = ${serializeForScript(origin)};
        function send() {
          if (!window.opener) return;
          window.opener.postMessage(message, origin);
        }
        if (!window.opener) {
          document.body.textContent = ${serializeForScript(
            OAUTH_POPUP_LOST_OPENER_MESSAGE,
          )};
          return;
        }
        window.addEventListener("message", function handler(event) {
          if (event.origin !== origin) return;
          send();
          window.removeEventListener("message", handler);
          window.setTimeout(function () { window.close(); }, 400);
        });
        // Announce readiness; Decap replies, then we send the credentials.
        window.opener.postMessage("authorizing:github", origin);
      })();
    </script>
  </body>
</html>`;
}
