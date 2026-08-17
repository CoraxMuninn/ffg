# Feiz Food Group — Complete Audit Remediation Roadmap

**Prepared:** 2026-08-17  
**Source audit:** `Feiz-Food-Group-Professional-Audit-2026-08-17.md`  
**Repository baseline:** `/home/user/ffg`, commit `dd58276`  
**Current mode:** Planning only — no repository changes are authorized yet.

## Objective

Resolve every reported problem systematically while preserving:

- the current Next.js 16 / React 19 App Router architecture
- existing public functionality and buyer journeys
- all four locales: `en`, `fa`, `ru`, `vi`
- Persian RTL behavior
- the current Feiz Food Group brand and visual design
- restrained, evidence-based company/product claims
- Markdown + Decap CMS content workflows

The work is deliberately divided into small, testable tasks. Only one task will be implemented at a time. After each task, work stops for review and approval.

---

# Execution Protocol

For every approved task, the same sequence will be used:

1. **Confirm baseline**
   - Verify the repository is clean.
   - Record the current commit.
   - Identify the audit issue IDs addressed by the task.
2. **Implement only that task**
   - Avoid unrelated cleanup or opportunistic refactors.
   - Preserve all locale and design behavior unless the task explicitly changes it.
3. **Run targeted verification**
   - Add or update regression tests for the repaired behavior.
   - Test all four locales when the task affects shared UI, routing, content, or metadata.
4. **Run repository quality gates appropriate to the change**
   - At minimum: lint and typecheck for code tasks.
   - Build and production-runtime tests for route/config/security/rendering changes.
   - Content/SEO crawl for content, routing, metadata, schema, or CMS changes.
   - Browser accessibility/visual checks for UI tasks once the browser harness exists.
5. **Report and stop**
   - What changed
   - Files changed
   - Tests run and exact result
   - Whether the audit issue is fully resolved
   - Any residual risk or follow-up explicitly assigned to a later task
   - Repository status/diff summary
6. **Wait for approval** before beginning the next task.

A task will not be marked complete merely because it builds. Its stated acceptance criteria must pass.

---

# Phase Overview

| Phase | Purpose | Priority | Dependency |
|---|---|---:|---|
| 1 | Eliminate release-blocking and privileged-admin security risks | Critical / highest Medium | None |
| 2 | Establish automated regression and CI safety nets | Medium | Phase 1 emergency fix |
| 3 | Make deployment, environment, RFQ security, and email delivery reliable | Medium | Phase 2; hosting decision |
| 4 | Resolve accessibility, RFQ conversion, responsive, and RTL issues | Medium → Low | Phases 2–3 |
| 5 | Make CMS, content validation, hreflang, and localized SEO scalable | Medium → Low | Phase 2 |
| 6 | Reduce component complexity and repository maintenance risk | Medium → Low | Phases 4–5 behavior stabilized |
| 7 | Optimize fonts, JavaScript, dynamic rendering, media, and rendering cost | Medium → Low | Phase 6 where relevant |
| 8 | Perform full-system release validation and close the audit | Final gate | All previous phases |

---

# Phase 1 — Release-Blocking and Privileged-Admin Security

**Phase exit condition:** OAuth callback XSS is eliminated; the admin does not execute mutable CDN JavaScript; OAuth origin and permissions are least-privilege; unsupported Product brand schema is removed. Production OAuth/admin must remain disabled until Task 1.1 passes.

## Task 1.1 — Fix and regression-proof OAuth callback XSS

- **Audit coverage:** `SEC-C1`
- **Work:**
  - Stop reflecting raw `error_description` or provider error text.
  - Validate OAuth state for both success and denial/error callbacks.
  - Introduce one HTML-script-context-safe serializer escaping `<`, `>`, `&`, U+2028, and U+2029.
  - Add a nonce-based, callback-specific CSP to the response.
  - Preserve Decap’s popup handshake and token delivery behavior.
- **Dependencies:** None.
- **Verification:**
  - Regression tests for `</script>`, quote, Unicode separator, missing state, wrong state, valid denial, and valid success rendering.
  - Configured production integration response must contain exactly one intended script element and no executable injected marker.
  - Callback must return `Cache-Control: no-store` and nonce CSP.
  - OAuth popup handshake test with safe dummy values.
  - Lint, typecheck, build.
- **Done when:** The confirmed XSS is no longer reproducible, state is enforced on every provider response, and the Decap handshake still works.

## Task 1.2 — Self-host and pin the Decap CMS runtime

- **Audit coverage:** `SEC-M1`
- **Work:**
  - Replace `decap-cms@^3` from unpkg with an exact, reviewed local build.
  - Record the exact version/update procedure.
  - Remove unpkg from admin script/style/image/font/connect CSP directives.
  - Ensure dependency scanning covers the chosen Decap package/artifact.
- **Dependencies:** Task 1.1.
- **Verification:**
  - `/admin` loads with no network dependency on unpkg.
  - Admin CSP allows only required local/GitHub resources.
  - Decap config loads and reaches the GitHub login action.
  - Hash/version is deterministic across builds.
  - `npm audit`, lint, typecheck, build.
- **Done when:** Privileged admin code is locally controlled, version-pinned, and covered by update/audit procedures.

