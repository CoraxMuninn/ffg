# Legal / Privacy / Supporting Pages — Implementation Report

**Project:** Feiz Food Group website (Next.js 16.3.0, App Router, Tailwind v4)
**Phase:** Legal & supporting pages only
**Date:** 2026-08-13

---

## 1. Legal Audit

### 1.1 State before this phase

| Item | Status found |
|---|---|
| Legal pages of any kind | **None.** No `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/accessibility` routes existed in `src/app/[locale]/`. |
| Footer legal links | **None.** The footer bottom bar contained the copyright line plus an **empty `<div>`** — a placeholder never filled in. |
| Dictionary strings | `footer.privacy` and `footer.terms` **already existed in all four locales but were never rendered** — dead keys. |
| Legal content in CMS | **None.** `content/{locale}/pages/` held 9 marketing pages; no legal documents. |
| Sitemap | 82 URLs, no legal routes. |
| robots.txt | `Allow: /`, disallowing only `/api/` and `/admin/`. |

**Classification:** there were no "partial" or "linked-but-missing" legal pages. The only latent signal was the two unused dictionary keys and the empty footer div, which indicate legal links were **planned but never built**. This phase completes that intent.

### 1.2 Pages created

| Page | Verdict | Reason |
|---|---|---|
| **Privacy Policy** | **Created** (required) | The site collects personal data through the RFQ form (name, company email, phone, country) and transmits it to a third-party processor. A privacy notice is the baseline expectation for any international B2B buyer and for most data-protection regimes the buyers operate under. |
| **Terms of Use** | **Created** | The site publishes product specifications and accepts quotation requests. Without terms, published specs risk being read as a binding offer. The document exists mainly to establish that **listings are indicative and only a signed contract binds** — a commercial protection, not boilerplate. |

### 1.3 Pages deliberately NOT created

| Page | Verdict | Reason |
|---|---|---|
| **Cookie Policy** | **Skipped as a standalone page** | Grep-verified across `src/`: **zero** `document.cookie`, `localStorage`, `sessionStorage`, and zero analytics/advertising/tag-manager SDKs. Fonts are self-hosted via `next/font/local`, so no third-party font requests. The only third-party browser storage is Cloudflare Turnstile's strictly-necessary technical state. A dedicated page would be a mostly-empty document implying tracking that does not exist. Covered instead by a **"Cookies and similar technologies"** section inside the Privacy Policy. **Revisit if analytics is ever added.** |
| **Disclaimer** | **Skipped as a standalone page** | A separate disclaimer would duplicate the Terms. Disclaimer-type wording is folded into the Terms sections **"Product information"**, **"Availability"** and **"Liability"**, where a reader actually looks for it. |
| **Accessibility statement** | **Skipped** | An accessibility statement is a *commitment* with a conformance claim, contact route and remediation timeline. No audit has been performed, so any published claim would be invented. Better omitted than falsely asserted. |
| **Legal contact / imprint page** | **Skipped** | An imprint requires the registered entity name, address, registration number and (where applicable) VAT ID — **none confirmed** (see §9). Contact routes already exist via `/contact` and are cross-linked from both legal pages. Once entity details are confirmed, a proper imprint can be added. |
| **Modern-slavery / anti-bribery / ESG statements** | **Skipped** | Policy commitments the business has not confirmed. Would be invention. |

**Net result: 2 documents × 4 locales = 8 pages.** Nothing was created "because a website usually has one".

---

## 2. Routes Created

Both use the **existing** `[locale]` segment, `generateStaticParams`, dictionary and content loaders — no parallel routing system.

```
src/app/[locale]/privacy/page.tsx   → /en/privacy  /fa/privacy  /ru/privacy  /vi/privacy
src/app/[locale]/terms/page.tsx     → /en/terms    /fa/terms    /ru/terms    /vi/terms
```

All 8 URLs are **statically prerendered** (build output rose 82 → 90 pages) and return **HTTP 200**.

**Rendering:** both routes are **Server Components with zero client JavaScript**. Shared presentation lives in `src/components/legal/LegalPage.tsx`, which composes existing primitives — `PageHeader`, `Container`, `Prose` — so the pages inherit the design system rather than redefining it. No animation library, no new runtime dependency.

**Design:** navy `PageHeader` with a "Legal" eyebrow matching the `certifications` page pattern; body on white with measure capped at **70ch** for readability; locale-formatted "Last updated" line; cyan-accented related-page links; a restrained smoke-toned contact card at the end. Content headings render as `<h2>` through the existing `Prose` renderer, so typography is identical to the rest of the site.

