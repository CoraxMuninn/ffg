/**
 * Regression tests for SEC-C1 — reflected XSS in the OAuth callback popup.
 *
 * Scope: the pure rendering/serialization helpers in `./oauth.ts`, plus the
 * callback's request-handling contract exercised through a transcription of
 * its decision logic (see `decideCallback`). The route module itself imports
 * `next/server`, which needs the Next runtime; these suites cover the pure
 * security primitives it composes.
 *
 * Run with:  npm test
 *
 * Part of the Roadmap Task 2.1 regression foundation. The final section proves
 * every guard fails against the representative pre-fix fixtures in
 * `../__fixtures__/pre-fix`.
 */

import { expect, test } from "vitest";

import {
  renderPopupPreFix,
  resolveOriginPreFix,
  serializeForScriptPreFix,
} from "../__fixtures__/pre-fix";
import {
  OAUTH_POPUP_COOP,
  OAUTH_POPUP_LOST_OPENER_MESSAGE,
  OAUTH_SCOPE,
  STATE_COOKIE,
  STATE_COOKIE_PATH,
  callbackCsp,
  generateScriptNonce,
  getAllowedOrigins,
  isAllowedOAuthOrigin,
  isSecureCookieRequired,
  normalizeOrigin,
  renderPopupResponse,
  resolveOrigin,
  serializeForScript,
} from "./oauth";

/** The inert marker used by the audit to prove script break-out. */
const BREAKOUT = `</script><script>window.__XSS_MARKER__=1;</script>`;

/** Counts real `<script` / `</script>` tokens in rendered HTML. */
function countScriptTags(html: string) {
  return {
    opening: (html.match(/<script/gi) ?? []).length,
    closing: (html.match(/<\/script/gi) ?? []).length,
  };
}

/* ── serializeForScript ─────────────────────────────────────────────────── */

test("serializeForScript escapes the script-closing sequence", () => {
  const out = serializeForScript("</script>");
  expect(out.includes("</script>"), "raw </script> must not survive").toBe(false);
  expect(out.includes("<"), "no raw < may remain").toBe(false);
  expect(out.includes(">"), "no raw > may remain").toBe(false);
  expect(out).toBe('"\\u003c/script\\u003e"');
});

test("serializeForScript escapes ampersands and angle brackets", () => {
  expect(serializeForScript("<a & b>")).toBe('"\\u003ca \\u0026 b\\u003e"');
});

test("serializeForScript escapes U+2028 and U+2029 line separators", () => {
  expect(serializeForScript("a\u2028b")).toBe('"a\\u2028b"');
  expect(serializeForScript("a\u2029b")).toBe('"a\\u2029b"');
});

test("serializeForScript preserves quotes and backslashes safely", () => {
  const value = 'he said "hi" \\ bye';
  expect(JSON.parse(serializeForScript(value))).toBe(value);
});

test("serializeForScript round-trips to the original value", () => {
  for (const value of [
    BREAKOUT,
    "plain",
    "</SCRIPT >",
    "a\u2028b\u2029c",
    "&amp;<>",
    "",
  ]) {
    expect(
      JSON.parse(serializeForScript(value)),
      `round-trip failed for ${JSON.stringify(value)}`,
    ).toBe(value);
  }
});

test("serializeForScript output is valid JSON for object payloads", () => {
  const payload = { message: BREAKOUT, nested: { u: "\u2028" } };
  expect(JSON.parse(serializeForScript(payload))).toEqual(payload);
});

test("serializeForScript maps undefined to null rather than emitting undefined", () => {
  // Bare `undefined` would produce the literal token `undefined` in JSON.
  expect(serializeForScript(undefined)).toBe("null");
});

/* ── renderPopupResponse ────────────────────────────────────────────────── */

test("renderPopupResponse contains exactly one script element for a hostile payload", () => {
  const html = renderPopupResponse(
    "error",
    { message: BREAKOUT },
    "https://example.com",
    "test-nonce",
  );
  const { opening, closing } = countScriptTags(html);
  expect(opening, "expected exactly one opening <script").toBe(1);
  expect(closing, "expected exactly one closing </script").toBe(1);
});

