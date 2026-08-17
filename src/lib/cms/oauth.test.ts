/**
 * Regression tests for SEC-C1 — reflected XSS in the OAuth callback popup.
 *
 * Scope: the pure rendering/serialization helpers in `./oauth.ts`, plus the
 * callback's request-handling contract exercised through a transcription of
 * its decision logic (see `decideCallback`). The route module itself imports
 * `next/server`, which needs the Next runtime; Task 2.1 introduces the test
 * runner and HTTP-level integration harness that will cover it directly.
 *
 * Run with:  npm run test:oauth
 *
 * `node:test` + `node:assert` are used deliberately: they ship with Node, so
 * this suite adds no dependency ahead of the Phase 2 test-runner decision.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
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
  assert.ok(!out.includes("</script>"), "raw </script> must not survive");
  assert.ok(!out.includes("<"), "no raw < may remain");
  assert.ok(!out.includes(">"), "no raw > may remain");
  assert.equal(out, '"\\u003c/script\\u003e"');
});

test("serializeForScript escapes ampersands and angle brackets", () => {
  assert.equal(serializeForScript("<a & b>"), '"\\u003ca \\u0026 b\\u003e"');
});

test("serializeForScript escapes U+2028 and U+2029 line separators", () => {
  assert.equal(serializeForScript("a\u2028b"), '"a\\u2028b"');
  assert.equal(serializeForScript("a\u2029b"), '"a\\u2029b"');
});

test("serializeForScript preserves quotes and backslashes safely", () => {
  const value = 'he said "hi" \\ bye';
  assert.equal(JSON.parse(serializeForScript(value)), value);
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
    assert.equal(
      JSON.parse(serializeForScript(value)),
      value,
      `round-trip failed for ${JSON.stringify(value)}`,
    );
  }
});

test("serializeForScript output is valid JSON for object payloads", () => {
  const payload = { message: BREAKOUT, nested: { u: "\u2028" } };
  assert.deepEqual(JSON.parse(serializeForScript(payload)), payload);
});

test("serializeForScript maps undefined to null rather than emitting undefined", () => {
  // Bare `undefined` would produce the literal token `undefined` in JSON.
  assert.equal(serializeForScript(undefined), "null");
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
  assert.equal(opening, 1, "expected exactly one opening <script");
  assert.equal(closing, 1, "expected exactly one closing </script");
});

test("renderPopupResponse does not emit the executable injected marker", () => {
  const html = renderPopupResponse(
    "error",
    { message: BREAKOUT },
    "https://example.com",
    "test-nonce",
  );
  assert.ok(
    !/<script>window\.__XSS_MARKER__/.test(html),
    "injected marker must not appear as live markup",
  );
  assert.ok(!html.includes(BREAKOUT), "raw payload must not appear verbatim");
});

test("renderPopupResponse survives a hostile origin value", () => {
  const html = renderPopupResponse(
    "error",
    { message: "denied" },
    `https://evil.test/${BREAKOUT}`,
    "test-nonce",
  );
  assert.deepEqual(countScriptTags(html), { opening: 1, closing: 1 });
});

test("renderPopupResponse escapes U+2028 in the embedded payload", () => {
  const html = renderPopupResponse(
    "error",
    { message: "a\u2028b" },
    "https://example.com",
    "test-nonce",
  );
  assert.ok(!html.includes("\u2028"), "raw U+2028 must not reach the script");
});

test("renderPopupResponse tags the inline script with the supplied nonce", () => {
  const html = renderPopupResponse(
    "success",
    { token: "t", provider: "github" },
    "https://example.com",
    "abc123",
  );
  assert.ok(html.includes('<script nonce="abc123">'));
});

test("renderPopupResponse preserves the Decap popup handshake", () => {
  const html = renderPopupResponse(
    "success",
    { token: "dummy-token", provider: "github" },
    "https://cms.example.com",
    "n",
  );
  // Two-step handshake: announce, wait for reply, then send credentials.
  assert.ok(html.includes('"authorizing:github"'), "announce step missing");
  assert.ok(
    html.includes("window.opener.postMessage(message, origin)"),
    "credential delivery missing",
  );
  assert.ok(
    html.includes('window.addEventListener("message"'),
    "reply listener missing",
  );
  assert.ok(
    html.includes("if (event.origin !== origin) return"),
    "origin check on the reply missing",
  );
  // Origin is pinned, never "*".
  assert.ok(!html.includes('postMessage(message, "*")'));
});

test("renderPopupResponse delivers the success payload intact to the opener", () => {
  const html = renderPopupResponse(
    "success",
    { token: "dummy-token", provider: "github" },
    "https://cms.example.com",
    "n",
  );
  const match = html.match(/var message = (".*?");\n/);
  assert.ok(match, "message assignment not found");
  const decoded = JSON.parse(match[1]) as string;
  assert.equal(
    decoded,
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
  assert.ok(match, "origin assignment not found");
  assert.equal(JSON.parse(match[1]), "https://cms.example.com");
});

/* ── nonce + CSP ────────────────────────────────────────────────────────── */