---

## 3. Footer Links

Added to the **bottom bar** — the previously empty `<div>` beside the copyright line — as a semantic `<nav aria-label="Legal">` with a `<ul>`:

```
© 2026 Feiz Food Group. All rights reserved.        Privacy Policy    Terms of Use
```

- Uses the existing `localizedPath(locale, …)` helper, so links always stay inside the active locale.
- Styled with the footer's existing `text-silver hover:text-white text-sm transition-colors` — no new design language.
- Wraps and centres on mobile; mirrors correctly in RTL (verified visually at 390 px and 1440 px).
- **Not added to the primary navigation**, per the brief — legal links must not compete with the commercial journey.
- The four "Quick Links" / "Products" footer columns were left untouched; a separate "Legal" column would have added a near-empty fifth column, so the bottom bar was the cleaner fit.

**Link labels** come from new `legal.privacy` / `legal.terms` dictionary keys rather than the existing `footer.*` keys, because of a naming conflict — see §4.

---

## 4. Localization Confirmation

All four locales verified rendering **native content with no English fallback**:

| Locale | Privacy title | Terms title | `dir` | Date rendering |
|---|---|---|---|---|
| **EN** | Privacy Policy | Terms of Use | `ltr` | 13 August 2026 |
| **FA** | سیاست حفظ حریم خصوصی | شرایط استفاده | **`rtl`** | ۲۲ مرداد ۱۴۰۵ (Jalali) |
| **RU** | Политика конфиденциальности | Условия использования | `ltr` | 13 августа 2026 г. |
| **VI** | Chính sách bảo mật | Điều khoản sử dụng | `ltr` | 13 tháng 8, 2026 |

- Content lives in `content/{en,fa,ru,vi}/pages/{privacy,terms}.md`, loaded through the existing `getPageContent` loader — the same pipeline as every other CMS page.
- **All four language versions are structurally identical** (13 `<h2>` sections in Privacy, 12 in Terms) — same clauses, same order, no locale receives weaker or different substantive content.
- **Persian RTL:** `dir="rtl"` confirmed on both pages at all three breakpoints; body text, headings, bullets and the arrow icons on related links all mirror correctly (icons use `rtl:rotate-180`). Vazirmatn renders throughout.
- **Persian date** displays in the Jalali calendar via `Intl.DateTimeFormat("fa-IR")` — correct for Persian readers, while the machine-readable `<time datetime="2026-08-13">` stays ISO for crawlers.

### Naming conflict resolved
The existing `footer.terms` key read **"Terms of Service"** (EN) / **"Điều khoản dịch vụ"** (VI), but the site does not provide a *service* — it publishes information and accepts enquiries. **"Terms of Use"** is the accurate label. Rather than mutate keys already in use, a dedicated `legal` dictionary block was added (`legal.privacy`, `legal.terms`, plus UI strings for the eyebrow, "Last updated", related-pages heading and contact card) in all four locales and in `dictionaries/types.ts`. The old `footer.privacy` / `footer.terms` keys remain untouched and still unused — **flagged in §9** as safe to delete once you confirm the naming.

---

## 5. SEO Metadata & Sitemap

**Metadata** — generated through the existing `buildPageMetadata` helper (Next.js Metadata API), verified in the rendered HTML for all 8 URLs:

- Localized `<title>`, e.g. `Privacy Policy | Feiz Food Group`, `Политика конфиденциальности | Feiz Food Group`
- Localized `<meta name="description">` drawn from the CMS frontmatter
- **Self-referencing canonical**, e.g. `https://feizfood.com/en/privacy`
- **Full hreflang cluster** on every page: `en`, `fa`, `ru`, `vi` + `x-default` → EN
- **BreadcrumbList JSON-LD** (Home → page), consistent with other pages
- No keyword stuffing, no artificial inflation — descriptions are plain factual sentences

**Sitemap** — both paths added to `STATIC_ROUTES` in `src/app/sitemap.ts` at **priority 0.3**, the lowest on the site (vs. 0.6 for blog, higher for commercial pages). Sitemap now serves **84 URLs**, 8 of them legal.

*Rationale:* legal pages should be indexable and discoverable (they are a trust signal for B2B buyers vetting an unfamiliar exporter) but must never compete with product and market pages. Low priority in the sitemap plus footer-only linking achieves exactly that. `noindex` was deliberately **not** used — hiding a privacy policy reduces buyer trust with no SEO benefit.