## Task 1.3 — Enforce exact OAuth origins and secure cookie behavior

- **Audit coverage:** `SEC-M2`, origin-related portion of `SEC-L3`
- **Work:**
  - Replace unconditional forwarded-host/protocol trust with an exact origin allowlist.
  - Define explicit production and approved preview origins.
  - Reject unknown hosts/protocols/ports.
  - Force Secure OAuth cookies in production and narrow cookie path if compatible.
  - Keep `postMessage` pinned to the validated origin.
- **Dependencies:** Task 1.1.
- **Verification:**
  - Allowed production/preview/local origins pass.
  - Poisoned `X-Forwarded-Host`, protocol downgrade, alternate port, malformed host, and unapproved subdomain fail.
  - Redirect URI, popup target, and cookie attributes remain correct.
  - Lint, typecheck, build, configured OAuth route integration tests.
- **Done when:** Request-controlled host headers can no longer change OAuth security destinations or cookie security.

## Task 1.4 — Reduce GitHub authorization to repository-level practical least privilege

- **Audit coverage:** `SEC-M3`
- **Work:**
  - Replace broad `repo` access with the narrowest supported model.
  - Preferred end state: repository-scoped GitHub App/integration.
  - If Decap cannot support that directly, use a dedicated editor identity restricted to `CoraxMuninn/ffg` and the narrowest public-repository scope as the documented interim/end-state control.
  - Document collaborator and 2FA requirements.
- **Dependencies:** Tasks 1.1–1.3.
- **Decision gate:** GitHub App versus dedicated restricted editor identity, based on Decap compatibility.
- **Verification:**
  - Authorization does not grant private/all-repository access to a normal editor identity.
  - Authorized editor can still read/write the configured repo through editorial workflow.
  - Unauthorized GitHub users cannot publish.
  - OAuth callback and popup regression suite remains green.
- **Done when:** A compromised CMS token cannot access unrelated private repositories and is practically limited to the Feiz Food Group content repository.

## Task 1.5 — Remove the unsupported Product `brand` schema assertion

- **Audit coverage:** `SEO-M3`
- **Work:**
  - Remove `brand: Feiz Food Group` from Product JSON-LD until explicit brand ownership is verified and represented by a factual content field.
  - Add a structured-data fact-policy test preventing seller/exporter/manufacturer/brand substitution.
- **Dependencies:** None; sequenced after security tasks to keep one-task execution.
- **Verification:**
  - All 16 product pages emit valid Product schema without unsupported brand/manufacturer claims.
  - 100-route schema parser/crawl passes.
  - Lint, typecheck, build.
- **Done when:** Product schema describes only verified product facts.

---

# Phase 2 — Automated Regression and CI Safety Nets

**Phase exit condition:** Security, content, SEO, locale, browser, accessibility, and build checks run repeatably in CI. This phase prevents broad later work from recreating Phase 1 defects.

## Task 2.1 — Add test runner, security/API regression suite, and CI foundation

- **Audit coverage:** `SEC-M7`, core of `ARCH-M1`
- **Work:**
  - Add a maintained TypeScript test runner.
  - Add unit/integration tests for OAuth serialization/state/origin, RFQ origin/content type/validation/IP/rate-limit/email escaping, and security headers.
  - Add CI for install, dependency audit, lint, typecheck, tests, and build.
- **Dependencies:** Phase 1.
- **Verification:**
  - Tests fail against representative pre-fix unsafe fixtures and pass against current code.
  - CI configuration validates locally and on the remote provider.
  - Fresh clean install succeeds.
- **Done when:** Security-sensitive code cannot change without automated regression coverage.

## Task 2.2 — Add content, CMS-contract, routing, and SEO tests

- **Audit coverage:** remaining `ARCH-M1`, supports `ARCH-M3`, `ARCH-M4`, `SEO-M1`, `SEO-M2`
- **Work:**
  - Codify current collection counts/invariants without hardcoding content volume as a permanent limit.
  - Validate slugs, files, media, dates, locale parity/translation identity, metadata, headings, canonical, hreflang, sitemap, robots, JSON-LD, and internal links.
  - Validate Decap fields against loader schema.
- **Dependencies:** Task 2.1.
- **Verification:**
  - Current 228 records and 100 URLs pass.
  - Purpose-built invalid fixtures fail with actionable messages.
  - CI executes the checks.
- **Done when:** The one-off audit scripts are replaced by maintained repository tests.

## Task 2.3 — Add browser smoke, accessibility, RTL, and visual baseline harness

- **Audit coverage:** browser portion of `ARCH-M1`, supports all UX issues and `PERF-L5`
- **Work:**
  - Add browser tests for EN/FA/RU/VI home, product, market, blog, contact, legal, 404, mobile navigation, locale switching, and RFQ states.
  - Add automated accessibility checks and screenshots at representative mobile/tablet/desktop widths.
  - Include Persian mixed-direction fixtures and reduced-motion mode.
- **Dependencies:** Tasks 2.1–2.2.
- **Verification:**
  - Baseline screenshots and accessibility reports are reproducible.
  - Keyboard-only navigation smoke test passes except issues explicitly scheduled in Phase 4.
  - CI artifacts are available without making tests flaky.
- **Done when:** Later design-preserving changes can be compared objectively across all locales.

---