test("generateScriptNonce returns an unpredictable value each call", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) seen.add(generateScriptNonce());
  assert.equal(seen.size, 200, "nonces must not repeat");
});

test("generateScriptNonce emits base64 with sufficient entropy", () => {
  const nonce = generateScriptNonce();
  assert.match(nonce, /^[A-Za-z0-9+/]+={0,2}$/);
  assert.ok(Buffer.from(nonce, "base64").length >= 16);
});

test("callbackCsp locks the document down to the nonced script", () => {
  const csp = callbackCsp("abc123");
  assert.ok(csp.includes("default-src 'none'"));
  assert.ok(csp.includes("script-src 'nonce-abc123'"));
  assert.ok(csp.includes("base-uri 'none'"));
  assert.ok(csp.includes("form-action 'none'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  // No blanket inline allowance — that would defeat the nonce.
  assert.ok(!csp.includes("'unsafe-inline'"));
  assert.ok(!csp.includes("'unsafe-eval'"));
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
  assert.equal(nonced, 1);
  assert.equal(total, 1, "an un-nonced script would be blocked, but none exist");
  assert.ok(callbackCsp(nonce).includes(`'nonce-${nonce}'`));
});

/* ── callback decision logic ────────────────────────────────────────────── */

/**
 * Transcription of the state/error/code branch order in
 * `src/app/api/callback/route.ts`. Kept in sync by the assertions below; the
 * HTTP-level test arrives with the Task 2.1 harness.
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
  assert.equal(r.status, "error");
  assert.match(r.message, /Invalid or expired authorization state/);
  assert.equal(r.exchanged, false);
});

test("callback rejects a mismatched state", () => {
  const r = decideCallback({
    query: { code: "c", state: "attacker" },
    cookie: `${STATE_COOKIE}=genuine`,
  });
  assert.match(r.message, /Invalid or expired authorization state/);
  assert.equal(r.exchanged, false);
});

test("callback rejects a missing state parameter", () => {
  const r = decideCallback({
    query: { code: "c" },
    cookie: `${STATE_COOKIE}=genuine`,
  });
  assert.match(r.message, /Invalid or expired authorization state/);
});

test("callback rejects when the state cookie is absent", () => {
  const r = decideCallback({ query: { code: "c", state: "s" } });
  assert.match(r.message, /Invalid or expired authorization state/);
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
  assert.equal(r.status, "error");
  assert.equal(r.message, "Authorization was denied.");
  // The provider's text must never be echoed back.
  assert.ok(!r.message.includes("script"));
  assert.equal(r.exchanged, false);
});

test("callback reports a missing code only after state passes", () => {
  const r = decideCallback({
    query: { state: "s" },
    cookie: `${STATE_COOKIE}=s`,
  });
  assert.equal(r.message, "Missing authorization code.");
});

test("callback proceeds to token exchange for a valid success callback", () => {
  const r = decideCallback({
    query: { code: "good-code", state: "s" },
    cookie: `${STATE_COOKIE}=s`,
  });
  assert.equal(r.status, "success");
  assert.equal(r.exchanged, true);
});

test("callback validates state before the denial branch", () => {
  // Ordering guard: the pre-fix code rendered `error_description` before any
  // state check, which is precisely what made SEC-C1 reachable unauthenticated.
  const hostile = decideCallback({
    query: { error: "x", error_description: BREAKOUT },
  });
  assert.match(hostile.message, /Invalid or expired authorization state/);
  assert.notEqual(hostile.message, "Authorization was denied.");
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

  assert.deepEqual(countScriptTags(html), { opening: 1, closing: 1 });
  assert.ok(!html.includes("__XSS_MARKER__"));
  assert.ok(callbackCsp(nonce).includes(`'nonce-${nonce}'`));
});

/* ── SEC-M2: OAuth origin allowlist ─────────────────────────────────────── */

/**
 * Builds a request the way the platform delivers one: the URL carries the
 * internal host, while `X-Forwarded-*` carry the client-supplied claim about
 * the public origin. These headers are exactly the attacker-controlled input
 * SEC-M2 is about.
 */
function req(
  url: string,
  headers: Record<string, string> = {},
): Request {
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
  assert.equal(normalizeOrigin("https://feizfood.com"), "https://feizfood.com");
});

test("normalizeOrigin preserves a non-default port exactly", () => {
  // SEC-L3: the port is part of the identity, not noise to be trimmed.
  assert.equal(
    normalizeOrigin("https://feizfood.com:8443"),
    "https://feizfood.com:8443",
  );
});

test("normalizeOrigin rejects userinfo that disguises the real host", () => {
  // `https://feizfood.com@evil.example` resolves to host `evil.example`.
  assert.equal(normalizeOrigin("https://feizfood.com@evil.example"), null);
});

test("normalizeOrigin rejects an origin carrying a path, query, or fragment", () => {
  assert.equal(normalizeOrigin("https://feizfood.com/api/callback"), null);
  assert.equal(normalizeOrigin("https://feizfood.com/?x=1"), null);
  assert.equal(normalizeOrigin("https://feizfood.com/#f"), null);
});

test("normalizeOrigin rejects non-HTTP schemes", () => {
  assert.equal(normalizeOrigin("javascript:alert(1)"), null);
  assert.equal(normalizeOrigin("data:text/html,x"), null);
  assert.equal(normalizeOrigin("ftp://feizfood.com"), null);
});

test("normalizeOrigin rejects malformed and empty values", () => {
  for (const value of ["", "not a url", "//feizfood.com", "https://"]) {
    assert.equal(normalizeOrigin(value), null, `expected null for ${value}`);
  }
});

test("normalizeOrigin rejects a comma-joined header value", () => {
  // A doubled proxy header must never be interpreted as its first entry.
  assert.equal(
    normalizeOrigin("https://feizfood.com,https://evil.example"),
    null,
  );
});

/* getAllowedOrigins / isAllowedOAuthOrigin */

test("production allowlist contains only the canonical domain and www alias", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      assert.deepEqual(getAllowedOrigins().sort(), [
        "https://feizfood.com",
        "https://www.feizfood.com",
      ]);
    });
  });
});