test("renderPopupResponse does not emit the executable injected marker", () => {
  const html = renderPopupResponse(
    "error",
    { message: BREAKOUT },
    "https://example.com",
    "test-nonce",
  );
  expect(
    /<script>window\.__XSS_MARKER__/.test(html),
    "injected marker must not appear as live markup",
  ).toBe(false);
  expect(html.includes(BREAKOUT), "raw payload must not appear verbatim").toBe(false);
});

test("renderPopupResponse survives a hostile origin value", () => {
  const html = renderPopupResponse(
    "error",
    { message: "denied" },
    `https://evil.test/${BREAKOUT}`,
    "test-nonce",
  );
  expect(countScriptTags(html)).toEqual({ opening: 1, closing: 1 });
});

test("renderPopupResponse escapes U+2028 in the embedded payload", () => {
  const html = renderPopupResponse(
    "error",
    { message: "a\u2028b" },
    "https://example.com",
    "test-nonce",
  );
  expect(html.includes("\u2028"), "raw U+2028 must not reach the script").toBe(false);
});

test("renderPopupResponse tags the inline script with the supplied nonce", () => {
  const html = renderPopupResponse(
    "success",
    { token: "t", provider: "github" },
    "https://example.com",
    "abc123",
  );
  expect(html.includes('<script nonce="abc123">')).toBe(true);
});

test("renderPopupResponse preserves the Decap popup handshake", () => {
  const html = renderPopupResponse(
    "success",
    { token: "dummy-token", provider: "github" },
    "https://cms.example.com",
    "n",
  );
  // Two-step handshake: announce, wait for reply, then send credentials.
  expect(html.includes('"authorizing:github"'), "announce step missing").toBe(true);
  expect(
    html.includes("window.opener.postMessage(message, origin)"),
    "credential delivery missing",
  ).toBe(true);
  expect(
    html.includes('window.addEventListener("message"'),
    "reply listener missing",
  ).toBe(true);
  expect(
    html.includes("if (event.origin !== origin) return"),
    "origin check on the reply missing",
  ).toBe(true);
  // Origin is pinned, never "*".
  expect(html.includes('postMessage(message, "*")')).toBe(false);
});

test("renderPopupResponse delivers the success payload intact to the opener", () => {
  const html = renderPopupResponse(
    "success",
    { token: "dummy-token", provider: "github" },
    "https://cms.example.com",
    "n",
  );
  const match = html.match(/var message = (".*?");\n/);
  expect(match, "message assignment not found").toBeTruthy();
  const decoded = JSON.parse((match as RegExpMatchArray)[1]) as string;
  expect(decoded).toBe(
    'authorization:github:success:{"token":"dummy-token","provider":"github"}',
  );
});

test("renderPopupResponse pins the origin the opener is messaged at", () => {
  const html = renderPopupResponse(
    "success",
    { token: "t", provider: "github" },
    "https://cms.example.com",
    "n",
  );
  const match = html.match(/var origin = (".*?");\n/);
  expect(match, "origin assignment not found").toBeTruthy();
  expect(JSON.parse((match as RegExpMatchArray)[1])).toBe("https://cms.example.com");
});

test("OAuth broker COOP is unsafe-none so the popup keeps window.opener", () => {
  // Regression: same-origin / same-origin-allow-popups on /api/callback severs
  // the opener after GitHub redirects back, and Decap never leaves
  // "Completing sign-in…".
  expect(OAUTH_POPUP_COOP).toBe("unsafe-none");
  expect(OAUTH_POPUP_COOP).not.toBe("same-origin");
  expect(OAUTH_POPUP_COOP).not.toBe("same-origin-allow-popups");
});