# Phase 3 — Deployment, Environment, RFQ Security, and Delivery Reliability

**Phase exit condition:** One deployment topology is authoritative; environment requirements fail fast; RFQ abuse controls work across instances; external calls are bounded; valid enquiries are delivered idempotently with observable failure recovery.

## Task 3.1 — Select and codify the production topology and environment contract

- **Audit coverage:** `SEC-M6`, `ARCH-M5`
- **Work:**
  - Choose Vercel or single/multi-instance VPS as the primary supported production target.
  - Restore `.env.example` with placeholders and required/optional/exposure descriptions.
  - Add typed startup/config validation, paired-key checks, approved-origin checks, and environment classification.
  - Declare Node and package-manager versions.
  - Add the selected deployment configuration, health check, proxy rules, rollback, and secret-management documentation.
- **Dependencies:** Phase 2.
- **Decision gate:** Production host/topology must be confirmed before implementation.
- **Verification:**
  - Clean development, preview, test, and production-config fixtures behave as documented.
  - Missing/mismatched production variables fail health/deploy checks.
  - No secret enters browser bundles or Git.
  - Fresh deployment dry run passes.
- **Done when:** Deployment behavior is reproducible and no security control relies on undocumented topology assumptions.

## Task 3.2 — Replace process-local RFQ rate limiting and formalize trusted client IPs

- **Audit coverage:** `SEC-M4`, remaining IP/cleanup portion of `SEC-L3`
- **Work:**
  - Add atomic shared or edge/WAF rate limiting appropriate to Task 3.1.
  - Implement trusted client-IP extraction for the chosen host.
  - Add coarse pre-verification and accepted-submission limits.
  - Return `Retry-After` and avoid a global `untrusted` buyer bucket.
  - Use strict IP parsing and store-native expiration.
- **Dependencies:** Task 3.1.
- **Verification:**
  - Different clients do not share one global quota.
  - Same client cannot bypass by spoofing forwarded headers.
  - Limits persist across process restart/instances where applicable.
  - Concurrency/expiry/burst tests pass.
- **Done when:** The limiter neither blocks all buyers after five requests nor fails open in the selected deployment.

## Task 3.3 — Bound RFQ request bodies and harden server-side Turnstile verification

- **Audit coverage:** `SEC-M5`
- **Work:**
  - Enforce body size at proxy/platform and reject excessive declared lengths before reading.
  - Add request timeouts/abort signals.
  - Send trusted client IP where appropriate.
  - Set and verify a fixed Turnstile action and approved hostname set.
  - Ensure failed/invalid attempts are covered by coarse limits without enabling enumeration.
- **Dependencies:** Tasks 3.1–3.2.
- **Verification:**
  - Oversized/chunked/malformed/slow requests are bounded.
  - Wrong hostname/action, expired/duplicate token, unavailable Cloudflare, and valid test token cases behave safely.
  - No external call can hang indefinitely.
- **Done when:** RFQ verification has bounded resource use and strong token binding.

## Task 3.4 — Add idempotent, observable, recoverable RFQ delivery

- **Audit coverage:** `ARCH-M9`
- **Work:**
  - Add timeout and structured non-PII operational events.
  - Add a submission/idempotency identifier.
  - Implement durable retry/queue behavior appropriate to the chosen deployment, or an equivalent provider-backed idempotent delivery design.
  - Define buyer success/pending/failure semantics and operator alerting.
  - Keep the Privacy Policy accurate; do not log form payloads unnecessarily.
- **Dependencies:** Tasks 3.1–3.3.
- **Decision gate:** Durable queue/storage provider and acceptable retention policy.
- **Verification:**
  - Duplicate retries send at most one sales message.
  - Provider timeout/transient failure recovers without losing the enquiry.
  - Permanent failure raises an operator-visible event.
  - Privacy and retention tests/docs match actual storage.
- **Done when:** A transient network/provider problem no longer silently loses or duplicates a qualified RFQ.

## Task 3.5 — Complete low-level security hardening

- **Audit coverage:** `SEC-L1`, `SEC-L2`, residual `SEC-L3`
- **Work:**
  - Disable `X-Powered-By`.
  - Gate browser error logging to development and use controlled production telemetry.
  - Require HTTPS for all non-loopback configured origins.
  - Investigate and, if supported without hydration breakage, replace public `unsafe-inline` with nonce/hash policy; otherwise document the verified framework constraint and add CSP regression checks.
- **Dependencies:** Tasks 2.1 and 3.1.
- **Verification:**
  - Runtime header matrix passes for public/admin/OAuth/API routes.
  - No production console stack exposure.
  - CSP report/test confirms all required scripts work and unapproved inline script does not.
- **Done when:** Reported low-level leakage and CSP/origin hardening gaps are either removed or explicitly proven/guarded platform constraints.

---

# Phase 4 — Accessibility, RFQ Conversion, Responsive UX, and RTL

**Phase exit condition:** Targeted WCAG AA checks pass; mobile/locale navigation works by keyboard; RFQ errors and retries are recoverable; Persian mixed-direction values render safely; low-level UX inconsistencies are resolved without redesigning the site.

## Task 4.1 — Correct the color/contrast token system

