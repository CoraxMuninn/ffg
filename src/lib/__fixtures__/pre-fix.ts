/**
 * Representative PRE-FIX (unsafe) implementations of the security-sensitive
 * code paths under test.
 *
 * These intentionally reproduce the vulnerable behaviour the Phase 1 fixes
 * removed (audit SEC-C1 / SEC-M2 and the RFQ hardening), so the regression
 * suites can *prove* their assertions are meaningful: every guard that passes
 * against the current code is shown to FAIL against the matching pre-fix
 * fixture (Roadmap Task 2.1 verification — "tests fail against representative
 * pre-fix unsafe fixtures and pass against current code").
 *
 * They are deliberately not imported by any production module. They live under
 * `__fixtures__/` and are consumed only by the `*.test.ts` suites.
 */

/**
 * Pre-fix serializer: plain `JSON.stringify` with no HTML-script-context
 * escaping. The HTML parser finds the literal `</script>` before JavaScript
 * ever sees the string, so a payload containing it breaks out of the inline
 * script element (SEC-C1).
 */
export function serializeForScriptPreFix(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * Pre-fix origin resolution: trusts `X-Forwarded-Host` / `X-Forwarded-Proto`
 * unconditionally. Any client could rewrite the GitHub `redirect_uri`, the
 * `postMessage` target, and (via an `http` claim) the cookie `Secure` flag
 * (SEC-M2). Always returns a string — it never failed closed.
 */
export function resolveOriginPreFix(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost?.trim() || url.host;
  const protocol = forwardedProto?.trim().toLowerCase() ?? "https";
  return `${protocol}://${host}`;
}

/**
 * Pre-fix RFQ payload validation: validates fields but does NOT strip control
 * characters. CR/LF survive into the email subject and headers, enabling email
 * header / CRLF injection from attacker-controlled form values.
 */
export function validateRfqInputPreFix(input: unknown): {
  valid: boolean;
  payload?: Record<string, string>;
} {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false };
  }
  const data = input as Record<string, unknown>;
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  // No sanitization of control characters — the whole point of the fixture.
  return {
    valid: true,
    payload: {
      name: clean(data.name),
      company: clean(data.company),
      email: clean(data.email),
      message: clean(data.message),
    },
  };
}

/**
 * Pre-fix popup renderer: reflects the provider's `error_description`
 * directly into the HTML body without serialization or a nonce CSP (SEC-C1).
 */
export function renderPopupPreFix(
  payload: Record<string, unknown>,
): string {
  const message = (payload.message as string | undefined) ?? "";
  return `<!doctype html><body>Completing sign-in…<script>
    window.opener.postMessage(${JSON.stringify({ message })}, "*");
  </script></body>`;
}