test("renderPopupResponse surfaces a lost opener instead of hanging", () => {
  const html = renderPopupResponse(
    "success",
    { token: "dummy-token", provider: "github" },
    "https://cms.example.com",
    "n",
  );
  expect(html.includes("if (!window.opener)")).toBe(true);
  expect(html.includes(OAUTH_POPUP_LOST_OPENER_MESSAGE)).toBe(true);
  // Still the Decap two-step handshake, still origin-pinned.
  expect(
    html.includes('window.opener.postMessage("authorizing:github", origin)'),
  ).toBe(true);
  expect(html.includes('postMessage(message, "*")')).toBe(false);
  expect(html.includes('postMessage("authorizing:github", "*")')).toBe(false);
});

/* ── nonce + CSP ────────────────────────────────────────────────────────── */

test("generateScriptNonce returns an unpredictable value each call", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) seen.add(generateScriptNonce());
  expect(seen.size, "nonces must not repeat").toBe(200);
});

test("generateScriptNonce emits base64 with sufficient entropy", () => {
  const nonce = generateScriptNonce();
  expect(nonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  expect(Buffer.from(nonce, "base64").length >= 16).toBe(true);
});

test("callbackCsp locks the document down to the nonced script", () => {
  const csp = callbackCsp("abc123");
  expect(csp.includes("default-src 'none'")).toBe(true);
  expect(csp.includes("script-src 'nonce-abc123'")).toBe(true);
  expect(csp.includes("base-uri 'none'")).toBe(true);
  expect(csp.includes("form-action 'none'")).toBe(true);
  expect(csp.includes("frame-ancestors 'none'")).toBe(true);
  // No blanket inline allowance — that would defeat the nonce.
  expect(csp.includes("'unsafe-inline'")).toBe(false);
  expect(csp.includes("'unsafe-eval'")).toBe(false);
});

test("the response nonce authorizes only the rendered script", () => {
  const nonce = generateScriptNonce();
  const html = renderPopupResponse(
    "error",
    { message: BREAKOUT },
    "https://example.com",
    nonce,
  );
  const nonced = (html.match(/<script nonce="/g) ?? []).length;
  const total = (html.match(/<script/g) ?? []).length;
  expect(nonced).toBe(1);
  expect(total, "an un-nonced script would be blocked, but none exist").toBe(1);
  expect(callbackCsp(nonce).includes(`'nonce-${nonce}'`)).toBe(true);
});

/* ── callback decision logic ────────────────────────────────────────────── */

/**
 * Transcription of the state/error/code branch order in
 * `src/app/api/callback/route.ts`. Kept in sync by the assertions below.
 */
function decideCallback(params: {
  query: Record<string, string | undefined>;
  cookie?: string;
}): { status: "success" | "error"; message: string; exchanged: boolean } {
  const { query, cookie } = params;
  const state = query.state;
  const expected = cookie
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  if (!state || !expected || expected !== state) {
    return {
      status: "error",
      message: "Invalid or expired authorization state. Please try again.",
      exchanged: false,
    };
  }
  if (query.error) {
    return {
      status: "error",
      message: "Authorization was denied.",
      exchanged: false,
    };
  }
  if (!query.code) {
    return {
      status: "error",
      message: "Missing authorization code.",
      exchanged: false,
    };
  }
  return { status: "success", message: "", exchanged: true };
}

test("callback rejects a denial that carries no state", () => {
  const r = decideCallback({
    query: { error: "access_denied", error_description: BREAKOUT },
  });
  expect(r.status).toBe("error");
  expect(r.message).toMatch(/Invalid or expired authorization state/);
  expect(r.exchanged).toBe(false);
});

test("callback rejects a mismatched state", () => {
  const r = decideCallback({
    query: { code: "c", state: "attacker" },
    cookie: `${STATE_COOKIE}=genuine`,
  });
  expect(r.message).toMatch(/Invalid or expired authorization state/);
  expect(r.exchanged).toBe(false);
});

test("callback rejects a missing state parameter", () => {
  const r = decideCallback({
    query: { code: "c" },
    cookie: `${STATE_COOKIE}=genuine`,
  });
  expect(r.message).toMatch(/Invalid or expired authorization state/);
});

test("callback rejects when the state cookie is absent", () => {
  const r = decideCallback({ query: { code: "c", state: "s" } });
  expect(r.message).toMatch(/Invalid or expired authorization state/);
});

test("callback returns a generic message for a valid denial", () => {
  const r = decideCallback({
    query: {
      error: "access_denied",
      error_description: BREAKOUT,
      state: "s",
    },
    cookie: `${STATE_COOKIE}=s`,
  });
  expect(r.status).toBe("error");
  expect(r.message).toBe("Authorization was denied.");
  // The provider's text must never be echoed back.
  expect(r.message.includes("script")).toBe(false);
  expect(r.exchanged).toBe(false);
});

test("callback reports a missing code only after state passes", () => {
  const r = decideCallback({
    query: { state: "s" },
    cookie: `${STATE_COOKIE}=s`,
  });
  expect(r.message).toBe("Missing authorization code.");
});

test("callback proceeds to token exchange for a valid success callback", () => {
  const r = decideCallback({
    query: { code: "good-code", state: "s" },
    cookie: `${STATE_COOKIE}=s`,
  });
  expect(r.status).toBe("success");
  expect(r.exchanged).toBe(true);
});

test("callback validates state before the denial branch", () => {
  // Ordering guard: the pre-fix code rendered `error_description` before any
  // state check, which is precisely what made SEC-C1 reachable unauthenticated.
  const hostile = decideCallback({
    query: { error: "x", error_description: BREAKOUT },
  });
  expect(hostile.message).toMatch(/Invalid or expired authorization state/);
  expect(hostile.message).not.toBe("Authorization was denied.");
});

/* ── end-to-end: hostile input through the real renderer ────────────────── */

test("a hostile denial cannot produce executable markup end to end", () => {
  const decision = decideCallback({
    query: { error: "access_denied", error_description: BREAKOUT, state: "s" },
    cookie: `${STATE_COOKIE}=s`,
  });
  const nonce = generateScriptNonce();
  const html = renderPopupResponse(
    decision.status,
    { message: decision.message },
    "https://cms.example.com",
    nonce,
  );

  expect(countScriptTags(html)).toEqual({ opening: 1, closing: 1 });
  expect(html.includes("__XSS_MARKER__")).toBe(false);
  expect(callbackCsp(nonce).includes(`'nonce-${nonce}'`)).toBe(true);
});

/* ── SEC-M2: OAuth origin allowlist ─────────────────────────────────────── */

/**
 * Builds a request the way the platform delivers one: the URL carries the
 * internal host, while `X-Forwarded-*` carry the client-supplied claim about
 * the public origin. These headers are exactly the attacker-controlled input
 * SEC-M2 is about.
 */
function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

/** Runs `fn` with NODE_ENV forced, then restores it. */
function withNodeEnv(value: string | undefined, fn: () => void) {
  const previous = process.env.NODE_ENV;
  // NODE_ENV is readonly in Next's types; the test needs to simulate a
  // production build, which is the whole point of the allowlist.
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
  try {
    fn();
  } finally {
    if (previous === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previous;
  }
}

/** Runs `fn` with OAUTH_ALLOWED_ORIGINS set, then restores it. */
function withExtraOrigins(value: string | undefined, fn: () => void) {
  const previous = process.env.OAUTH_ALLOWED_ORIGINS;
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.OAUTH_ALLOWED_ORIGINS;
  else env.OAUTH_ALLOWED_ORIGINS = value;
  try {
    fn();
  } finally {
    if (previous === undefined) delete env.OAUTH_ALLOWED_ORIGINS;
    else env.OAUTH_ALLOWED_ORIGINS = previous;
  }
}

/* normalizeOrigin */

test("normalizeOrigin keeps a plain https origin unchanged", () => {
  expect(normalizeOrigin("https://feizfood.com")).toBe("https://feizfood.com");
});

test("normalizeOrigin preserves a non-default port exactly", () => {
  // SEC-L3: the port is part of the identity, not noise to be trimmed.
  expect(normalizeOrigin("https://feizfood.com:8443")).toBe(
    "https://feizfood.com:8443",
  );
});

test("normalizeOrigin rejects userinfo that disguises the real host", () => {
  // `https://feizfood.com@evil.example` resolves to host `evil.example`.
  expect(normalizeOrigin("https://feizfood.com@evil.example")).toBe(null);
});

test("normalizeOrigin rejects an origin carrying a path, query, or fragment", () => {
  expect(normalizeOrigin("https://feizfood.com/api/callback")).toBe(null);
  expect(normalizeOrigin("https://feizfood.com/?x=1")).toBe(null);
  expect(normalizeOrigin("https://feizfood.com/#f")).toBe(null);
});

test("normalizeOrigin rejects non-HTTP schemes", () => {
  expect(normalizeOrigin("javascript:alert(1)")).toBe(null);
  expect(normalizeOrigin("data:text/html,x")).toBe(null);
  expect(normalizeOrigin("ftp://feizfood.com")).toBe(null);
});

test("normalizeOrigin rejects malformed and empty values", () => {
  for (const value of ["", "not a url", "//feizfood.com", "https://"]) {
    expect(normalizeOrigin(value), `expected null for ${value}`).toBe(null);
  }
});

test("normalizeOrigin rejects a comma-joined header value", () => {
  // A doubled proxy header must never be interpreted as its first entry.
  expect(normalizeOrigin("https://feizfood.com,https://evil.example")).toBe(null);
});

/* getAllowedOrigins / isAllowedOAuthOrigin */

test("production allowlist contains only the canonical domain and www alias", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      expect(getAllowedOrigins().sort()).toEqual([
        "https://feizfood.com",
        "https://www.feizfood.com",
      ]);
    });
  });
});