- **Audit coverage:** `UX-M1`
- **Work:**
  - Add separate accessible tokens for light body text, light links, dark secondary text, placeholders, and button surfaces.
  - Remap every failing silver/cyan use while preserving the brand palette.
  - Avoid changing layout, typography hierarchy, or overall design identity.
- **Dependencies:** Task 2.3.
- **Verification:**
  - Automated and manual contrast checks meet 4.5:1 normal text and 3:1 UI/large-text requirements.
  - EN/FA/RU/VI screenshots show no visual regression.
  - Focus and disabled-state contrast remains correct.
- **Done when:** Every reported failing combination is remapped and protected by tests.

## Task 4.2 — Implement a complete accessible mobile-navigation modal

- **Audit coverage:** `UX-M2`
- **Work:**
  - Trap focus, inert background content, add dialog/navigation naming, preserve Escape/resize/route close, and restore focus.
  - Preserve existing full-screen design and animation.
- **Dependencies:** Tasks 2.3 and 4.1.
- **Verification:**
  - Keyboard focus never reaches concealed content.
  - Screen readers announce the control and expanded navigation correctly.
  - Escape, close button, route selection, resize, and focus restoration pass in LTR/RTL and reduced motion.
- **Done when:** Visual and keyboard modality match.

## Task 4.3 — Correct desktop language-selector semantics and keyboard behavior

- **Audit coverage:** `UX-M7`
- **Work:**
  - Prefer disclosure + normal navigation list semantics, or implement the complete ARIA menu model.
  - Add accurate localized “choose language” naming.
  - Preserve route switching and current visual treatment.
- **Dependencies:** Tasks 2.3 and 4.2.
- **Verification:**
  - Tab/Shift+Tab, Enter/Space, Escape, outside click, current locale, and route preservation pass in all locales.
  - No false menu semantics remain.
- **Done when:** Keyboard behavior matches declared semantics.

## Task 4.4 — Complete RFQ field semantics, shared constraints, and error recovery

- **Audit coverage:** `UX-M3`, supports `ARCH-M6`
- **Work:**
  - Share field requirements/limits between server and client.
  - Add native required/max-length semantics.
  - Add field-specific server error mapping, error summary, first-error focus, and localized accessible announcements.
  - Preserve current fields and buyer workflow.
- **Dependencies:** Phase 3 server behavior and Task 2.3.
- **Verification:**
  - Required, length, email, product, quantity, message, and server error cases identify the correct field.
  - Keyboard/screen-reader and all-locale tests pass.
  - Malicious input remains rejected server-side.
- **Done when:** Buyers can understand and correct every validation failure without relying on a generic toast.

## Task 4.5 — Make Turnstile client states and RFQ retries recoverable

- **Audit coverage:** `UX-M4`
- **Work:**
  - Reset token/widget after every unsuccessful submission where retry is allowed.
  - Handle expiry, widget error, timeout, and server verification failure visibly.
  - Prevent submission without a valid token when Turnstile is configured.
  - Integrate with idempotent delivery from Task 3.4.
- **Dependencies:** Tasks 3.3, 3.4, and 4.4.
- **Verification:**
  - Transient Resend failure, 429, expired token, reused token, network error, and subsequent valid retry all behave correctly.
  - No page refresh is required for a legitimate retry.
- **Done when:** A consumed/failed token cannot strand a valid buyer.

## Task 4.6 — Add Persian mixed-direction isolation

- **Audit coverage:** `UX-M5`
- **Work:**
  - Apply LTR/bidi isolation to email, phone, ports/codes, units, ranges, temperatures, and similar values.
  - Use `dir="auto"` for appropriate free-text fields and explicit LTR for email/phone.
- **Dependencies:** Task 2.3.
- **Verification:**
  - Persian screenshots and DOM tests for `+98`, email, `-18°C`, `35–55g`, percentages, destination ports, and mixed user input.
  - LTR locales remain unchanged.
- **Done when:** Commercial values retain unambiguous visual order in RTL.

## Task 4.7 — Make the supply-chain rail accessible and translation-safe

- **Audit coverage:** `UX-M6`
- **Work:**
  - Decouple label width/height from icon size.
  - Reserve translated-label height safely.
  - Make the horizontal scroll region named and keyboard-operable.
  - Retain a visible/styled scroll affordance and optional localized instruction.
- **Dependencies:** Tasks 2.3 and 4.1.
- **Verification:**
  - EN/FA/RU/VI at 320/375/768/1024 px, 200% zoom, keyboard horizontal scrolling, and screen-reader region naming.
  - No label overlap/clipping.
- **Done when:** All stages and translated labels are discoverable and readable.

## Task 4.8 — Normalize blog dates and improve contact/RFQ trust actions

- **Audit coverage:** `UX-L1`, contact/privacy portion of `UX-L2`
- **Work:**
  - Localize every blog-card date consistently.
  - Make footer/contact email and phone actionable with safe bidi handling.
  - Add a concise localized privacy/data-use link near RFQ submission.
- **Dependencies:** Tasks 4.4 and 4.6.
- **Verification:**
  - Date rendering uses locale-appropriate output and valid `datetime`.
  - `mailto:`/`tel:` links are correct in all locales.
  - Privacy link is keyboard-accessible and does not imply consent is legally required.
- **Done when:** Reported date/contact/trust friction is removed.