**robots.txt — unchanged.** No reason to alter crawl behaviour; the existing `/api/` and `/admin/` disallows remain the only rules.

---

## 6. Technical Accuracy vs. Real Data Architecture

Every factual claim was derived by reading the actual implementation (`src/app/api/rfq/route.ts`, `src/lib/rfq/*`), not from a template.

| Claim in the Privacy Policy | Verified against |
|---|---|
| Ten enumerated form fields (name, company, email, country, phone, product, quantity, message, destination port, packaging) | `src/lib/rfq/types.ts` + `constants.ts` |
| Submission is **emailed** to the sales inbox and **not written to any database** | No DB client, no ORM, no persistence layer anywhere in the repo |
| **No CRM** | No CRM SDK or webhook in the codebase |
| Delivery via **Resend**; buyer's address set as **Reply-To** | `src/lib/rfq/email.ts` |
| **Cloudflare Turnstile** verifies submissions | `src/app/api/rfq/route.ts`, `TurnstileWidget.tsx` |
| Rate limiting is **short-lived, in-memory, non-profiling** | `src/lib/rfq/rate-limit.ts` — in-memory `Map`, 5 requests/hour, resets on restart |
| IP address used **only** as a rate-limit key, never stored or emailed | `src/lib/rfq/ip.ts` — value never reaches the email payload |
| **No cookies, no analytics, no tracking, no advertising** | Grep across `src/`: zero cookie/storage APIs, zero analytics SDKs |
| Fonts are **self-hosted** (no third-party font requests) | `next/font/local` in `layout.tsx` |
| Only **two** third parties named: Resend, Cloudflare Turnstile | Full dependency and network-call review |
| Retention described **functionally** ("kept in our email system for as long as needed to handle the enquiry and any resulting business relationship") | No retention policy exists to cite — no number invented |

**Nothing was invented.** The policy contains no entity name beyond the trading brand, no registration number, no address, no jurisdiction, no GDPR-compliance claim, no named DPO, no retention period in days, and no payment processor (the site takes no payments). Where a legally-shaped statement would normally sit, careful general wording is used instead — e.g. governing law is deferred to *"the contract documents agreed for that transaction"* rather than naming a court, and the Privacy Policy asks the buyer to *"tell us which national or regional law you are relying on"* rather than asserting compliance with a specific regime.

---

## 7. Validation

| Check | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **Pass** — exit 0, no errors |
| `npm run lint` (ESLint) | **Pass** — exit 0, no warnings |
| `npm run build` | **Pass** — compiled successfully, **90/90** static pages (was 82) |
| All 8 legal URLs | **HTTP 200** |
| Sitemap | 84 URLs; 8 legal entries at priority 0.3 |
| robots.txt | Unchanged |
| Footer links, all 4 locales | 2 per locale, correct labels, all targets **200** |

**Browser matrix — 24 combinations** (4 locales × 2 pages × 3 viewports: 390 px, 768 px, 1440 px), automated via Playwright:

| Assertion | Result |
|---|---|
| **Horizontal overflow** (`scrollWidth − clientWidth`) | **0 px on all 24** |
| **Console / page errors** | **None on all 24** |
| **Heading hierarchy** | Exactly one `<h1>` per page; content headings are `<h2>` — no skipped levels |
| **`dir` attribute** | `rtl` on both FA pages at every viewport; `ltr` elsewhere |
| **Footer legal links present** | 2 on every page |
| **Localized "Last updated"** | Rendered in all 4 locales |

**Accessibility:** semantic `<nav aria-label>`, `<ul>`/`<li>` link lists, `<time datetime>`, correct heading order, keyboard-reachable links with the site's existing visible focus styles, and **44 px minimum touch targets** (`min-h-11`) on every link and button in the new components. No new interactive widgets, no client-side JS.

**Visual review:** EN and FA captured at desktop and mobile — header, document body, related-links block, contact card and footer all render consistently with the existing design system in both directions.

---

## 8. Files Changed and Created

### Created (11)
```
content/en/pages/privacy.md          content/en/pages/terms.md
content/fa/pages/privacy.md          content/fa/pages/terms.md
content/ru/pages/privacy.md          content/ru/pages/terms.md
content/vi/pages/privacy.md          content/vi/pages/terms.md
src/app/[locale]/privacy/page.tsx    src/app/[locale]/terms/page.tsx
src/components/legal/LegalPage.tsx
```