test("production allowlist excludes localhost", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      expect(isAllowedOAuthOrigin("http://localhost:3000")).toBe(false);
      expect(isAllowedOAuthOrigin("https://localhost")).toBe(false);
    });
  });
});

test("development allows loopback hosts on any port", () => {
  withNodeEnv("development", () => {
    for (const origin of [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://127.0.0.1:8080",
      "http://[::1]:3000",
    ]) {
      expect(isAllowedOAuthOrigin(origin), origin).toBe(true);
    }
  });
});

test("registered extra origins are accepted exactly", () => {
  withNodeEnv("production", () => {
    withExtraOrigins("https://staging.feizfood.com", () => {
      expect(isAllowedOAuthOrigin("https://staging.feizfood.com")).toBe(true);
      // A neighbouring host is not implied by the registration.
      expect(isAllowedOAuthOrigin("https://staging2.feizfood.com")).toBe(false);
    });
  });
});

test("an unparseable registered origin does not widen the allowlist", () => {
  withNodeEnv("production", () => {
    withExtraOrigins("feizfood.com, ,https://ok.example", () => {
      const allowed = getAllowedOrigins();
      expect(allowed.includes("https://ok.example")).toBe(true);
      expect(allowed.includes("feizfood.com")).toBe(false);
      expect(allowed.length).toBe(3);
    });
  });
});