## Task 4.9 — Give loading UI an accessible localized status

- **Audit coverage:** `UX-L3`
- **Work:** Use the existing localized loading label as screen-reader text while retaining current visual dots.
- **Dependencies:** Task 2.3.
- **Verification:** Loading status has one meaningful accessible name in all locales and no duplicate announcement.
- **Done when:** Assistive technology receives a useful loading message.

## Task 4.10 — Clarify static-card, unavailable-social, and language-icon affordances

- **Audit coverage:** remaining `UX-L2`, `UX-L4`, `UX-L5`
- **Work:**
  - Remove interaction-like elevation/glow from noninteractive cards or make the intended destination a real link.
  - Hide unavailable social icons or explicitly mark them unavailable without suggesting a control.
  - Review flag-as-language use; prefer neutral language identifiers if approved, while preserving switcher layout.
- **Dependencies:** Task 2.3.
- **Decision gate:** Whether to retain current country flags for brand/design reasons.
- **Verification:**
  - Pointer, keyboard, and screen-reader affordances agree.
  - All-locale snapshots preserve layout and design hierarchy.
- **Done when:** Noninteractive elements no longer present false affordances, and the language-identity decision is documented/implemented.

---

# Phase 5 — Multilingual CMS, Content Contracts, Hreflang, and SEO Scale

**Phase exit condition:** Decap can manage all four locales; loader and CMS schemas agree; invalid content fails clearly; translation counterparts drive hreflang; wrong-language fallback cannot be indexed; remaining technical SEO issues are closed.

## Task 5.1 — Establish one authoritative content schema and enforce invariants

- **Audit coverage:** `ARCH-M3`, `ARCH-M4`
- **Work:**
  - Define enforceable schemas for every collection.
  - Validate slug format/uniqueness, filename match, order conflicts, ISO dates, locale, paths/media existence, image metadata, SEO lengths, and list/spec shapes.
  - Stop silently dropping malformed specs.
  - Remove or derive the redundant blog `language` field.
- **Dependencies:** Task 2.2.
- **Verification:**
  - All 228 current records pass.
  - Invalid fixtures fail with file/field-specific messages.
  - Build and CMS-contract tests pass.
- **Done when:** CMS and runtime accept the same well-defined content model.

## Task 5.2 — Make Decap fully four-locale for all managed content

- **Audit coverage:** `ARCH-M2`, `SEO-M4`
- **Work:**
  - Add locale-aware collections/workflow for pages, products, markets, capabilities, certifications/documents, quality, and supply chain.
  - Keep shared stable IDs/slugs where required.
  - Expose localized SEO and alt fields.
  - Reduce config duplication through generation if practical.
- **Dependencies:** Task 5.1.
- **Verification:**
  - Create/edit/unpublish test records independently in EN/FA/RU/VI on a test branch.
  - Paths, metadata, images, and build output match the selected locale.
  - Existing content remains unchanged.
- **Done when:** Translators/editors no longer need manual Git editing for non-blog localized content.

## Task 5.3 — Add translation identities and counterpart-aware hreflang

- **Audit coverage:** `SEO-M1`
- **Work:**
  - Introduce a stable translation/entity ID or equivalent verified counterpart model.
  - Generate metadata and sitemap alternates only for existing, enabled, equivalent translations.
  - Use one helper for both HTML and sitemap.
- **Dependencies:** Tasks 5.1–5.2.
- **Verification:**
  - Complete four-locale groups emit five alternates including `x-default`.
  - English-only/partial/disabled/mismatched fixtures emit only valid reciprocal counterparts.
  - No hreflang points to 404 or unrelated content.
- **Done when:** The supported independent publishing workflow cannot generate invalid hreflang clusters.

## Task 5.4 — Remove transparent wrong-language fallback from indexable pages

- **Audit coverage:** `SEO-M2`
- **Work:**
  - Prefer true localized absence/404 for missing indexable content.
  - If a business-required fallback remains, preserve provenance, mark actual language, and noindex until translated.
- **Dependencies:** Task 5.3.
- **Verification:**
  - Missing locale directory/item cannot render English content under false FA/RU/VI language/canonical/hreflang.
  - Existing complete locales remain unchanged.
- **Done when:** Wrong-language fallback cannot create duplicate localized search pages.

## Task 5.5 — Make market presentation content-driven

- **Audit coverage:** `ARCH-M8`
- **Work:** Replace hardcoded market slug treatment with validated `primary` or a restrained presentation field managed by the content schema.
- **Dependencies:** Tasks 5.1–5.2.
- **Verification:** Changing primary market in a test fixture updates hierarchy consistently without code edits; added markets receive correct default treatment in LTR/RTL.
- **Done when:** Market CMS changes scale without slug-specific code.

## Task 5.6 — Convert structural locale redirects to permanent redirects

- **Audit coverage:** `SEO-L1`
- **Work:** Use query-preserving 308 redirects for `/` and stable unprefixed locale normalization.
- **Dependencies:** Route tests from Task 2.2.
- **Verification:** Root/unprefixed paths return 308 to the exact canonical target; assets/APIs/admin are unaffected; loops do not occur.
- **Done when:** Structural canonical routing uses permanent signals.

## Task 5.7 — Add accurate freshness, article, and social image metadata