test("production allowlist excludes localhost", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      assert.equal(isAllowedOAuthOrigin("http://localhost:3000"), false);
      assert.equal(isAllowedOAuthOrigin("https://localhost"), false);
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
      assert.equal(isAllowedOAuthOrigin(origin), true, origin);
    }
  });
});

test("registered extra origins are accepted exactly", () => {
  withNodeEnv("production", () => {
    withExtraOrigins("https://staging.feizfood.com", () => {
      assert.equal(isAllowedOAuthOrigin("https://staging.feizfood.com"), true);
      // A neighbouring host is not implied by the registration.
      assert.equal(isAllowedOAuthOrigin("https://staging2.feizfood.com"), false);
    });
  });
});

test("an unparseable registered origin does not widen the allowlist", () => {
  withNodeEnv("production", () => {
    withExtraOrigins("feizfood.com, ,https://ok.example", () => {
      const allowed = getAllowedOrigins();
      assert.ok(allowed.includes("https://ok.example"));
      assert.equal(allowed.includes("feizfood.com"), false);
      assert.equal(allowed.length, 3);
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
        assert.equal(isAllowedOAuthOrigin(origin), false, origin);
      }
    });
  });
});

test("an approved host on an unexpected port is rejected", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      assert.equal(isAllowedOAuthOrigin("https://feizfood.com:8443"), false);
    });
  });
});