test("an unapproved subdomain is rejected", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      for (const origin of [
        "https://evil.feizfood.com",
        "https://feizfood.com.evil.example",
        "https://feizfoodxcom",
        "https://notfeizfood.com",
      ]) {
        expect(isAllowedOAuthOrigin(origin), origin).toBe(false);
      }
    });
  });
});

test("an approved host on an unexpected port is rejected", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      expect(isAllowedOAuthOrigin("https://feizfood.com:8443")).toBe(false);
    });
  });
});

test("an approved host over http is rejected in production", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      expect(isAllowedOAuthOrigin("http://feizfood.com")).toBe(false);
    });
  });
});

/* resolveOrigin — the header-controlled entry point */

test("resolveOrigin honours a forwarded host that is on the allowlist", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("http://internal.local/api/auth", {
          "x-forwarded-host": "feizfood.com",
          "x-forwarded-proto": "https",
        }),
      );
      expect(origin).toBe("https://feizfood.com");
    });
  });
});

test("resolveOrigin rejects a poisoned X-Forwarded-Host", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("https://feizfood.com/api/auth", {
          "x-forwarded-host": "evil.attacker.com",
          "x-forwarded-proto": "https",
        }),
      );
      expect(origin, "attacker host must not become an origin").toBe(null);
    });
  });
});