- **Audit coverage:** `SEO-L2`, `SEO-L3`, `SEO-L4`
- **Work:**
  - Add validated update dates where editorially meaningful.
  - Emit accurate sitemap `lastModified` and BlogPosting `dateModified`.
  - Use stable author/publisher IDs.
  - Add verified image dimensions/type and Twitter alt metadata.
  - Remove synthetic frequency/priority fields if the team will not maintain them.
- **Dependencies:** Tasks 5.1–5.3.
- **Verification:** Schema/metadata tests across all route types/locales; dates reflect content rather than arbitrary build time; social images exist with declared dimensions.
- **Done when:** Freshness and social/article metadata are accurate and maintained by the content model.

## Task 5.8 — Close the localized-slug trade-off explicitly

- **Audit coverage:** `SEO-L5`
- **Work:**
  - Default recommendation: retain stable English shared slugs and document the rationale unless multilingual keyword evidence justifies migration.
  - If migration is approved, implement per-locale slugs, translation IDs, switch mappings, canonicals, sitemap updates, and permanent redirect map as a separate expanded plan.
- **Dependencies:** Task 5.3.
- **Decision gate:** Retain versus migrate based on keyword/business evidence.
- **Verification:** Whichever policy is chosen is enforced by schema and routing tests; no orphaned URL equity.
- **Done when:** The issue is resolved as a documented, tested architectural decision rather than accidental behavior.

---

# Phase 6 — Maintainability and Architecture Refactoring

**Phase exit condition:** Complex components have focused responsibilities, server/client contracts are minimal, stale code/dependencies are removed, and documentation describes actual behavior. Refactoring must not alter approved design or functionality.

## Task 6.1 — Decompose Header after navigation behavior is fixed

- **Audit coverage:** Header portion of `ARCH-M6`
- **Work:** Separate static shell/navigation, scroll state, desktop locale disclosure, and mobile modal into focused components/hooks; preserve exact approved visuals.
- **Dependencies:** Tasks 4.2–4.3 and browser baselines.
- **Verification:** All navigation, focus, locale, scroll, responsive, RTL, and snapshot tests remain green; bundle does not grow.
- **Done when:** Header concerns are independently testable without behavior change.

## Task 6.2 — Decompose RFQ around one shared schema/state contract

- **Audit coverage:** RFQ portion of `ARCH-M6`
- **Work:** Separate schema/view model, form reducer/hook, field components, server-error mapping, Turnstile adapter, submission status, and transport; remove client/server validation duplication.
- **Dependencies:** Tasks 3.2–3.4 and 4.4–4.5.
- **Verification:** Full RFQ security, accessibility, retry, locale, and email tests remain green; no field or copy changes.
- **Done when:** RFQ behavior is modular and its validation contract has one source of truth.

## Task 6.3 — Decompose MarketPanel/About and organize active CSS

- **Audit coverage:** remaining `ARCH-M6`
- **Work:** Extract repeated market subsections and About evidence sections; split global CSS by concern while retaining one token layer; remove stale comments and keep generated CSS stable or smaller.
- **Dependencies:** Task 5.5 and visual baselines.
- **Verification:** EN/FA/RU/VI route snapshots, headings, links, and build CSS comparison pass.
- **Done when:** Large presentation modules are reviewable without changing design.

## Task 6.4 — Remove dead code and correctly classify tooling dependencies

- **Audit coverage:** `ARCH-L1`, `ARCH-L2`
- **Work:** Remove confirmed unused components/routes/exports/styles/tokens; move CLI/build-only dependencies out of production or remove unused CSS packages; regenerate lockfile intentionally.
- **Dependencies:** Test coverage and Tasks 6.1–6.3.
- **Verification:** Dead-code/dependency scan, clean install, npm audit, lint, typecheck, tests, build, and 100-route crawl.
- **Done when:** No reported dead code remains and runtime dependencies match runtime use.

## Task 6.5 — Reconcile active documentation and archive obsolete guidance

- **Audit coverage:** `ARCH-L3`
- **Work:** Correct blog-order/date statements; align CMS, deployment, env, RFQ, and OAuth docs with implementation; clearly archive superseded audits/roadmaps.
- **Dependencies:** Phases 3 and 5, Tasks 6.1–6.4.
- **Verification:** Documentation links/commands/config names validate; no contradictory Vercel/VPS, date/order, or env instructions remain.
- **Done when:** Operators and editors can follow documentation without relying on stale architecture.

---

# Phase 7 — Performance Optimization and Monitoring

**Phase exit condition:** Only the active locale font is fetched; universal JS is materially reduced; contact is cacheable; costly effects/media are optimized; reveal behavior is progressive; performance budgets and field/lab measurements are established.

## Task 7.1 — Load only the active locale font/subset

- **Audit coverage:** `PERF-M1`
- **Work:** Introduce locale-appropriate font loading and Unicode subsetting; preload only the active required subset/family.
- **Dependencies:** Browser/performance harness and stable layouts.
- **Verification:** Network traces show no Vazirmatn on EN/RU/VI and no unnecessary Inter on FA; typography/screenshots remain correct; LCP/font-display comparison passes.
- **Done when:** The reported 463 KB forced dual-font preload is eliminated.

## Task 7.2 — Reduce universal client JavaScript and client-boundary payloads