### Modified (9)
```
src/components/layout/Footer.tsx        legal links in the previously empty bottom-bar div
src/app/sitemap.ts                      /privacy + /terms at priority 0.3
src/lib/content/types.ts                optional `updated` field on Page
src/lib/content/loaders.ts              parse `updated` (string or YAML date → YYYY-MM-DD)
src/lib/i18n/dictionaries/types.ts      new `legal` block in the Dictionary contract
src/lib/i18n/dictionaries/en.ts         legal strings
src/lib/i18n/dictionaries/fa.ts         legal strings
src/lib/i18n/dictionaries/ru.ts         legal strings
src/lib/i18n/dictionaries/vi.ts         legal strings
public/admin/config.yml                 "Last updated" date widget on the pages collection
```

*(Note: `git status` also shows unrelated modifications from earlier phases — Products page, Header, `globals.css`, deleted certification JPEGs. Those are prior work, not part of this phase.)*

**Not touched, per scope:** Homepage, Products, Markets, Quality Control, Supply Chain, About, Header, RFQ form, robots.ts.

### Content-authoring note
The legal documents reference `info@feizfood.com` and `+98 922 358 3442` as **literal text inside the markdown**, rather than importing `PUBLIC_EMAIL` / `PUBLIC_PHONE` from `src/lib/content/contact.ts`. This is deliberate — the copy is CMS-editable prose — but it does mean **these two values now appear in a second place**. If the contact details ever change, the eight markdown files must be updated alongside `contact.ts`.

---

## 9. Unresolved Legal Information — Requires Business Confirmation

None of the following was invented. Each is either omitted from the published pages or expressed in deliberately general terms, and each should be reviewed by the business (and, where indicated, a qualified lawyer) before the pages are considered final.

| # | Item | Current handling | Needed |
|---|---|---|---|
| 1 | **Registered legal entity name** | Only the trading name "Feiz Food Group" is used | The full registered company name, if it differs |
| 2 | **Company registration number** | Omitted entirely | Registration / national ID number |
| 3 | **Registered address** | Omitted entirely | Full postal address (also unlocks a proper imprint page) |
| 4 | **Governing law and jurisdiction** | Deferred to *"the contract documents agreed for that transaction"* | Named governing law and forum, confirmed by counsel |
| 5 | **Data retention period** | Described functionally, no duration stated | A concrete retention period, e.g. "enquiry emails deleted after N months" |
| 6 | **GDPR / data-protection regime status** | **No compliance claim made**; buyers are asked to state which law they rely on | Legal assessment of whether GDPR (or another regime) applies to EU-facing enquiries |
| 7 | **DPO / EU representative** | Omitted | Required only if a regime under item 6 applies |
| 8 | **"Last updated" date (2026-08-13)** | **Placeholder** — today's build date | The real intended publication date. Editable in the CMS via the new "Last updated" field |
| 9 | **Legal review of the drafted text** | Written as careful, factually-grounded plain English | These documents were drafted to be *accurate about the system*, not to constitute legal advice. **A qualified lawyer should review both before launch.** |
| 10 | **"Terms of Service" vs "Terms of Use"** | New `legal.*` keys say "Terms of Use"; legacy `footer.privacy` / `footer.terms` keys remain unused | Confirm the preferred label; the two legacy keys can then be deleted |
| 11 | **Cookie Policy trigger** | Correctly absent today | **If analytics, remarketing, embedded video or a chat widget is ever added, a Cookie Policy and consent mechanism become necessary** and the Privacy Policy's cookie section must be rewritten |
| 12 | **Rate-limit behaviour at scale** | Described as short-lived and in-memory — true today | If the app is ever deployed to multiple instances or moved to a shared store (e.g. Redis), the "Spam prevention and security" section must be updated |

---

## Separate Observations (found during audit, NOT fixed — out of scope)

1. **`footer.privacy` / `footer.terms` are now doubly redundant** — they were unused before this phase and remain unused. Safe to delete once item 10 above is settled.
2. **Blog dates render as raw ISO strings** — `src/app/[locale]/blog/[slug]/page.tsx:85` and `blog/page.tsx:104` output `post.date` unformatted, so a Persian reader sees `2026-03-14`. The new legal pages use proper `Intl.DateTimeFormat` localization; the blog could adopt the same approach.
3. **`content/*/pages/products.md` is authored but never rendered** — the Products page does not display that CMS body. Noted in an earlier phase; still open.

---

**Scope statement:** this phase touched only legal/supporting pages, footer legal links, their metadata, and sitemap integration. No unrelated changes were made.