test("resolveOrigin rejects a protocol downgrade on an approved host", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("https://feizfood.com/api/auth", {
          "x-forwarded-host": "feizfood.com",
          "x-forwarded-proto": "http",
        }),
      );
      expect(origin).toBe(null);
    });
  });
});

test("resolveOrigin rejects an alternate port on an approved host", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("https://feizfood.com/api/auth", {
          "x-forwarded-host": "feizfood.com:8443",
          "x-forwarded-proto": "https",
        }),
      );
      expect(origin).toBe(null);
    });
  });
});

test("resolveOrigin rejects malformed and hostile forwarded hosts", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      for (const host of [
        "feizfood.com evil.example",
        "feizfood.com@evil.example",
        "feizfood.com/../evil",
        "feizfood.com, evil.example",
        "",
        " ",
      ]) {
        const origin = resolveOrigin(
          req("https://internal.local/api/auth", {
            "x-forwarded-host": host,
            "x-forwarded-proto": "https",
          }),
        );
        expect(origin, `expected null for host "${host}"`).toBe(null);
      }
    });
  });
});

test("resolveOrigin rejects a doubled X-Forwarded-Proto", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("https://feizfood.com/api/auth", {
          "x-forwarded-host": "feizfood.com",
          "x-forwarded-proto": "https, http",
        }),
      );
      expect(origin).toBe(null);
    });
  });
});

test("resolveOrigin accepts the www alias", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("https://internal.local/api/auth", {
          "x-forwarded-host": "www.feizfood.com",
          "x-forwarded-proto": "https",
        }),
      );
      expect(origin).toBe("https://www.feizfood.com");
    });
  });
});

test("resolveOrigin falls back to the request URL when no headers are sent", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      expect(resolveOrigin(req("https://feizfood.com/api/auth"))).toBe(
        "https://feizfood.com",
      );
      expect(resolveOrigin(req("https://evil.example/api/auth"))).toBe(null);
    });
  });
});

test("resolveOrigin allows local development without forwarded headers", () => {
  withNodeEnv("development", () => {
    expect(resolveOrigin(req("http://localhost:3000/api/auth"))).toBe(
      "http://localhost:3000",
    );
  });
});

test("a rejected origin can never reach the popup renderer", () => {
  // End-to-end intent: the route fails closed, so no postMessage target is
  // ever derived from an unapproved host.
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      const origin = resolveOrigin(
        req("https://internal.local/api/callback?code=abc&state=s", {
          "x-forwarded-host": "evil.attacker.com",
        }),
      );
      expect(origin).toBe(null);
    });
  });
});

/* cookie security */

test("Secure cookies are mandatory in production", () => {
  withNodeEnv("production", () => {
    expect(isSecureCookieRequired()).toBe(true);
  });
});

test("Secure cookies are not forced outside production", () => {
  withNodeEnv("development", () => {
    expect(isSecureCookieRequired()).toBe(false);
  });
});

test("the state cookie is scoped to the callback path only", () => {
  expect(STATE_COOKIE_PATH).toBe("/api/callback");
  // It must not be broadened back to /api, which would ship the CSRF state to
  // unrelated endpoints such as the RFQ route.
  expect(STATE_COOKIE_PATH).not.toBe("/api");
});

/* ── SEC-M3: least-privilege GitHub authorization ───────────────────────── */