- **Audit coverage:** `PERF-M2`, `ARCH-M7`
- **Work:**
  - Replace duplicate full-dictionary error/not-found bundles with minimal localized contracts.
  - Keep not-found server/static where framework constraints allow.
  - Pass compact Header and RFQ view models rather than full dictionaries/entities.
  - Ensure static content is not unnecessarily hydrated.
- **Dependencies:** Phase 6.
- **Verification:** Compare fresh route-bundle stats; ordinary-route Brotli JS must materially improve without losing localized errors/navigation/RFQ behavior; all tests pass.
- **Done when:** Duplicated error/not-found locale chunks and oversized client props are removed.

## Task 7.3 — Restore static caching to localized contact pages

- **Audit coverage:** `PERF-M3`
- **Work:** Move query-based product preselection into a small client enhancement/Suspense boundary while keeping page/form shell static.
- **Dependencies:** Task 6.2.
- **Verification:** Build marks all four contact routes static; runtime uses public/static cache semantics; `?product=` still preselects valid products and rejects invalid ones; SEO output unchanged.
- **Done when:** Contact no longer requires per-request server rendering solely for query preselection.

## Task 7.4 — Profile and reduce expensive backdrop filters

- **Audit coverage:** `PERF-M4`
- **Work:** Measure representative devices; replace unnecessary full-section filters with equivalent solid/translucent surfaces and reduce fixed-header blur while preserving the approved aesthetic.
- **Dependencies:** Visual/performance baselines.
- **Verification:** Before/after paint, scroll, and INP traces; all-locale screenshots; reduced-motion behavior.
- **Done when:** Retained filters have measured value/cost and reported high-risk full-surface filters are removed or reduced.

## Task 7.5 — Clean and optimize media/device/cache policy

- **Audit coverage:** `PERF-L1`, `PERF-L2`, `PERF-L3`
- **Work:** Remove/archive verified unused assets; avoid candidates above useful source resolution; resize/replace oversized sources where appropriate; add versioned long-lived cache policy for direct/OG media.
- **Dependencies:** Task 6.4 and confirmed deployment configuration.
- **Verification:** Asset-reference scan, before/after public size, image visual comparison, responsive network traces, OG fetch/cache headers, build/crawl.
- **Done when:** Reported unused media and pointless upscaling are gone and direct social assets cache predictably.

## Task 7.6 — Make reveal behavior shared and progressively enhanced

- **Audit coverage:** `PERF-L4`, remaining observer portion of `ARCH-M7`
- **Work:** Use a shared observer or a tested CSS/progressive strategy; default content visible when JS fails; limit reveals to meaningful blocks.
- **Dependencies:** Phase 6 and visual baselines.
- **Verification:** JS-disabled/slow-JS content remains visible; observer/hydration count falls; reduced-motion and all-locale snapshots pass.
- **Done when:** Reveal no longer creates one independent observer per instance or hides content pending JS.

## Task 7.7 — Add performance budgets and privacy-reviewed Web Vitals monitoring

- **Audit coverage:** `PERF-L5`
- **Work:** Add route bundle, image, font, and Lighthouse budgets; add privacy-compatible RUM only after updating privacy documentation and obtaining operator approval.
- **Dependencies:** Tasks 7.1–7.6.
- **Decision gate:** RUM endpoint/provider and retention policy.
- **Verification:** CI fails on defined regressions; LCP/CLS/INP dashboards or equivalent reports segment EN/FA/RU/VI and device class without collecting unnecessary personal data.
- **Done when:** Performance is monitored rather than inferred from one-time audit output.

---

# Phase 8 — Full-System Release Validation and Audit Closure

**Phase exit condition:** Every issue maps to a completed task or an explicitly approved, tested architectural decision; production-like security, CMS, RFQ, locale, accessibility, SEO, and performance checks pass.

## Task 8.1 — Final security and dependency validation

- **Work:** Run the complete OAuth/RFQ/header/CSP/secret/dependency regression suite; retest inert XSS payloads, origin poisoning, rate-limit concurrency, Turnstile errors, and idempotency.
- **Verification:** Zero open Critical findings; zero known dependency vulnerabilities or documented exception with owner/date; no secrets; header matrix passes.
- **Done when:** Security release gate is signed off.

## Task 8.2 — Final four-locale content, routing, CMS, and SEO crawl

- **Work:** Build and crawl every indexable URL, internal link, sitemap alternate, canonical, metadata field, heading, image alt, and JSON-LD object; run Decap create/edit/unpublish workflows for each locale.
- **Verification:** Zero broken routes/links/hreflang; valid schemas; no wrong-language fallback; no unsupported company facts.
- **Done when:** International content/SEO release gate is signed off.

## Task 8.3 — Final accessibility, responsive, RTL, and design validation

- **Work:** Automated and keyboard/manual review at representative widths, zoom, reduced motion, high contrast, and Persian mixed-direction cases.
- **Verification:** Targeted WCAG AA checks pass; no focus trap/focus loss; no clipping/overflow; approved visual baselines pass for all four locales.
- **Done when:** UX/accessibility release gate is signed off.

## Task 8.4 — Final performance comparison

