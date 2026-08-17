# Feiz Food Group — Complete Professional Repository Audit

**Audit date:** 2026-08-17  
**Repository:** `/home/user/ffg`  
**Audited commit:** `dd58276` (`master`)  
**Audit mode:** Analysis only; no application code or repository files were changed.

## Scope and verification basis

This audit independently reviewed security, UX/UI, architecture, performance, and SEO across:

- Next.js 16.3.0 / React 19.2.8 App Router implementation
- All route, component, library, configuration, and middleware/proxy source files
- All 228 Markdown records across English, Persian, Russian, and Vietnamese
- Persian RTL and mixed-direction content handling
- Decap CMS configuration and GitHub OAuth broker
- RFQ validation, Cloudflare Turnstile, rate limiting, Resend delivery, and error handling
- Metadata, canonicals, hreflang, sitemap, robots, Open Graph, and JSON-LD
- Production build output, route rendering mode, bundles, fonts, images, caching, and headers
- Dependencies, lockfile, deployment documentation, environment-variable usage, and repository hygiene

### Verification performed

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run build` — passed; 106 static-generation outputs completed
- `npm audit --json` — **0 known vulnerabilities** across 757 installed dependencies
- Fresh production runtime tested with `next start`
- All **100 sitemap URLs** fetched successfully
- **116 unique internal links** fetched successfully; no broken links
- All 100 indexable pages verified for status, canonical, title, description, one H1, hreflang, locale direction, JSON-LD parsing, and image-alt presence
- Metadata ranges: titles 38–68 characters; descriptions 91–160 characters
- 244 rendered JSON-LD blocks parsed successfully across the crawl
- 480 rendered images checked; no missing `alt` attributes in the generated pages
- All Markdown collection counts, locale parity, required fields, slugs, headings, image paths, and internal links checked; no current content-integrity failures
- Runtime security behavior tested with inert data only; no real credentials or external messages were used

### Complexity scale used below

- **XS:** less than half a day
- **S:** approximately 0.5–1 day
- **M:** approximately 2–4 days
- **L:** approximately 1–2 weeks

---

# Report 1 — Security

## 1. Current Strengths

1. **Strong public-site header baseline.** `next.config.ts` emits HSTS with subdomains/preload, `nosniff`, a strict referrer policy, restricted permissions, X-Frame-Options, COOP, CSP, `object-src 'none'`, `base-uri`, `form-action`, and `frame-ancestors`.
2. **Admin policy is isolated.** Decap’s required `unsafe-eval` is limited to `/admin`; public pages do not permit eval. Admin and OAuth routes also receive `noindex, nofollow` and popup-compatible COOP.
3. **RFQ input is treated as untrusted.** `src/app/api/rfq/route.ts` and `src/lib/rfq/*` enforce JSON content type, origin checks, object checks, field limits, required fields, email format, product allowlisting, control-character stripping, and generic client errors.
4. **Email construction is defensive.** Buyer input is HTML-escaped; the buyer address is Reply-To rather than From; the configured sender remains authoritative; the subject receives additional control-character stripping.
5. **Turnstile fails closed in production.** A missing secret does not silently disable bot protection in production.
6. **OAuth has meaningful CSRF protections.** The broker creates a random UUID state, stores it in a short-lived HttpOnly SameSite cookie, compares it on successful callbacks, and deletes it after use.
7. **Server-only secrets remain server-side.** Resend, Turnstile, and GitHub client secrets are read only in server modules. No credential-shaped value was found in the current tree; history scanning produced no confirmed secret, only a false positive inside an embedded font.
8. **CMS content does not expose a raw-HTML path.** `react-markdown` renders without `rehype-raw`; the icon registry is explicit; JSON-LD escapes `<`, `>`, and `&` before inline insertion.
9. **Dependency audit is currently clean.** `npm audit` returned zero Critical, High, Moderate, or Low findings.

## 2. Issues Found

### Critical

#### SEC-C1 — Reflected XSS in the configured OAuth callback

- **Problem:** `renderPopupResponse()` inserts a message into an inline script with `JSON.stringify`, but it does not escape HTML script-closing sequences. `/api/callback` reflects the query parameter `error_description` before validating OAuth state. A value containing `</script>` terminates the intended script and creates executable markup.
- **Why it matters:** `JSON.stringify` is JavaScript-string-safe, not HTML-script-context-safe. The callback is same-origin with `/admin`, and the route currently has no CSP. An injected script can execute with the site’s origin and may target browser-held Decap/GitHub session material or manipulate the opener.
- **Affected location:** `src/app/api/callback/route.ts` (OAuth-error branch and `popup()`); `src/lib/cms/oauth.ts` (`renderPopupResponse`); OAuth-specific headers in `next.config.ts`.
- **Evidence:** With dummy OAuth configuration and an inert marker, the generated response contained two opening script tags and three closing script tags. No code was executed during the audit.
- **Potential risk:** Same-origin arbitrary JavaScript, editor-session compromise, GitHub token exposure, content/repository modification, phishing from a trusted origin.

### Medium

#### SEC-M1 — Privileged admin JavaScript is mutable, CDN-hosted, and lacks integrity pinning

- **Problem:** `/admin` loads `https://unpkg.com/decap-cms@^3/dist/decap-cms.js`. The semver range is resolved on each cache cycle; the live URL currently redirects to Decap 3.15.1. There is no SRI hash, and the admin CSP explicitly trusts unpkg.
- **Why it matters:** This script receives the GitHub OAuth token and can modify the content repository. `npm audit` does not cover this CDN dependency.
- **Affected location:** `public/admin/index.html`; admin CSP in `next.config.ts`.
- **Potential risk:** A compromised package release, CDN path, or upstream account can exfiltrate editor credentials and modify published content.

#### SEC-M2 — OAuth origin is derived from untrusted forwarded headers

- **Problem:** `resolveOrigin()` unconditionally trusts `X-Forwarded-Host` and `X-Forwarded-Proto`. Runtime testing confirmed that supplying these headers changes the GitHub `redirect_uri`, popup target origin, and whether the state cookie is marked Secure.
- **Why it matters:** Security-sensitive redirect and postMessage destinations must come from an exact deployment allowlist, not request-controlled host metadata. GitHub limits callback matching, reducing some attack paths, but proxy misconfiguration, controlled subdomains, or custom-domain routing can make this exploitable.
- **Affected location:** `src/lib/cms/oauth.ts`; `/api/auth`; `/api/callback`; deployment proxy configuration.
- **Potential risk:** OAuth redirect poisoning, token delivery to an unintended origin, downgraded cookie flags, broken authentication, or open-redirect behavior within accepted callback domains.

#### SEC-M3 — GitHub OAuth requests an unnecessarily broad `repo` scope

- **Problem:** `OAUTH_SCOPE` is `repo`, although the configured repository `CoraxMuninn/ffg` is publicly visible. The code comment says the repository “may be private,” which does not match the current deployment.
- **Why it matters:** `repo` grants access to private repositories available to the editor, well beyond the single Feiz Food Group repository.
- **Affected location:** `src/lib/cms/oauth.ts`; `public/admin/config.yml`; `docs/CMS-ADMIN-SETUP.md`.
- **Potential risk:** If the browser token is stolen—especially through SEC-C1 or the mutable admin script—the blast radius extends beyond this website.

#### SEC-M4 — RFQ rate limiting is topology-dependent and can become either global or ineffective

- **Problem:** With `TRUST_PROXY` unset, every request receives the key `untrusted`; five accepted attempts consume one global hourly bucket. With multiple serverless instances, in-memory state is not shared and resets on restart. With `TRUST_PROXY=true` behind a proxy that does not overwrite headers, clients can rotate spoofed IPs.
- **Why it matters:** Deployment documentation alternates between Vercel and a single VPS. The limiter is only correct for one narrowly configured topology.
- **Affected location:** `src/lib/rfq/ip.ts`; `src/lib/rfq/rate-limit.ts`; `src/lib/rfq/constants.ts`; `README.md`; `docs/CMS-ADMIN-SETUP.md`; `docs/OPTIMIZATION-PHASE-REPORT.md`.
- **Evidence:** With a safe Turnstile test configuration and seven requests carrying different `X-Forwarded-For` values, the first five reached email delivery and the sixth and seventh were rate-limited because all shared `untrusted`. Failed email attempts also consumed the bucket.
- **Potential risk:** Five requests can block every legitimate buyer for an hour on the default key, while distributed or misconfigured deployments can permit spam and cost abuse.

#### SEC-M5 — RFQ edge-abuse controls occur too late and lack resource bounds

- **Problem:** The route reads the complete body before applying the 100 KB application check; Turnstile is called before rate limiting; the Turnstile fetch has no timeout; the verifier does not submit `remoteip` or validate returned hostname/action; only successfully verified and valid requests reach the limiter.
- **Why it matters:** Attackers can consume body memory and outbound verification capacity without touching the limiter. External-service stalls can tie up request execution.
- **Affected location:** `src/app/api/rfq/route.ts`; `src/lib/rfq/security.ts`; `src/lib/rfq/ip.ts`.
- **Potential risk:** Memory/CPU pressure, outbound-request amplification, slow-request exhaustion, reduced RFQ availability, and weaker bot-token binding.

#### SEC-M6 — Environment contract and fail-fast validation are missing

- **Problem:** `.env.example` is absent even though `README.md` instructs operators to copy it. The application does not validate paired variables at startup. A site-key/secret mismatch builds successfully but leaves the production RFQ unusable; proxy trust is also easy to misconfigure.
- **Why it matters:** Security controls that depend on deployment variables need an explicit, validated contract.
- **Affected location:** repository root; `README.md`; `src/lib/rfq/constants.ts`; `src/lib/cms/oauth.ts`; `src/lib/content/contact.ts`.
- **Potential risk:** Broken RFQ/CMS login, accidental trust of spoofable forwarding headers, emergency debugging that exposes secrets, and inconsistent production behavior.

#### SEC-M7 — Security-sensitive behavior has no automated regression suite or CI gate

- **Problem:** No unit/integration test files or CI workflow exist. The OAuth inline-script issue, forwarded-origin behavior, global limiter behavior, and Turnstile retry semantics are therefore not continuously checked.
- **Why it matters:** Lint, typecheck, and build cannot detect context-specific XSS, authorization-flow errors, or abuse-control regressions.
- **Affected location:** repository-wide; particularly `src/app/api/*`, `src/lib/cms/oauth.ts`, and `src/lib/rfq/*`.
- **Potential risk:** Reintroduction of critical vulnerabilities and silent behavior drift during routine content or framework changes.

### Low

#### SEC-L1 — Public CSP still permits inline scripts

- **Problem:** The public CSP uses `script-src 'unsafe-inline'` for Next bootstrap code.
- **Why it matters:** It weakens CSP’s ability to contain a future HTML-injection defect, although no public raw-HTML sink was confirmed in this audit.
- **Affected location:** `next.config.ts`.
- **Potential risk:** Higher impact if a separate injection defect is introduced.

#### SEC-L2 — Information and error hygiene can be tightened

- **Problem:** Next’s `X-Powered-By` header is enabled, and `src/app/[locale]/error.tsx` logs the complete error object in production browser consoles despite its comment saying development-only diagnostics.
- **Why it matters:** Neither is a direct exploit, but both expose avoidable implementation detail.
- **Affected location:** `next.config.ts`; `src/app/[locale]/error.tsx`.
- **Potential risk:** Minor framework fingerprinting and client-visible stack/context leakage.

#### SEC-L3 — Origin/IP parsing accepts avoidable edge cases

- **Problem:** Production-origin checks compare protocol and hostname but not exact port; extra configured origins may use HTTP; IPv4 validation accepts octets above 255; the in-memory map cleans every entry on each check.
- **Why it matters:** These are hardening and robustness defects rather than confirmed bypasses in the intended deployment.
- **Affected location:** `src/lib/rfq/security.ts`; `src/lib/rfq/ip.ts`; `src/lib/rfq/rate-limit.ts`.
- **Potential risk:** Unexpected accepted origins, malformed limiter keys, and avoidable CPU/memory pressure under hostile traffic.

## 3. Recommended Fix

| Priority | Related issue | What should change and why | Expected impact | Complexity | Related files/components | Trade-offs |
|---|---|---|---|---|---|---|
| 1 | SEC-C1 | Stop reflecting provider/query error details; validate state before handling both success and denial responses; serialize inline values with an HTML-safe helper that escapes `<`, `>`, `&`, U+2028, and U+2029; add a nonce-based callback CSP; add regression cases for `</script>` and malformed state. Defense in depth is preferred over relying on one escaping layer. | **Critical:** closes confirmed same-origin XSS and protects editor credentials | M | `src/app/api/callback/route.ts`, `src/lib/cms/oauth.ts`, `next.config.ts`, new OAuth tests | A dynamic nonce makes the callback response slightly more complex; generic errors provide less provider detail to users but are safer. |
| 2 | SEC-M1 | Self-host a reviewed, exact Decap build under `/admin/`, or pin an exact version with a verified integrity/update process. Remove unpkg from the admin CSP once local. | **High:** removes mutable privileged third-party execution | M | `public/admin/index.html`, `public/admin/`, `next.config.ts`, `package.json` if bundled | The team must intentionally apply Decap updates instead of receiving them automatically. |
| 3 | SEC-M2 | Resolve OAuth origin from a strict allowlist (`https://feizfood.com` plus explicitly provisioned preview origins). Only honor forwarded headers behind a documented trusted platform; reject unexpected host/protocol combinations; force Secure cookies in production. | **High:** prevents redirect/postMessage poisoning and deployment-dependent cookie downgrade | M | `src/lib/cms/oauth.ts`, OAuth routes, environment/deployment docs | Preview deployments require explicit registration rather than working automatically on arbitrary hosts. |
| 4 | SEC-M3 | Immediately reduce to `public_repo` if the OAuth App flow is retained; strategically migrate to a repository-scoped GitHub App or dedicated editor identity. Enforce organization 2FA and least-privilege collaborators operationally. | **High:** sharply reduces token-compromise blast radius | S for `public_repo`; L for GitHub App | `src/lib/cms/oauth.ts`, `public/admin/config.yml`, `docs/CMS-ADMIN-SETUP.md` | A GitHub App migration requires additional broker/Decap compatibility work. |
| 5 | SEC-M4 | Replace the process-local limiter with an atomic shared store or edge/WAF limit. Define one trusted client-IP adapter for the chosen host. Apply layered limits: coarse pre-verification IP/origin throttling, Turnstile, then a stricter accepted-submission quota. Return `Retry-After`. | **High:** prevents both global buyer lockout and distributed bypass | M | `src/lib/rfq/ip.ts`, `rate-limit.ts`, `route.ts`, deployment config | Adds Redis/edge-service cost and operational dependency; a WAF-only solution can be less portable. |
| 6 | SEC-M5 | Reject excessive `Content-Length` early and enforce the body cap at reverse-proxy/platform level; add `AbortSignal.timeout`; pass client IP where trustworthy; validate Turnstile hostname and a fixed action; monitor verification failures without logging form PII. | **Medium–High:** bounds RFQ resource use and improves bot-token assurance | M | `src/app/api/rfq/route.ts`, `src/lib/rfq/security.ts`, proxy/host config | Strict hostname/action checks require separate staging configuration and careful test keys. |
| 7 | SEC-M6 | Restore a placeholder-only `.env.example`; add typed startup validation for required pairs and allowed URLs; document exact Vercel or VPS behavior; fail deployment health checks when RFQ/CMS production configuration is incomplete. | **High:** prevents silent production security/control failure | S–M | `.env.example`, `README.md`, `src/lib/rfq/constants.ts`, `src/lib/cms/oauth.ts` | Fail-fast validation can block preview builds unless environments are explicitly classified. |
| 8 | SEC-M7 | Add unit tests for escaping, state lifecycle, origin allowlists, validation, headers, IP extraction, and rate limits; add API integration tests and CI running audit/lint/typecheck/test/build. | **High:** prevents recurrence of the confirmed defects | M | new test config/files, `.github/workflows/*`, security modules | Adds CI time and test maintenance. |
| 9 | SEC-L1–L3 | Disable `poweredByHeader`; gate client error logging to development; use exact origin objects; require HTTPS except loopback; use `node:net.isIP`; replace per-request full-map cleanup with timed or store-native expiration; investigate nonce support for public Next scripts. | **Low–Medium:** hardens implementation and reduces leakage | S–M | `next.config.ts`, error boundary, RFQ security/IP modules | A public nonce migration should be tested carefully against Next hydration. |

---

# Report 2 — UX/UI and User Experience

## 1. Current Strengths

1. **The primary B2B journey is clear.** Hero → product discovery → specifications/trust → market context → RFQ is consistently reinforced, and the global header exposes a quotation CTA.
2. **Product context carries into conversion.** Product links preselect the RFQ product through `?product=`, reducing re-entry.
3. **Market and product discovery are interconnected.** Product, market, quality, supply-chain, and RFQ pages cross-link without broken paths.
4. **Responsive structure is deliberate.** Components use mobile-first grids, reserved image frames, logical spacing utilities, and dedicated small-screen compositions.
5. **Four-locale foundations are strong.** `<html lang>` and `<html dir>` are correct; Persian uses Vazirmatn and RTL; route switching preserves the current path; all current collection sets are at locale parity.
6. **Accessibility basics are present.** There is a skip link, one H1 per public page, valid heading progression, visible focus rules, semantic links/buttons, labelled form controls, `aria-current`, Escape handling, and reduced-motion CSS.
7. **RFQ states are localized.** Loading, success, rate-limit, Turnstile, and server errors have localized user-facing copy.
8. **No unsupported response-time, price, stock, or contract guarantee is used to force conversion.** The legal and RFQ language appropriately describes the enquiry as non-binding.

## 2. Issues Found

### Critical

No confirmed Critical UX/UI issue was found independently of the Security report. The OAuth XSS remains a release blocker even though it is not a buyer-interface defect.

### Medium

#### UX-M1 — Pervasive normal-text contrast failures

- **Problem:** `--color-silver` is `#94a3b8` and is repeatedly used on white/light surfaces. Measured contrast is **2.56:1 on white** and **2.45:1 on smoke**, below WCAG AA’s 4.5:1 for normal text. `#0891b2` cyan is **3.68:1 on white**, so small cyan links and white text on cyan buttons also fail. `text-silver/60` on navy is approximately **3.34:1**.
- **Why it matters:** Affected content includes descriptions, placeholders, card copy, section introductions, small labels, and primary CTA text.
- **Affected location:** color tokens in `src/app/globals.css`; `SectionHeading.tsx`; `ProductCard.tsx`; `CapabilityCard.tsx`; `FeaturedProduct.tsx`; RFQ placeholders; small labels in `ProductsIntro.tsx`, `MarketsHero.tsx`, and `MarketPanel.tsx`; primary `Button` variant.
- **Potential risk:** Excludes low-vision users, makes mobile/outdoor reading difficult, and creates WCAG AA non-conformance.

#### UX-M2 — Mobile navigation is not a complete modal-navigation pattern

- **Problem:** The full-screen menu locks body scrolling and returns focus on close, but it does not trap focus, mark itself as a dialog/modal, or make the page/header background inert. Keyboard users can tab beyond the overlay into concealed page content.
- **Why it matters:** Visual modality and keyboard modality do not match.
- **Affected location:** `src/components/layout/Header.tsx`; `.nav-mobile-overlay` in `globals.css`.
- **Potential risk:** Focus becomes lost behind the overlay, creating confusion for keyboard and screen-reader users.

#### UX-M3 — Required RFQ semantics and error recovery are incomplete

- **Problem:** All 11 controls are labelled, but none has a native `required` attribute or `aria-required`; none exposes server `maxLength`; invalid submission does not focus the first invalid field or provide a top-level error summary. Several server rejections collapse to a generic toast.
- **Why it matters:** Visual asterisks do not provide equivalent semantics. Users can enter values that pass client checks but fail server limits, then receive no field-specific correction.
- **Affected location:** `src/components/rfq/RfqForm.tsx`; `src/lib/rfq/constants.ts`; `src/lib/rfq/validation.ts`.
- **Potential risk:** Lower completion rates and avoidable barriers for assistive-technology users.

#### UX-M4 — A failed RFQ can leave Turnstile in an unrecoverable state

- **Problem:** Turnstile tokens are single-use, but the widget is not reset after server, rate-limit, or email-delivery errors. There is no widget `error-callback` or timeout state. A transient email failure can consume the token; pressing submit again then returns `TURNSTILE_FAILED` until refresh.
- **Why it matters:** The most valuable conversion flow can fail twice for one transient backend problem.
- **Affected location:** `src/components/rfq/TurnstileWidget.tsx`; `RfqForm.tsx`; `src/app/api/rfq/route.ts`.
- **Potential risk:** Lost qualified enquiries and user distrust.

#### UX-M5 — Mixed-direction Persian data is not isolated

- **Problem:** Email, phone, port codes, units, temperature/spec values, and user-entered Latin text inherit page RTL. No `dir="ltr"`, `dir="auto"`, `<bdi>`, or `unicode-bidi` handling is used for contact facts or specification values.
- **Why it matters:** Bidirectional reordering can move plus signs, punctuation, ranges, and units to confusing positions.
- **Affected location:** contact panel and footer; `RfqForm.tsx`; product specification components; market/document values; `src/lib/content/contact.ts` consumers.
- **Potential risk:** Misread phone numbers, ports, quantities, and commercial specifications in Persian.

#### UX-M6 — Supply-chain rail discovery and translated-label layout are fragile

- **Problem:** On screens below `xl`, the rail is a horizontally scrolling region with hidden scrollbar chrome. Labels are absolutely positioned within 48–64 px tile widths, while only 64 px bottom padding is reserved. Long Russian/Vietnamese labels can wrap heavily; there is no accessible instruction naming the scroll region.
- **Why it matters:** Horizontal continuation relies mainly on a visual mask, and translated labels are constrained by icon width rather than content width.
- **Affected location:** `src/components/supply-chain/SupplyChainRail.tsx`; supply-rail CSS in `globals.css`.
- **Potential risk:** Clipped/overlapping labels and undiscovered stages on keyboard, zoomed, or translated layouts.

#### UX-M7 — Desktop language selector uses incomplete menu semantics

- **Problem:** The selector declares `role="menu"`/`menuitem` but does not move focus into the menu or implement arrow/Home/End navigation expected by the ARIA menu pattern. Its menu label reuses the generic navigation-toggle string.
- **Why it matters:** Native link-list behavior is simpler; once menu roles are declared, users expect the full interaction model.
- **Affected location:** `src/components/layout/Header.tsx`; locale dictionaries.
- **Potential risk:** Inconsistent screen-reader/keyboard interaction.

### Low

#### UX-L1 — Blog-card date presentation is inconsistent

- **Problem:** The featured article uses localized long-date formatting; all other cards show raw `YYYY-MM-DD`.
- **Why it matters:** The same content type has two presentation standards.
- **Affected location:** `src/app/[locale]/blog/page.tsx`.
- **Potential risk:** Reduced visual polish and weaker localization.

#### UX-L2 — Contact and trust micro-interactions leave conversion value unused

- **Problem:** Footer email/phone are plain text, contact phone is not a `tel:` link, and the RFQ submit area has no adjacent privacy link or concise data-use reminder. Unconfigured social accounts render labelled but unavailable icons.
- **Why it matters:** Buyers on mobile cannot immediately call/copy via expected controls, and privacy reassurance is distant from submission.
- **Affected location:** `Footer.tsx`; contact page; `RfqForm.tsx`.
- **Potential risk:** Minor conversion friction and ambiguous noninteractive elements.

#### UX-L3 — Empty loading status has no accessible name

- **Problem:** `loading.tsx` uses `role="status"` and `aria-live` but contains only `aria-hidden` dots, despite a localized `dictionary.loading.label` existing.
- **Why it matters:** Assistive technology receives no meaningful loading announcement.
- **Affected location:** `src/app/[locale]/loading.tsx`; dictionary `loading.label`.
- **Potential risk:** Silent navigation delay for screen-reader users.

#### UX-L4 — Some hover treatments imply interaction on static cards

- **Problem:** Capability and certification cards elevate/glow on hover although they are not links or controls; card radius/shadow treatments also vary noticeably between blog, product, capability, and market surfaces.
- **Why it matters:** Hover is commonly interpreted as clickability, and inconsistent surfaces weaken the otherwise coherent design system.
- **Affected location:** `CapabilityCard.tsx`; `CertificationCard.tsx`; blog cards; product cards; arbitrary shadows in page components.
- **Potential risk:** Minor interaction ambiguity and visual-system drift.

#### UX-L5 — Country flags are used as language identifiers

- **Problem:** English, Persian, Russian, and Vietnamese are represented by country flags, including a historically specific Iranian emblem.
- **Why it matters:** Languages are not equivalent to national identity; political/historic symbols can distract from language selection.
- **Affected location:** `src/components/layout/LocaleFlag.tsx`.
- **Potential risk:** Cultural ambiguity; no functional accessibility failure because adjacent text labels exist.

## 3. Recommended Fix

| Priority | Related issue | What should change and why | Expected impact | Complexity | Related files/components | Trade-offs |
|---|---|---|---|---|---|---|
| 1 | UX-M1 | Define separate accessible tokens for light-surface body text, light-surface links, dark-surface secondary text, and button surfaces. Use at least 4.5:1 for normal text and 3:1 for UI boundaries; regression-test key combinations. | **High:** broad WCAG and readability improvement | M | `globals.css`, `Button`, cards, section headings, RFQ inputs | Brand cyan may need a darker light-surface variant while retaining bright cyan on navy. |
| 2 | UX-M2 | Implement the mobile navigation as a proper modal sheet/dialog: trap focus, keep close control reachable, inert the rest of the document, set an accessible name, close on route/resize/Escape, and restore focus. | **High:** predictable keyboard and screen-reader navigation | M | `Header.tsx`, layout, overlay CSS | A tested focus-management primitive adds code or one small dependency. |
| 3 | UX-M3 | Add native `required`, `aria-required` where useful, `maxLength`, field-specific server error mapping, an error summary, and first-error focus. Derive client constraints from a shared schema/constants module. | **High:** improves RFQ completion and accessibility | M | `RfqForm.tsx`, RFQ constants/validation/types | More detailed errors must remain generic enough not to expose internals. |
| 4 | UX-M4 | Expose a widget reset method or reset key; clear/reset after every unsuccessful POST; add expired/error/timeout callbacks and a visible localized status; disable submit until a configured widget has a valid token. | **High:** prevents lost RFQ retries | M | `TurnstileWidget.tsx`, `RfqForm.tsx` | More widget state must be synchronized carefully to avoid duplicate renders. |
| 5 | UX-M5 | Use `dir="ltr"` plus `<bdi>` for phone/email/codes and `dir="auto"` for mixed free-text fields. Add RTL visual regression cases for phone, email, `-18°C`, `35–55g`, percentages, and ports. | **Medium–High:** prevents commercial-data misreading | S–M | contact/footer, RFQ, specification displays, RTL tests | Explicit direction must be applied selectively so Persian prose remains RTL. |
| 6 | UX-M6 | Give labels a translated-content width independent of icon size, reserve measured height, expose a named `tabIndex=0` scroll region, keep a visible or styled scrollbar, and add concise scroll guidance where overflow exists. | **Medium:** improves mobile and translated supply-chain comprehension | M | `SupplyChainRail.tsx`, rail CSS, dictionaries | The rail may become taller or visually less minimal on small screens. |
| 7 | UX-M7 | Either implement full ARIA menu keyboard behavior or replace menu roles with a disclosure button controlling a normal locale-link list. The latter is preferred because these are navigation links. | **Medium:** simpler, standards-aligned locale switching | S | `Header.tsx`, header dictionary labels | Removes some “application menu” semantics but improves expected web navigation. |
| 8 | UX-L1–L5 | Reuse `formatDate` for every blog card; make email/phone actionable; add a nearby privacy link; hide unavailable social items from assistive tech or label them unavailable; add loading text; limit hover elevation to interactive cards; consider language names/icons rather than national flags. | **Low–Medium:** polish, trust, and localized consistency | S–M | blog page, footer/contact/RFQ, loading UI, static cards, `LocaleFlag` | Some changes alter established visual styling and need design approval. |

---

# Report 3 — Code Quality and Architecture

## 1. Current Strengths

1. **Strict TypeScript and clean quality gates.** Strict mode, lint, typecheck, and production build all pass.
2. **App Router boundaries are mostly appropriate.** Most pages and content components remain Server Components; client code is concentrated in header interaction, reveals, errors, and RFQ behavior.
3. **Domain concerns are separated.** Content, i18n, SEO, RFQ, OAuth, shared UI, cards, and page sections have recognizable module boundaries.
4. **Content is centrally typed.** Products, markets, blogs, capabilities, quality steps, and supply-chain steps have explicit interfaces and shared loaders.
5. **Routing and localization are centralized.** Locale definitions and path helpers avoid widespread hand-built URL prefixes.
6. **Reusable page furniture exists.** `Container`, `PageHeader`, `MediaSplit`, `Prose`, `JsonLd`, `SectionHeading`, cards, and `Button` reduce repeated markup.
7. **Failure routes exist.** Localized loading, error, segment not-found, and global not-found surfaces are implemented.
8. **CMS publishing uses Git history and editorial workflow.** Content changes are reviewable and deployments remain stateless.

## 2. Issues Found

### Critical

No separate Critical architecture issue was found. The architecture did, however, allow the Critical OAuth defect to pass because security tests and context-safe serialization primitives are absent.

### Medium

#### ARCH-M1 — No automated test suite or CI pipeline

- **Problem:** The repository contains no unit, integration, browser, or accessibility tests and no `.github/workflows` pipeline.
- **Why it matters:** The system includes security-sensitive OAuth/RFQ code, generated SEO contracts, four locales, CMS schemas, and 100 routes. Manual build success is insufficient.
- **Affected location:** repository-wide.
- **Potential risk:** Security regressions, broken locale counterparts, invalid CMS content, accessibility failures, and route/metadata drift reach production unnoticed.

#### ARCH-M2 — Decap CMS is not truly four-locale for non-blog content

- **Problem:** Products, certifications, capabilities, markets, supply chain, quality control, and pages are configured only against `content/en/...`; only blogs have four locale collections. Current FA/RU/VI files therefore require manual Git editing.
- **Why it matters:** The stated CMS/content architecture and the actual multilingual repository are misaligned.
- **Affected location:** `public/admin/config.yml`; all localized content directories; `docs/CMS-ADMIN-SETUP.md`.
- **Potential risk:** Translation drift, English-only additions, inaccessible editorial workflows for translators, and broken hreflang parity.

#### ARCH-M3 — CMS schema and loader schema have already drifted

- **Problem:** Blog collections require a selectable `language` field, but all 24 current blog records omit it and `validateBlogPost()` ignores it. Non-blog slugs lack the blog regex constraint. Several hints are not enforced.
- **Why it matters:** A schema should either be authoritative or derived from one authoritative model; currently Decap and TypeScript accept different records.
- **Affected location:** `public/admin/config.yml`; `content/*/blog/*.md`; `src/lib/content/loaders.ts`.
- **Potential risk:** Editors can save semantically inconsistent entries, and future loader tightening can unexpectedly break builds.

#### ARCH-M4 — Content validation is incomplete for long-term scale

- **Problem:** Validation checks primitive types but not unique slugs/orders, filename–slug equality, locale membership, valid ISO dates for string dates, URL/image-path policy, image existence at loader level, SEO limits, or counterpart relationships. `parseSpecs()` silently drops non-object values. Transparent fallback provenance is discarded by public loaders.
- **Why it matters:** Build-time content is code-like input. Current records pass an external audit script, but the repository itself does not enforce those invariants.
- **Affected location:** `src/lib/content/parse.ts`, `loaders.ts`, `types.ts`; content collections.
- **Potential risk:** Duplicate routes, invalid dates, missing media, silent data loss, wrong-language output, and build failures after CMS edits.

#### ARCH-M5 — Environment and deployment architecture is contradictory and unreproducible

- **Problem:** `.env.example` is missing; no Node engine/package-manager version is declared; there is no Vercel config, Dockerfile, systemd unit, nginx/Caddy config, or CI deployment file. Some docs prescribe Vercel while rate-limit modules call a single VPS the intended target.
- **Why it matters:** Security, caching, client IPs, process lifetime, image optimization, and environment validation depend on the deployment model.
- **Affected location:** root configuration and docs; RFQ modules; OAuth docs.
- **Potential risk:** A deployment that builds but has broken RFQ, ineffective rate limits, incorrect proxy trust, or inconsistent runtime versions.

#### ARCH-M6 — Several high-complexity modules mix too many concerns

- **Problem:** `RfqForm.tsx` is 425+ lines, `Header.tsx` 355+, `MarketPanel.tsx` 280+, About page 284+, and `globals.css` 842 lines. RFQ owns state, validation, network, toasts, fields, and Turnstile; Header owns scrolling, two menus, focus, route state, flags, and CTA.
- **Why it matters:** Security/accessibility behavior becomes difficult to reason about and test. The confirmed OAuth defect demonstrates the cost of ad hoc security-context handling elsewhere.
- **Affected location:** listed modules and associated CSS.
- **Potential risk:** Higher regression rate, slow reviews, duplicated behavior, and inaccessible edge states.

#### ARCH-M7 — Client boundaries serialize or bundle more data than needed

- **Problem:** Header receives the full dictionary; RFQ receives the full dictionary and complete Product objects even though it needs a small label set and slug/title options. Client error/not-found modules import all dictionaries. Reveal creates one observer per instance despite comments implying a shared observer.
- **Why it matters:** Component APIs should expose minimal view models, especially across Server/Client boundaries.
- **Affected location:** locale layout, `Header.tsx`, contact page, `RfqForm.tsx`, error/not-found, `Reveal.tsx`.
- **Potential risk:** Larger RSC payloads/bundles, duplicated locale code, and harder component reuse.

#### ARCH-M8 — Market visual behavior is hardcoded to today’s slugs

- **Problem:** `MarketPanel` defines the light treatment with `['uae', 'russia', 'thailand']` rather than `!market.primary` or a content field.
- **Why it matters:** Changing the primary market or adding a market through CMS produces incorrect visual hierarchy without a code change.
- **Affected location:** `src/components/markets/MarketPanel.tsx`.
- **Potential risk:** CMS scalability failure and contradictory primary-market presentation.

#### ARCH-M9 — Email delivery is synchronous and has no idempotency or operational recovery

- **Problem:** The request directly waits for Turnstile and Resend; external fetches have no timeout; there is no queue, retry policy, idempotency key, or structured operational event. Errors are intentionally hidden from buyers but also swallowed from operators.
- **Why it matters:** A transient provider delay/failure directly becomes a lost buyer interaction.
- **Affected location:** RFQ route, `security.ts`, `email.ts`.
- **Potential risk:** Duplicate emails after uncertain retries, lost enquiries, long request latency, and difficult incident diagnosis.

### Low

#### ARCH-L1 — Dead code and stale styling remain

- **Problem:** `PageVisual`, `homePath`, `.glass-2xl`, market scrim classes, some palette tokens, and RFQ compatibility exports appear unused. Comments in `MarketPanel` reference a scrim that is no longer rendered.
- **Why it matters:** Dead code obscures the active design and increases review surface.
- **Affected location:** shared components/routes, `globals.css`, RFQ barrels.
- **Potential risk:** Minor maintenance overhead and mistaken reuse of stale patterns.

#### ARCH-L2 — Tooling dependencies are not classified cleanly

- **Problem:** `shadcn` is a production dependency even though it is primarily a CLI/build-time tool and carries a large dependency tree. `tw-animate-css` and `shadcn/tailwind.css` are imported despite little visible use beyond a small animation subset.
- **Why it matters:** Install and supply-chain surface should match runtime needs.
- **Affected location:** `package.json`, lockfile, `globals.css`, `components.json`.
- **Potential risk:** Slower installs, more dependency alerts, and unnecessary maintenance.

#### ARCH-L3 — Documentation contains internal behavioral contradictions

- **Problem:** CMS documentation says publication date drives ordering, while loaders sort all collections by `order`; elsewhere the same doc correctly says posts sort by `order`. Old audit/deployment documents describe architectures that are no longer current.
- **Why it matters:** Operators and editors cannot reliably infer live behavior.
- **Affected location:** `docs/CMS-ADMIN-SETUP.md`; older audit/implementation documentation.
- **Potential risk:** Incorrect editorial ordering and deployment decisions.

## 3. Recommended Fix

| Priority | Related issue | What should change and why | Expected impact | Complexity | Related files/components | Trade-offs |
|---|---|---|---|---|---|---|
| 1 | ARCH-M1 | Establish Vitest/Jest-equivalent unit tests, route integration tests, content-contract tests, and Playwright accessibility/smoke tests; run them with lint/typecheck/build in CI. | **High:** prevents security, locale, SEO, and interaction regressions | M–L | new test setup, `.github/workflows/*`, route/library modules | Adds maintenance and CI minutes; deterministic CMS fixtures are needed. |
| 2 | ARCH-M2–M4 | Define one schema layer for Decap + loader validation. Generate or mirror all locale collections, enforce slug/date/media/SEO/counterpart invariants, and make language fixed by folder rather than user-selectable. | **High:** makes multilingual CMS publishing reliable | L | `public/admin/config.yml`, content parse/loaders/types, content tests | Decap YAML may remain verbose unless generated; stricter checks can initially reject legacy content. |
| 3 | ARCH-M5 | Choose and document one primary production topology. Restore env template, declare Node/package-manager versions, provide host/IaC config, health checks, proxy trust rules, and rollback procedure. | **High:** reproducible and secure operations | M | root config, README/docs, deployment files, RFQ/OAuth config | Supporting both Vercel and VPS doubles test scope; one should be authoritative. |
| 4 | ARCH-M6 | Split Header into static shell/nav plus menu islands; split RFQ into shared schema, reducer/hook, fields, status, and Turnstile adapter; split MarketPanel subsections; divide global CSS by active concern while preserving one token file. | **Medium–High:** safer reviews and easier testing | L | major components and styles | Refactoring can cause visual regressions, so screenshots and a11y tests should precede it. |
| 5 | ARCH-M7 | Pass compact, typed view models across client boundaries: header labels only, RFQ labels/limits/options only, and minimal error strings. Use a shared observer service or CSS-native view transitions where supported. | **Medium:** smaller payloads and cleaner APIs | M | layout, Header, contact/RFQ, error/not-found, Reveal | More prop/view-model definitions add small server-side mapping code. |
| 6 | ARCH-M8 | Replace slug allowlists with `market.primary` or an explicit presentation field validated by the content schema. | **Medium:** CMS changes scale without code edits | XS | `MarketPanel.tsx`, Market type/schema | An explicit presentation field gives editors more power and needs guardrails. |
| 7 | ARCH-M9 | Add timeouts and structured non-PII telemetry first; then introduce an idempotency token and a small durable delivery queue/retry mechanism if RFQ volume/business criticality warrants it. | **Medium–High:** more reliable enquiry delivery | M–L | RFQ API/security/email modules, selected queue/host | A queue adds infrastructure and changes immediate success semantics. |
| 8 | ARCH-L1–L3 | Remove confirmed dead files/exports/CSS/assets; move CLI-only packages to dev or remove unused imports; update docs from the implementation and archive obsolete audit artifacts clearly. | **Low–Medium:** reduces repository and dependency noise | S–M | shared files, CSS, package files, docs | Cleanup should follow coverage so apparently unused extension points are not removed accidentally. |

---

# Report 4 — Performance Optimization

## 1. Current Strengths

1. **Static rendering is the default.** The fresh build prerenders 96 of the 100 sitemap pages; dynamic work is limited to the four localized contact URLs, error/not-found handling, and APIs.
2. **Static pages cache aggressively.** Production responses use `s-maxage=31536000`; hashed JS, CSS, and fonts are immutable.
3. **Next/Image is used consistently.** Visible editorial imagery has responsive `sizes`, reserved intrinsic or fill containers, lazy loading by default, and AVIF/WebP support. High-priority images are limited to likely above-fold candidates.
4. **CLS risk is generally controlled.** Header/footer logos have corrected intrinsic ratios; fill images sit in fixed/aspect-ratio containers.
5. **Third-party code is not global on buyer pages.** Turnstile loads only where the RFQ is rendered; there is no analytics or advertising runtime.
6. **CSS transfer is reasonable despite source size.** Main generated CSS is about 85.6 KB raw, 14.8 KB gzip, and 12.3 KB Brotli.
7. **Scroll work is throttled.** Header and scroll-to-top listeners use passive events and requestAnimationFrame; reveal observers disconnect after intersection.
8. **Images are optimized at runtime.** Example optimized transfer sizes were about 39.6 KB for the 640 px hero and 144 KB for its 1920 px JPEG fallback request.

## 2. Issues Found

### Critical

No confirmed Critical performance issue was found.

### Medium

#### PERF-M1 — Every locale preloads both full variable fonts

- **Problem:** Every EN/FA/RU/VI HTML document preloads both Inter (352,240 bytes) and Vazirmatn (111,152 bytes), although LTR pages use Inter and Persian uses Vazirmatn.
- **Why it matters:** Preload forces approximately **463 KB** of font transfer before the browser has naturally selected the active family. This competes with LCP images and CSS.
- **Affected location:** both `localFont` declarations in `src/app/[locale]/layout.tsx`; repeated in `global-not-found.tsx`; font files in `public/fonts`.
- **Potential risk:** Slower LCP and first rendering on mobile/high-latency networks; wasted bandwidth on every locale.

#### PERF-M2 — First-load JavaScript is high for a mostly static site

- **Problem:** Generated route stats show approximately 632 KB raw / 193 KB gzip / 166 KB Brotli first-load JS on ordinary routes; contact is approximately 678 KB raw / 206 KB gzip / 177 KB Brotli. Two roughly 51 KB raw chunks are loaded on all routes for client error/not-found boundaries and duplicate substantial locale/icon code.
- **Why it matters:** Most page content is server-rendered and does not need hydration. Shared client boundaries and global interaction code dominate transfer/parse cost.
- **Affected location:** `[locale]/error.tsx`, `[locale]/not-found.tsx`, dictionary imports, Header, ScrollToTop, Reveal, build chunks in `.next/diagnostics/route-bundle-stats.json`.
- **Potential risk:** Slower parse/execute, delayed interactivity, and higher INP risk on low-end devices.

#### PERF-M3 — The conversion-critical contact page is fully dynamic and uncacheable

- **Problem:** The build marks `/[locale]/contact` dynamic. Runtime responses use `Cache-Control: private, no-cache, no-store`. The main trigger is server consumption of `searchParams` for product preselection.
- **Why it matters:** The form shell/content could otherwise be statically cached globally; only client-side preselection is request-specific.
- **Affected location:** `src/app/[locale]/contact/page.tsx`; RFQ component query handling.
- **Potential risk:** Higher TTFB, reduced resilience, and unnecessary server compute on the most important conversion page.

#### PERF-M4 — Heavy blur effects create unmeasured paint/compositing risk

- **Problem:** Multiple full sections use `backdrop-blur-3xl`; the fixed header glass uses a 50 px backdrop blur; scroll-to-top also uses backdrop filtering. These large filtered regions move over image-heavy content.
- **Why it matters:** Backdrop filters can be expensive during scrolling, particularly on mobile GPUs. Source review identifies risk, but the repository has no device lab or field INP data to quantify it.
- **Affected location:** homepage sections, FinalCTA, Header `.glass`, scroll-to-top, `globals.css`.
- **Potential risk:** Scroll jank, battery use, and delayed interaction on lower-end devices.

### Low

#### PERF-L1 — Public media includes large unused assets

- **Problem:** Rough reference analysis found unused files including `public/media/logo/1.png` (1.22 MB), a second logo, four certification images, a trade-lane image, and two supply-chain images. Total public directory size is about 9.5 MB.
- **Why it matters:** Unreferenced public files increase repository/deploy transfer and remain directly addressable.
- **Affected location:** `public/media/**`.
- **Potential risk:** Slower deployments, larger backups, and accidental reuse of obsolete assets.

#### PERF-L2 — Source/device-size policy can request pointless upscaling

- **Problem:** Many 1376–2048 px source images advertise Next candidates through 3840 px. A 4K viewport may request an output larger than the source without gaining detail.
- **Why it matters:** It consumes optimizer CPU/cache and can transfer more bytes for no quality benefit.
- **Affected location:** `next.config.ts` image sizes/defaults; image source library; `sizes="100vw"` heroes.
- **Potential risk:** Larger cache footprint and unnecessary image processing.

#### PERF-L3 — Direct public/OG assets revalidate on every request

- **Problem:** Direct `/media/...` responses use `Cache-Control: public, max-age=0`; Open Graph crawlers fetch these direct URLs rather than `/_next/image`.
- **Why it matters:** Social crawlers and repeat direct requests cannot use a meaningful freshness window.
- **Affected location:** static public media hosting/deployment headers; SEO metadata image URLs.
- **Potential risk:** Extra origin traffic and slower social-card retrieval.

#### PERF-L4 — Reveal creates many small hydration/observer islands

- **Problem:** Each `Reveal` instance constructs its own IntersectionObserver and ships client code; content starts at opacity zero until JS/CSS state resolves.
- **Why it matters:** The overhead is small today but scales with About, Markets, Products, and supply-chain sections.
- **Affected location:** `src/components/shared/Reveal.tsx`; all callers.
- **Potential risk:** Additional hydration work and delayed visual availability when JS is slow.

#### PERF-L5 — No performance budget or field monitoring exists

- **Problem:** There is no Lighthouse/Web Vitals CI budget, RUM, or documented LCP/CLS/INP baseline.
- **Why it matters:** Bundle measurements identify risk but cannot prove real-user outcomes.
- **Affected location:** CI/observability configuration.
- **Potential risk:** Gradual regressions in assets, fonts, JS, and visual effects.

## 3. Recommended Fix

| Priority | Related issue | What should change and why | Expected impact | Complexity | Related files/components | Trade-offs |
|---|---|---|---|---|---|---|
| 1 | PERF-M1 | Stop preloading both fonts. Prefer locale-specific subsets with Unicode ranges and only preload the active subset; as an interim step set preload off and let CSS request only the used face. Subset Inter into Latin/Cyrillic/Vietnamese ranges if licensing/tooling permits. | **High:** saves up to 352–463 KB of forced transfer per visit | M | locale/global layouts, font assets/CSS | Disabling preload without subsetting may increase active-font discovery time; validate text LCP and FOIT/FOUT. |
| 2 | PERF-M2 | Make localized not-found content server/static where possible, give the client error boundary only a compact error-label map, avoid importing all dictionaries into both boundaries, and split static Header markup from small interactive islands. Set a route JS budget. | **High:** material reduction in universal JS parse/transfer | M–L | error/not-found, dictionaries, Header/layout, bundle tests | More islands/interfaces increase component count; framework error-boundary requirements constrain how far client JS can be removed. |
| 3 | PERF-M3 | Move product-query reading into a tiny client preselection wrapper using `useSearchParams` under Suspense, while keeping the contact page/form shell statically generated. Alternatively use a client-side enhancement after hydration. | **High:** restores CDN caching to all four contact pages | M | contact page, `RfqForm.tsx`, new query adapter | Product preselection may appear just after hydration unless initial state is carefully managed. |
| 4 | PERF-M4 | Replace large full-section backdrop filters with opaque/translucent solid backgrounds where no useful content is behind them; reduce fixed-header blur radius; profile representative mobile devices before retaining any expensive filter. | **Medium:** lower scroll paint/GPU cost and better INP stability | S–M | section classes, Header/Scroll CSS | The glass aesthetic becomes subtler; design review is required. |
| 5 | PERF-L1–L3 | Delete/archive verified unused media, configure realistic `deviceSizes`, avoid upscaling beyond source dimensions, and add long-lived cache headers for versioned public media or fingerprint OG filenames. | **Low–Medium:** leaner deploys and media caching | S–M | `public/media`, `next.config.ts`, deployment headers, metadata | Long cache lifetimes require versioned filenames when images change. |
| 6 | PERF-L4 | Use one shared observer, CSS view timelines/progressive enhancement, or reveal only a small number of major blocks. Default content visible when JS is unavailable. | **Low–Medium:** reduces hydration/observer count | M | `Reveal.tsx`, callers, CSS | CSS view timelines need browser fallbacks; removing motion changes visual feel. |
| 7 | PERF-L5 | Add automated bundle-size checks, Lighthouse runs for EN/FA home/contact/product, and privacy-respecting Web Vitals reporting. Track LCP/CLS/INP by locale/device. | **Medium:** makes performance decisions evidence-driven | M | CI, optional RUM endpoint/provider | RUM introduces privacy/operations considerations and must match the Privacy Policy. |

---

# Report 5 — SEO and Search Engine Readiness

## 1. Current Strengths

1. **Current technical output is exceptionally consistent.** All 100 sitemap URLs returned 200, one H1, valid canonical, complete metadata, and parseable structured data.
2. **Canonical and hreflang output is complete today.** Every page emits EN/FA/RU/VI plus `x-default`, and the sitemap mirrors the same alternates.
3. **Metadata is localized and well-sized.** Current titles are 38–68 characters and descriptions 91–160; no duplicate rendered title or description was found in the same current URL set.
4. **URL architecture is predictable.** All public pages have explicit locale prefixes and stable product/market/blog slugs; unknown dynamic slugs return real 404s because `dynamicParams=false`.
5. **Sitemap coverage is comprehensive.** Static, product, market, and blog pages are included; disabled content is filtered; blog dates populate `lastModified` when valid.
6. **Robots/admin handling is sound.** APIs/admin are excluded from the sitemap; admin/OAuth receive X-Robots noindex; public pages are index/follow.
7. **Open Graph/Twitter coverage is broad.** Pages have locale, URL, site name, title, description, large image, and OG image alt; blogs emit article metadata.
8. **Structured data is restrained.** There are no fabricated offers, prices, availability, reviews, ratings, certificate numbers, shipment volumes, customers, or guarantees.
9. **Content quality and intent separation are strong.** Products, markets, quality, supply chain, blog, and RFQ pages target distinct procurement questions and link logically.
10. **Persian SEO foundations are correct.** Persian pages render `lang="fa"`, RTL, localized titles/descriptions/body content, and language-specific internal links.
11. **Image-alt and heading hygiene are strong.** Generated images have alt attributes, Markdown bodies contain no H1, and no heading-level jump was found in rendered main content.

## 2. Issues Found

### Critical

No confirmed Critical SEO issue was found. The Security report’s OAuth XSS should still block production release because a compromised site can invalidate all SEO trust.

### Medium

#### SEO-M1 — Hreflang assumes translations that the CMS does not guarantee

- **Problem:** `buildAlternates()` and sitemap alternates emit all four locale URLs for every path unconditionally. Blog locale collections are explicitly independent; non-blog Decap collections create only English entries. New content can therefore have no counterpart while still advertising one.
- **Why it matters:** Hreflang must reference equivalent, indexable pages and should be reciprocal. A future English-only product/blog/market can create alternate URLs that 404 or represent unrelated content.
- **Affected location:** `src/lib/seo/metadata.ts`; `src/app/sitemap.ts`; `public/admin/config.yml`; content loaders/static params.
- **Current status:** All current sets are synchronized and the 100-page crawl found no broken alternate. This is a confirmed design flaw in the supported publishing workflow, not a current broken URL.
- **Potential risk:** Search engines ignore hreflang clusters, crawl 404 alternates, or associate the wrong language pages.

#### SEO-M2 — Transparent English fallback can produce wrong-language indexable pages

- **Problem:** The content parser can serve an English directory under another locale if that locale directory is absent. Public loaders discard `fromFallback`, while metadata still declares the requested locale and all hreflang variants.
- **Why it matters:** Fallback content would be marked `lang="fa"`, `ru`, or `vi` and canonicalized as a translation even though the body is English.
- **Affected location:** `src/lib/content/parse.ts`; public functions in `loaders.ts`; locale pages/metadata.
- **Current status:** No fallback is active in the current complete content set.
- **Potential risk:** Duplicate content, wrong-language results, misleading hreflang, and poor localized search experience.

#### SEO-M3 — Product schema makes an unsupported brand assertion

- **Problem:** `productSchema()` declares Feiz Food Group as each Product’s `brand`. Repository content establishes Feiz Food Group as an exporter/supplier but does not establish that every poultry product is a Feiz-manufactured or Feiz-owned brand.
- **Why it matters:** Structured data is a factual assertion, not presentation copy. This conflicts with the project requirement not to imply unsupported company/product facts.
- **Affected location:** `src/lib/seo/schema.ts` (`productSchema`); product content model.
- **Potential risk:** Semantically inaccurate structured data, reduced trust in markup, and unsupported commercial positioning.

#### SEO-M4 — Localized SEO publishing outside blogs bypasses Decap

- **Problem:** Editors can update only English page/product/market SEO fields through the configured general collections. FA/RU/VI metadata must be edited manually in Git.
- **Why it matters:** Search optimization is continuous; inaccessible localized fields tend to drift or remain stale.
- **Affected location:** `public/admin/config.yml`; localized content files.
- **Potential risk:** Uneven localized search performance and outdated Persian/Russian/Vietnamese snippets.

### Low

#### SEO-L1 — Stable locale redirects are temporary

- **Problem:** `/` and unprefixed paths use NextResponse’s default 307 redirect rather than a permanent 308.
- **Why it matters:** The default-locale mapping is structural, not temporary. A permanent redirect communicates consolidation more clearly.
- **Affected location:** `src/proxy.ts`.
- **Potential risk:** Minor crawl inefficiency and weaker redirect canonicalization signals.

#### SEO-L2 — Sitemap freshness is sparse or synthetic

- **Problem:** Only blog entries receive `lastModified`; products, markets, and pages do not. Every route uses `monthly` even for legal/static pages, and priority values add limited value to major search engines.
- **Why it matters:** Accurate modification dates are more useful than generic frequency declarations.
- **Affected location:** `src/app/sitemap.ts`; content models.
- **Potential risk:** Less efficient recrawling and no freshness signal after commercial-page updates.

#### SEO-L3 — Article update semantics are absent

- **Problem:** Blog content has `datePublished` but no `dateModified`; author organizations lack a stable `@id`; image objects omit dimensions.
- **Why it matters:** These are valid optional enhancements for clearer entity/article interpretation.
- **Affected location:** blog frontmatter/types, `articleSchema()`, metadata.
- **Potential risk:** Reduced structured-data completeness, not invalid markup.

#### SEO-L4 — Social metadata can be made more explicit

- **Problem:** OG image width/height/type are omitted; Twitter images are strings without explicit alt; no social-account identity is emitted because confirmed accounts are unavailable.
- **Why it matters:** Explicit dimensions/types can improve crawler predictability. Omitting unverified accounts is correct.
- **Affected location:** `src/lib/seo/metadata.ts`; image fact model.
- **Potential risk:** Minor social-preview variability.

#### SEO-L5 — English-only slugs are a localized-keyword trade-off

- **Problem:** Persian, Russian, and Vietnamese URLs retain English path segments/slugs.
- **Why it matters:** Stable shared slugs simplify hreflang and switching, but do not reinforce local-language terms in URLs.
- **Affected location:** route architecture, content slugs, locale switching.
- **Potential risk:** Small relevance/readability opportunity cost; changing now would require a durable redirect map and may not be worthwhile.

## 3. Recommended Fix

| Priority | Related issue | What should change and why | Expected impact | Complexity | Related files/components | Trade-offs |
|---|---|---|---|---|---|---|
| 1 | SEO-M1 | Model translation groups explicitly, either with a shared stable translation ID or verified slug parity. Generate hreflang only for counterparts that exist, are enabled, and represent the same entity; use the same helper for metadata and sitemap. Add reciprocal-alternate tests. | **High:** keeps future hreflang valid as CMS content diverges | M–L | metadata helper, sitemap, content types/loaders, Decap config | Partial locale content will have smaller hreflang clusters, which is correct but less visually uniform. |
| 2 | SEO-M2 | Do not silently fallback indexable entity/page bodies across locales. Prefer a real localized 404/absence; if fallback is a product requirement, retain provenance, emit the actual language, and generally noindex it until translated. | **High:** prevents wrong-language duplicate indexing | M | `parse.ts`, loaders, route metadata/pages | Users may see fewer pages in incomplete locales instead of English fallback. |
| 3 | SEO-M3 | Remove `brand` from Product until brand ownership is explicitly verified and represented in content. Maintain a schema fact policy distinguishing exporter/seller, manufacturer, and brand; do not substitute one for another. | **High for factual integrity; Medium for search** | XS–S | `src/lib/seo/schema.ts`, optional Product schema fields | Product rich-result markup remains valid without brand but contains one fewer property. |
| 4 | SEO-M4 | Expose localized page/product/market SEO fields through four-locale CMS collections or a translation workflow linked by stable IDs, with snippet previews and validation. | **Medium–High:** sustainable localized search optimization | L | `public/admin/config.yml`, content schema/workflow | Larger CMS navigation and translation governance overhead. |
| 5 | SEO-L1 | Use permanent 308 redirects for stable root/default-locale normalization while preserving query strings. | **Low–Medium:** clearer canonical routing | XS | `src/proxy.ts` | Permanent redirects are sticky in browsers; change only after confirming `/en` remains the long-term default. |
| 6 | SEO-L2–L3 | Add validated `updated` fields to products/markets/blogs/pages; emit accurate sitemap `lastModified` and BlogPosting `dateModified`; use stable author/publisher IDs and image dimensions where known. Drop synthetic frequency/priority if not maintained. | **Medium:** better freshness/entity signals | M | content models, Decap fields, sitemap, schemas | Editors must maintain update dates honestly; automated Git dates can reflect non-content changes. |
| 7 | SEO-L4 | Store image dimensions/type in an asset manifest and emit them in OG/JSON-LD/Twitter metadata; add Twitter alt objects where supported. | **Low:** more predictable previews | M | metadata/schema, media tooling | Asset metadata needs regeneration when files change. |
| 8 | SEO-L5 | Retain shared English slugs unless keyword research proves localized URLs justify migration. If changed, introduce per-locale slug fields, translation IDs, permanent redirects, and locale-aware switch mappings in one release. | **Low/conditional:** potential local SERP readability | L | routes, content, CMS, sitemap, metadata, redirect map | High migration complexity and risk of losing existing URL equity. |

---

# Executive Summary

## Overall quality assessment

The repository has a **strong content, internationalization, static-rendering, and technical-SEO foundation**, with unusually thorough current locale parity and restrained commercial claims. Lint, strict typecheck, build, dependency audit, all 100 public URLs, all internal links, metadata, headings, hreflang, JSON-LD parsing, and image-alt checks pass.

It is **not production-safe until the OAuth callback XSS is fixed**. That issue is directly reproducible when OAuth is configured, which is the intended production state. The admin’s mutable CDN script and overbroad GitHub scope amplify the impact of browser-context compromise.

After the Critical fix, the largest practical risks are:

1. RFQ rate limiting that changes security and availability behavior by deployment topology
2. Missing environment/deployment contract and no regression tests/CI
3. WCAG contrast failures and incomplete modal/form accessibility
4. Turnstile retry behavior that can lose enquiries
5. Multilingual CMS/hreflang architecture that works for today’s synchronized files but will break under supported independent publishing
6. Forced dual-font preload and high universal JavaScript for a mostly static site
7. An unsupported Product `brand` structured-data assertion

## Strongest assets

- Complete current four-locale content set with Persian RTL
- Clear B2B buyer journey and RFQ context
- Safe RFQ validation/email construction baseline
- Comprehensive localized metadata and internal linking
- 96/100 public pages prerendered and aggressively cached
- Next/Image usage with reserved layout dimensions
- Restrained structured data and explicit avoidance of invented offers/ratings/certifications
- Clean dependency vulnerability scan

## Risk posture

- **Critical:** 1 confirmed issue — OAuth callback reflected XSS
- **Medium:** Security topology, privileged CDN code, OAuth scope/origin, accessibility, RFQ recovery, CMS/schema drift, tests/deployment, fonts/JS/contact rendering, future hreflang integrity, Product schema accuracy
- **Low:** Hardening, cleanup, asset/cache polish, optional schema/social enhancements, and visual consistency

---

# Priority Roadmap

## Immediate fixes (Critical)

### 1. Close OAuth callback XSS before any production/admin use

- **Action:** Validate state before OAuth denial handling; never reflect raw provider descriptions; apply HTML-safe inline serialization; add nonce CSP; regression-test script-closing payloads.
- **Expected impact:** Eliminates confirmed same-origin code execution and protects editor/GitHub credentials.
- **Estimated complexity:** M (2–4 days including tests)
- **Related files/components:** `src/app/api/callback/route.ts`, `src/lib/cms/oauth.ts`, `next.config.ts`, new OAuth tests.

## Short-term improvements (Medium)

### 2. Harden the privileged CMS/OAuth chain

- **Action:** Self-host/pin Decap, remove unpkg trust, exact-allowlist OAuth origins, reduce `repo` scope immediately and plan repository-scoped GitHub App access.
- **Expected impact:** Greatly reduces content-repository and credential blast radius.
- **Estimated complexity:** M immediately; L for GitHub App migration
- **Related files/components:** admin HTML/assets/CSP, OAuth library/routes, CMS docs/config.

### 3. Make RFQ abuse controls correct for the chosen host

- **Action:** Select Vercel or VPS as authoritative; use shared/edge atomic rate limiting, trusted IP extraction, early coarse limits, bounded bodies/fetches, Turnstile hostname/action checks, and Retry-After.
- **Expected impact:** Prevents global buyer lockout, spam bypass, and resource exhaustion.
- **Estimated complexity:** M
- **Related files/components:** RFQ route/security/IP/rate-limit/constants, deployment config.

### 4. Restore and validate the environment/deployment contract

- **Action:** Add `.env.example`, startup validation, Node/package-manager versions, deployment configuration, health checks, and consistent docs.
- **Expected impact:** Prevents builds that deploy with unusable RFQ/CMS/security behavior.
- **Estimated complexity:** S–M
- **Related files/components:** root config, README/docs, RFQ/OAuth config.

### 5. Add tests and CI as a release gate

- **Action:** Cover OAuth serialization/state/origin, RFQ validation/rate limiting/Turnstile, content contracts, 100-route metadata/hreflang, keyboard navigation, and RTL visual states.
- **Expected impact:** Stops recurrence of the Critical issue and protects the multilingual system.
- **Estimated complexity:** M–L
- **Related files/components:** new tests and `.github/workflows/*`.

### 6. Resolve WCAG contrast and navigation/form accessibility

- **Action:** Replace failing tokens, implement a focus-trapped mobile menu, complete locale-selector keyboard behavior, and add required/error semantics and focus recovery to RFQ.
- **Expected impact:** Broad WCAG AA improvement and higher form completion.
- **Estimated complexity:** M
- **Related files/components:** `globals.css`, Button/cards/headings, Header, RfqForm.

### 7. Repair Turnstile retry and Persian mixed-direction behavior

- **Action:** Reset widget/token after errors, expose widget error states, require a valid configured token, and isolate email/phone/numeric/code values with LTR/bidi controls.
- **Expected impact:** Fewer lost enquiries and safer Persian commercial-data reading.
- **Estimated complexity:** M
- **Related files/components:** TurnstileWidget, RfqForm, contact/footer/specification components.

### 8. Make CMS and content schemas genuinely multilingual

- **Action:** Build locale-complete collections from one schema, enforce content invariants, remove the redundant editable language field, and expose all localized SEO fields.
- **Expected impact:** Prevents translation drift, invalid builds, and manual-only localized updates.
- **Estimated complexity:** L
- **Related files/components:** Decap config, content types/parse/loaders, all locale collections.

### 9. Make hreflang counterpart-aware and remove unsupported Product brand

- **Action:** Generate alternates from verified translation groups/existence, eliminate transparent wrong-language fallback, and omit Product `brand` until verified.
- **Expected impact:** Preserves international indexing integrity and factual schema accuracy.
- **Estimated complexity:** M–L for hreflang; XS for brand removal
- **Related files/components:** metadata, sitemap, content loaders/types, schema.

### 10. Remove the largest transfer costs

- **Action:** Load/preload only the active locale font/subset; shrink universal error/not-found dictionary bundles; statically cache contact by moving query preselection client-side; reduce large backdrop filters.
- **Expected impact:** Saves hundreds of KB and improves LCP/INP resilience.
- **Estimated complexity:** M–L
- **Related files/components:** layouts/fonts, error/not-found, Header/dictionaries, contact/RFQ, global CSS.

## Future improvements (Low)

### 11. Clean dead code, stale assets, and tooling dependencies

- **Expected impact:** Leaner repository, installs, deploys, and maintenance surface
- **Estimated complexity:** S–M
- **Related files/components:** unused shared components/routes/CSS, `public/media`, package files, obsolete docs.

### 12. Improve editorial and UI polish

- **Expected impact:** Better localized consistency and trust through localized blog dates, actionable contact details, accessible loading text, clearer noninteractive cards, and improved supply-rail behavior
- **Estimated complexity:** S–M
- **Related files/components:** blog page, footer/contact/RFQ, loading, cards, SupplyChainRail.

### 13. Add accurate freshness and richer verified social/article metadata

- **Expected impact:** Better recrawl and social-preview consistency without inventing facts
- **Estimated complexity:** M
- **Related files/components:** content models/Decap, sitemap, metadata, article schema, asset manifest.

### 14. Establish performance and accessibility monitoring

- **Expected impact:** Detects LCP/CLS/INP, bundle, contrast, keyboard, and RTL regressions before and after release
- **Estimated complexity:** M
- **Related files/components:** CI, optional privacy-reviewed RUM, browser-test fixtures.

---

# Final Release Recommendation

**Do not enable production OAuth/admin access until SEC-C1 is fixed and regression-tested.** After that release blocker, prioritize the CMS script/scope/origin chain, RFQ topology, environment validation, and automated tests. The public content and SEO implementation can otherwise be considered a strong pre-production baseline, provided the Medium accessibility, multilingual publishing, and performance items are scheduled rather than treated as optional polish.