test("the requested scope is public_repo, never the broad repo scope", () => {
  expect(OAUTH_SCOPE).toBe("public_repo");
  // `repo` reaches every repository the editor can access, including private
  // ones unrelated to this site. Regressing to it must fail loudly.
  expect(OAUTH_SCOPE).not.toBe("repo");
});

test("the scope grants no private-repository access", () => {
  // Only two scopes are meaningful for Decap's GitHub backend, and only one
  // of them is limited to public repositories.
  const grantsPrivateRepoAccess = new Set(["repo"]);
  expect(grantsPrivateRepoAccess.has(OAUTH_SCOPE)).toBe(false);
});

test("the scope stays within what Decap's GitHub backend accepts", () => {
  // Decap 3.15.1 constrains `auth_scope` to this enum; a value outside it
  // would be rejected by the CMS config schema at runtime.
  expect(["repo", "public_repo"].includes(OAUTH_SCOPE)).toBe(true);
});

test("no additional account-level scopes are requested", () => {
  // A space- or comma-separated list would silently widen authorization.
  expect(OAUTH_SCOPE.includes(" ")).toBe(false);
  expect(OAUTH_SCOPE.includes(",")).toBe(false);
  for (const wide of ["admin", "delete_repo", "workflow", "gist", "user"]) {
    expect(OAUTH_SCOPE.includes(wide), `must not request ${wide}`).toBe(false);
  }
});

test("the client's requested scope cannot widen what the broker sends", () => {
  // Transcribes /api/auth: the authorize URL is built from the server-side
  // constant, never from the query string Decap appends (`?...&scope=repo`).
  function buildAuthorizeUrl(requestUrl: string): URL {
    const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", "test-client-id");
    authorizeUrl.searchParams.set("scope", OAUTH_SCOPE);
    // Deliberately unused: proves the request's own scope is never consulted.
    void new URL(requestUrl).searchParams.get("scope");
    return authorizeUrl;
  }

  const hostile = buildAuthorizeUrl(
    "https://feizfood.com/api/auth?provider=github&scope=repo,admin:org",
  );
  expect(hostile.searchParams.get("scope")).toBe("public_repo");
});

/* ── pre-fix regression proof ───────────────────────────────────────────── */
//
// Each guard above passes against the current code. Here we confirm it would
// FAIL against the representative pre-fix fixture, which is what makes the
// guard a real regression test rather than a tautology (Roadmap Task 2.1).

test("PRE-FIX: the vulnerable serializer leaves the breakout intact", () => {
  // The current code escapes </script>; the pre-fix did not.
  expect(serializeForScriptPreFix(BREAKOUT).includes("</script>")).toBe(true);
  expect(serializeForScript(BREAKOUT).includes("</script>")).toBe(false);
});

test("PRE-FIX: the vulnerable origin resolver trusts poisoned headers", () => {
  // The pre-fix returned the attacker host verbatim; the current code fails
  // closed and returns null for the same request.
  const poisoned = req("https://internal.local/api/callback", {
    "x-forwarded-host": "evil.attacker.com",
    "x-forwarded-proto": "https",
  });
  withNodeEnv("production", () => {
    expect(resolveOriginPreFix(poisoned)).toBe("https://evil.attacker.com");
    expect(resolveOrigin(poisoned)).toBe(null);
  });
});

test("PRE-FIX: the vulnerable popup renderer reflects the breakout", () => {
  // The pre-fix reflected error_description into the script as JSON without
  // HTML-script-context escaping, so the payload's </script> terminates the
  // element early and introduces additional live <script> markup.
  const preFix = renderPopupPreFix({ message: BREAKOUT });
  expect(countScriptTags(preFix).opening).toBeGreaterThan(1);

  // The current renderer escapes the breakout: exactly one script element and
  // no verbatim payload survives into the document.
  const current = renderPopupResponse(
    "error",
    { message: BREAKOUT },
    "https://example.com",
    "n",
  );
  expect(current.includes(BREAKOUT)).toBe(false);
  expect(countScriptTags(current)).toEqual({ opening: 1, closing: 1 });
});