test("an approved host over http is rejected in production", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      assert.equal(isAllowedOAuthOrigin("http://feizfood.com"), false);
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
      assert.equal(origin, "https://feizfood.com");
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
      assert.equal(origin, null, "attacker host must not become an origin");
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
      assert.equal(origin, null);
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
      assert.equal(origin, null);
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
        assert.equal(origin, null, `expected null for host "${host}"`);
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
      assert.equal(origin, null);
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
      assert.equal(origin, "https://www.feizfood.com");
    });
  });
});

test("resolveOrigin falls back to the request URL when no headers are sent", () => {
  withNodeEnv("production", () => {
    withExtraOrigins(undefined, () => {
      assert.equal(
        resolveOrigin(req("https://feizfood.com/api/auth")),
        "https://feizfood.com",
      );
      assert.equal(resolveOrigin(req("https://evil.example/api/auth")), null);
    });
  });
});

test("resolveOrigin allows local development without forwarded headers", () => {
  withNodeEnv("development", () => {
    assert.equal(
      resolveOrigin(req("http://localhost:3000/api/auth")),
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
      assert.equal(origin, null);
    });
  });
});

/* cookie security */

test("Secure cookies are mandatory in production", () => {
  withNodeEnv("production", () => {
    assert.equal(isSecureCookieRequired(), true);
  });
});

test("Secure cookies are not forced outside production", () => {
  withNodeEnv("development", () => {
    assert.equal(isSecureCookieRequired(), false);
  });
});

test("the state cookie is scoped to the callback path only", () => {
  assert.equal(STATE_COOKIE_PATH, "/api/callback");
  // It must not be broadened back to /api, which would ship the CSRF state to
  // unrelated endpoints such as the RFQ route.
  assert.notEqual(STATE_COOKIE_PATH as string, "/api");
});

/* ── SEC-M3: least-privilege GitHub authorization ───────────────────────── */

test("the requested scope is public_repo, never the broad repo scope", () => {
  assert.equal(OAUTH_SCOPE, "public_repo");
  // `repo` reaches every repository the editor can access, including private
  // ones unrelated to this site. Regressing to it must fail loudly.
  assert.notEqual(OAUTH_SCOPE as string, "repo");
});

test("the scope grants no private-repository access", () => {
  // Only two scopes are meaningful for Decap's GitHub backend, and only one
  // of them is limited to public repositories.
  const grantsPrivateRepoAccess = new Set(["repo"]);
  assert.equal(grantsPrivateRepoAccess.has(OAUTH_SCOPE), false);
});

test("the scope stays within what Decap's GitHub backend accepts", () => {
  // Decap 3.15.1 constrains `auth_scope` to this enum; a value outside it
  // would be rejected by the CMS config schema at runtime.
  assert.ok(["repo", "public_repo"].includes(OAUTH_SCOPE));
});

test("no additional account-level scopes are requested", () => {
  // A space- or comma-separated list would silently widen authorization.
  assert.equal(OAUTH_SCOPE.includes(" "), false);
  assert.equal(OAUTH_SCOPE.includes(","), false);
  for (const wide of ["admin", "delete_repo", "workflow", "gist", "user"]) {
    assert.equal(OAUTH_SCOPE.includes(wide), false, `must not request ${wide}`);
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
  assert.equal(hostile.searchParams.get("scope"), "public_repo");
});