- **Work:** Compare original audit baseline with final bundles, font/image transfer, static route count, caching, LCP/CLS/INP lab results, and representative field data if available.
- **Verification:** No budget failure; contact static; only active fonts fetched; no regression in visual quality/functionality.
- **Done when:** Performance release gate is signed off.

## Task 8.5 — Production-like RFQ and CMS smoke test

- **Work:** With operator-provided test configuration, execute one safe RFQ per locale to a designated test inbox and one CMS OAuth/editorial workflow on a test branch/deployment.
- **Verification:** Validation, Turnstile, idempotent delivery, localized success/error, GitHub permission boundaries, editorial workflow, rebuild, and rollback all pass.
- **Done when:** External integrations are proven in the real deployment topology without using live customer data.

## Task 8.6 — Close the issue matrix and publish final remediation report

- **Work:** Record each audit issue, task, changed files, tests, final status, approved trade-offs, and remaining operational owner/date.
- **Verification:** Coverage matrix below has no unresolved or unmapped issue.
- **Done when:** The original audit is fully closed and the repository is clean and production-ready.

---

# Audit Issue Coverage Matrix

This matrix ensures that no reported issue is skipped.

| Audit issue | Planned task(s) |
|---|---|
| SEC-C1 | 1.1, 8.1 |
| SEC-M1 | 1.2, 8.1 |
| SEC-M2 | 1.3, 8.1 |
| SEC-M3 | 1.4, 8.1 |
| SEC-M4 | 3.1, 3.2, 8.1 |
| SEC-M5 | 3.2, 3.3, 8.1 |
| SEC-M6 | 3.1, 8.1 |
| SEC-M7 | 2.1, 8.1 |
| SEC-L1 | 3.5, 8.1 |
| SEC-L2 | 3.5, 8.1 |
| SEC-L3 | 1.3, 3.2, 3.5, 8.1 |
| UX-M1 | 2.3, 4.1, 8.3 |
| UX-M2 | 2.3, 4.2, 8.3 |
| UX-M3 | 4.4, 6.2, 8.3 |
| UX-M4 | 3.4, 4.5, 8.5 |
| UX-M5 | 2.3, 4.6, 8.3 |
| UX-M6 | 4.7, 8.3 |
| UX-M7 | 4.3, 8.3 |
| UX-L1 | 4.8, 8.3 |
| UX-L2 | 4.8, 4.10, 8.3 |
| UX-L3 | 4.9, 8.3 |
| UX-L4 | 4.10, 8.3 |
| UX-L5 | 4.10, 8.3 |
| ARCH-M1 | 2.1–2.3, 8.1–8.4 |
| ARCH-M2 | 5.2, 8.2 |
| ARCH-M3 | 2.2, 5.1, 8.2 |
| ARCH-M4 | 2.2, 5.1, 5.4, 8.2 |
| ARCH-M5 | 3.1, 8.5 |
| ARCH-M6 | 4.4, 6.1–6.3, 8.3 |
| ARCH-M7 | 6.1–6.2, 7.2, 7.6, 8.4 |
| ARCH-M8 | 5.5, 8.2–8.3 |
| ARCH-M9 | 3.4, 8.1, 8.5 |
| ARCH-L1 | 6.3–6.4, 8.2–8.4 |
| ARCH-L2 | 6.4, 8.1, 8.4 |
| ARCH-L3 | 6.5, 8.6 |
| PERF-M1 | 7.1, 8.4 |
| PERF-M2 | 6.1–6.2, 7.2, 8.4 |
| PERF-M3 | 7.3, 8.4 |
| PERF-M4 | 7.4, 8.3–8.4 |
| PERF-L1 | 6.4, 7.5, 8.4 |
| PERF-L2 | 7.5, 8.4 |
| PERF-L3 | 3.1, 7.5, 8.4 |
| PERF-L4 | 7.6, 8.3–8.4 |
| PERF-L5 | 2.3, 7.7, 8.4 |
| SEO-M1 | 2.2, 5.3, 8.2 |
| SEO-M2 | 5.4, 8.2 |
| SEO-M3 | 1.5, 8.2 |
| SEO-M4 | 5.2, 8.2 |
| SEO-L1 | 5.6, 8.2 |
| SEO-L2 | 5.7, 8.2 |
| SEO-L3 | 5.7, 8.2 |
| SEO-L4 | 5.7, 8.2 |
| SEO-L5 | 5.8, 8.2 |

---

# Required Decision Gates

These decisions do not block approval of the roadmap; they will be requested immediately before the related task.

1. **Task 1.4:** repository-scoped GitHub App versus dedicated restricted editor identity.
2. **Task 3.1:** Vercel versus VPS as the authoritative production topology.
3. **Task 3.4:** durable queue/idempotency storage provider and retention policy.
4. **Task 4.10:** retain or replace country flags as language identifiers.
5. **Task 5.8:** retain shared English slugs or authorize a separately planned localized-slug migration.
6. **Task 7.7:** whether privacy-reviewed real-user performance monitoring is approved and where it is hosted.

---

# Proposed First Implementation Task After Approval

**Task 1.1 — Fix and regression-proof OAuth callback XSS.**

No other audit remediation will be implemented alongside it. After the fix and its targeted tests, I will report the exact changes and verification results, state whether `SEC-C1` is fully resolved, and wait for approval before Task 1.2.
