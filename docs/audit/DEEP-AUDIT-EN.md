# Feiz Food Group — Deep Audit & Gap Analysis

**Report:** DEEP-AUDIT-EN  
**Date:** 2026-08-10  
**Status:** Read-Only Analysis — No Code Modified  
**Repository:** `https://github.com/CoraxMuninn/ffg.git`  
**Specs Reviewed:** 6 Markdown docs + 2 HTML docs in `/docs/`

---

## 1. Executive Summary

The Feiz Food Group repository is a **Next.js 16 homepage scaffold** with a polished visual shell but **no application architecture beneath it**. The header, footer, and nine homepage sections are implemented with real imagery and brand-consistent styling. However, **none of the documented system exists in code**: no i18n routing, no CMS, no product detail pages, no markets pages, no RFQ flow, no SEO infrastructure, no security headers, and no non-English content.

The gap between documentation and implementation is not incremental — it is structural. The documentation describes a complete B2B export platform with multilingual CMS-driven content, RFQ conversion infrastructure, and international SEO. The code currently delivers a single language, single-page visual prototype.

**Overall Project Status: Foundation**  
A foundation exists, but the system described in the documentation has not been built.

---

## 2. Business Architecture Audit

### 2.1 What the Documentation Requires

| Element | Documentation Requirement |
|---|---|
| Company | Feiz Food Group — Iran-based international B2B frozen poultry exporter |
| Primary Product | Frozen Chicken Feet (Grade A/A+, IQF) |
| Secondary Products | Chicken Liver, Chicken Gizzard, Chicken Heart |
| Primary Market | Vietnam |
| Secondary Markets | UAE, Russia, Thailand |
| Target Buyers | Importers, Distributors, Wholesalers, Food Processing Companies |
| Primary Conversion | Request a Quote (RFQ) |
| Buyer Journey | Home → Products → Product Detail → Trust/Quality → Markets → RFQ |
| Languages | English (default), Persian (RTL), Russian, Vietnamese |
| Trust Architecture | Two separate systems: 6 certifications + 8 trust/capability features |
| Content Strategy | CMS-driven, B2B professional copy, no consumer messaging |
| SEO Strategy | Technical multilingual SEO with hreflang, Schema.org, sitemap, robots |
| Hosting | VPS with reverse proxy |
| CMS | Decap CMS → GitHub → Markdown |

### 2.2 What the Code Delivers

- A homepage that visually communicates "international frozen poultry exporter"
- Product range shown as 4 cards with hardcoded data
- Featured Chicken Feet section with 8 hardcoded specs
- Trust capabilities shown as 8 hardcoded feature cards
- Certifications shown as 4 of 6 required (HACCP, ISO 22000, Halal, Health Certificate)
- Supply chain shown as 8 steps (missing "Destination Delivery" from the documented 9)
- Markets shown as 4 market cards linking to non-existent pages
- Header with language switcher UI that does nothing functionally
- Footer with contact info (placeholder phone number)

### 2.3 Business Architecture Gaps

**Critical Gaps:**

1. **No RFQ conversion infrastructure exists.** The primary business objective — generating qualified RFQs — has zero implementation. Every CTA links to `/contact`, which does not exist.

2. **No product detail pages exist.** The documentation requires independent CMS-driven product pages for all 4 products, with Chicken Feet receiving the deepest treatment. None exist. The `/products/frozen-chicken-feet` route that buttons link to returns 404.

3. **No actual multilingual capability.** The language switcher in the header is a client-state toggle that changes a displayed flag but does not change the URL, content, direction, or language. No Persian, Russian, or Vietnamese content exists anywhere.

4. **Markets links to individual market pages contradict documentation.** The docs say "Use one Markets page. Do not create separate market pages at this stage." The code links to `/markets/vietnam`, `/markets/uae`, `/markets/russia`, `/markets/thailand`.

5. **No CMS-driven content.** Every piece of text, spec, feature, certification, and market is hardcoded in components. The documented Decap CMS → GitHub → Markdown pipeline does not exist.

6. **No About Us, Quality Control, Supply Chain, Certifications, Contact, or Blog pages.** The documentation lists 10 required pages (plus 4 product detail routes). Only the homepage exists.

---

## 3. Technical Architecture Audit

### 3.1 Framework & Tooling

|Aspect|Documentation|Current State|Gap|
|---|---|---|---|
|Next.js|16 + App Router|16.3.0 + App Router|✅ Match|
|TypeScript|Required|5.x, strict mode|✅ Match|
|Tailwind|Tailwind CSS|4.x with `@tailwindcss/postcss`|✅ Match|
|shadcn/ui|Required, no separate Radix|shadcn v4 (base-nova), `@base-ui/react`|✅ Match (v4 approach)|
|Lucide React|Required|1.31.0|✅ Match|
|Decap CMS|Required|Not installed|❌ Missing|
|Resend|Required for RFQ|Not installed|❌ Missing|
|Sitemap|/sitemap.xml|Not generated|❌ Missing|
|Robots|robots.txt|Not generated|❌ Missing|

### 3.2 Server vs Client Component Boundaries

**Current state:**
- `layout.tsx` — Server Component ✅
- `page.tsx` — Server Component ✅
- All 9 section components — Server Components ✅ (no `"use client"`)
- `Header.tsx` — `"use client"` (required for scroll/state) ⚠️
- `button.tsx` — Uses `@base-ui/react` Button primitive

**Assessment:** The Server/Client boundary is correctly drawn. Header appropriately uses client state for scroll detection and mobile menu. All content sections are Server Components. This is architecturally sound and aligns with the documentation's "Server Components by default" principle.

### 3.3 Routing Architecture

**Documentation requires:**
```
/ → redirect to /en
/en
/fa
/ru
/vi
/[locale]/products
/[locale]/products/[slug]
/[locale]/about
/[locale]/markets
/[locale]/supply-chain
/[locale]/quality-control
/[locale]/certifications
/[locale]/contact
/[locale]/blog
/[locale]/blog/[slug]
```

**Current state:**
```
/ (home only)
/products (links exist in nav but page missing)
/products/frozen-chicken-feet (links exist but page missing)
/markets (links exist but page missing)
/markets/vietnam (links exist but pages missing)
/about (link exists but page missing)
/supply-chain (link exists but page missing)
/quality-control (link exists but page missing)
/certifications (link exists but page missing)
/contact (link exists but page missing)
/blog (link exists but page missing)
```

**Gap:** No `[locale]` route segment exists. No middleware for locale detection/redirect. No `i18n` routing configuration. All navigation links point to root-level paths rather than locale-prefixed paths.

### 3.4 Middleware

**Documentation requires:** Locale detection, redirect from `/` to `/en`, locale-aware routing.

**Current state:** No `middleware.ts` exists.

### 3.5 Content Architecture

**Documentation requires:**
```
Decap CMS → GitHub → Markdown → Next.js → UI
```

**Current state:**
```
Component files → hardcoded data → UI
```

**Missing:**
- No `content/` directory
- No Decap CMS `config.yml`
- No `admin/index.html` or `admin/config.yml`
- No Markdown content files
- No `cms/` or `content/` folder structure
- No content schema definitions
- No product content files
- No certification content files
- No market content files
- No blog content files

### 3.6 Data Models Required by Documentation

**Products:** name, slug, description, images, specifications, packaging, quality info, storage info, cold-chain info, enabled, featured, display_order

**Certifications:** name, logo, description, enabled, order

**Trust/Capability Features:** title, description, icon (Lucide name), enabled, order

**Markets:** name, slug, image, description, primary flag, enabled, order

**Blog Posts:** title, slug, content, excerpt, image, author, date, enabled, order

**Current state:** All of these are hardcoded as TypeScript arrays inside their respective component files, with no corresponding content files or CMS schema.

### 3.7 API Architecture

**Documentation requires:**
- POST `/api/rfq` — Server-side validation, sanitization, rate limiting, anti-bot, Resend integration with Reply-To
- API keys remain server-side only

**Current state:** No API routes exist.

### 3.8 Environment Variables

**Documentation requires:** `RESEND_API_KEY`, `GITHUB_OAUTH_TOKEN` (for Decap CMS), email addresses — all server-side only.

**Current state:** `.env` is gitignored. No `.env.example` exists. No environment variable usage in code.

### 3.9 Error Handling

**Documentation requires:** Deliberate states for 404, 500, loading, empty content, missing CMS content, RFQ validation error, RFQ submission failure, RFQ submission success, image failure.

**Current state:**
- No custom 404 page
- No custom 500 page
- No loading states (no async data loading exists)
- No empty states
- No RFQ states (no RFQ exists)
- No error boundaries

### 3.10 Dependency Structure

```
@base-ui/react       — Button primitive (shadcn v4)
class-variance-authority — buttonVariants
clsx + tailwind-merge — cn() utility
lucide-react         — Icons
next                 — Framework 16.3.0
react + react-dom    — 19.2.8
shadcn               — v4.16.2 (UI framework)
sonner               — Toast (imported but unused)
tailwind-merge       — Utility
tw-animate-css       — Animation utilities
```

**Missing dependencies (if implementing per spec):**
- `decap-cms-app` (or Decap CMS via CDN)
- `resend` (or `@resend/react` / Resend SDK)
- `next-intl` or custom i18n solution (documentation doesn't mandate a specific library)
- Validation library (Zod is implied by "server-side validation" requirement)

**Note:** The documentation says "Minimal dependencies" and "No database." The current dependency set aligns with this philosophy.

---

## 4. Page & Route Audit

### Complete Route Matrix

| # | Required Route | Intent | Current Status | Content Source | i18n | SEO | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `/en` (home) | Homepage | ❌ Missing locale prefix; `/` exists | Component + CMS | ✅ Required | ✅ Required | P0 |
| 2 | `/fa` | Persian homepage | ❌ Does not exist | CMS + translations | ✅ Required | ✅ Required | P0 |
| 3 | `/ru` | Russian homepage | ❌ Does not exist | CMS + translations | ✅ Required | ✅ Required | P0 |
| 4 | `/vi` | Vietnamese homepage | ❌ Does not exist | CMS + translations | ✅ Required | ✅ Required | P0 |
| 5 | `/` (root) | Should redirect to `/en` | ❌ No redirect | — | ✅ Required | — | P0 |
| 6 | `/[locale]/products` | Product listing | ❌ Does not exist | CMS products | ✅ Required | ✅ Required | P1 |
| 7 | `/[locale]/products/frozen-chicken-feet` | Chicken Feet detail | ❌ Does not exist | CMS product | ✅ Required | ✅ Required | P1 |
| 8 | `/[locale]/products/chicken-liver` | Liver detail | ❌ Does not exist | CMS product | ✅ Required | ✅ Required | P2 |
| 9 | `/[locale]/products/chicken-gizzard` | Gizzard detail | ❌ Does not exist | CMS product | ✅ Required | ✅ Required | P2 |
| 10 | `/[locale]/products/chicken-heart` | Heart detail | ❌ Does not exist | CMS product | ✅ Required | ✅ Required | P2 |
| 11 | `/[locale]/about` | About Us | ❌ Does not exist | CMS page | ✅ Required | ✅ Required | P1 |
| 12 | `/[locale]/markets` | Markets page (one page only) | ❌ Does not exist | CMS markets | ✅ Required | ✅ Required | P1 |
| 13 | `/[locale]/quality-control` | Quality Control | ❌ Does not exist | CMS page | ✅ Required | ✅ Required | P1 |
| 14 | `/[locale]/certifications` | Certifications | ❌ Does not exist | CMS certs | ✅ Required | ✅ Required | P1 |
| 15 | `/[locale]/supply-chain` | Supply Chain | ❌ Does not exist | CMS page | ✅ Required | ✅ Required | P1 |
| 16 | `/[locale]/contact` | Contact + RFQ | ❌ Does not exist | CMS + RFQ form | ✅ Required | ✅ Required | P1 |
| 17 | `/[locale]/blog` | Blog listing | ❌ Does not exist | CMS blog posts | ✅ Required | ✅ Required | P2 |
| 18 | `/[locale]/blog/[slug]` | Blog post | ❌ Does not exist | CMS blog post | ✅ Required | ✅ Required | P2 |
| 19 | `/sitemap.xml` | Sitemap | ❌ Does not exist | Generated | N/A | ✅ Required | P4 |
| 20 | `/robots.txt` | Robots | ❌ Does not exist | Generated | N/A | ✅ Required | P4 |

**Note on markets:** The documentation explicitly says "Use one Markets page. Do not create separate market pages at this stage." The current `MarketsFocus` component links to `/markets/vietnam`, `/markets/uae`, `/markets/russia`, `/markets/thailand` — this is a conflict. The markets section should link to the single `/markets` page with market cards displayed there.

---

## 5. Content & CMS Audit

### 5.1 Intended Architecture

```
Decap CMS (admin interface)
    ↓ OAuth via GitHub
    ↓ Editorial Workflow (Draft → Review → Publish)
    ↓
GitHub Repository (Markdown files in content/)
    ↓
Next.js (reads Markdown at build time / request time)
    ↓
Rendered UI with dynamic metadata, schema, hreflang
```

### 5.2 Current State

```
Component files (TypeScript)
    ↓
Hardcoded arrays of objects
    ↓
Rendered UI (English only, no dynamic metadata beyond root)
```

### 5.3 Content That Should Be CMS-Driven

| Content Type | Items | Current Source | Should Be |
|---|---|---|---|
| Products | 4 products + specs | Hardcoded in `ProductRange.tsx` and `FeaturedProduct.tsx` | CMS Markdown |
| Product specifications | Grade, weight, glaze, etc. | Hardcoded in `FeaturedProduct.tsx` | CMS Markdown |
| Certifications | 6 required (4 present) | Hardcoded in `Certifications.tsx` | CMS Markdown |
| Trust/Capability features | 8 features | Hardcoded in `BuyerPriorities.tsx` | CMS Markdown |
| Markets | 4 markets | Hardcoded in `MarketsFocus.tsx` | CMS Markdown |
| Supply chain steps | 9 steps (8 present) | Hardcoded in `SupplyChainPreview.tsx` | CMS Markdown |
| Quality processes | 9 processes (6 shown) | Hardcoded in `QualityPreview.tsx` | CMS Markdown |
| Blog posts | TBD | Not implemented | CMS Markdown |
| Page content (About, etc.) | TBD | Not implemented | CMS Markdown |
| Product images | Multiple per product | Static files in `public/media/` | CMS-managed media |
| Certification logos | 6 required | Static files in `public/media/certifications/` | CMS-managed media |

### 5.4 Content That Should Remain Application/UI Logic

- Component structure and layout
- Button variants and interactions
- Navigation structure
- Form validation logic
- RFQ email sending logic
- SEO metadata generation (driven by content but implemented in code)
- Icon registry mapping (Lucide icon names → components)
- Route structure

### 5.5 Missing CMS Configuration

- No `public/admin/index.html`
- No `public/admin/config.yml`
- No `content/` directory
- No `cms/` directory
- No `cms-config.js` or equivalent
- No Decap CMS package dependency

### 5.6 Decap CMS Configuration Requirements (from docs)

```yaml
media_folder: "public/media"
public_folder: "/media"
```

This is documented in `docs/index.html` (Section 8) and must be included in the CMS config.

### 5.7 Localization of Content

**Documentation requires:** All content available in EN, FA, RU, VI. Vietnamese receives highest localization priority.

**Current state:** Only English content exists. No translation files, no locale-specific content directories, no translation infrastructure.

---

## 6. Internationalization Audit

### 6.1 URL Structure

**Required:**
```
/en/products/frozen-chicken-feet
/fa/products/frozen-chicken-feet
/ru/products/frozen-chicken-feet
/vi/products/frozen-chicken-feet
```

Slug is always English across all locales.

**Current:** No locale prefix exists. Links are root-level: `/products/frozen-chicken-feet`.

### 6.2 Locale Detection & Redirect

**Required:** `/` → redirect to `/en` (x-default). Locale detection based on URL prefix.

**Current:** No redirect, no detection, no middleware.

### 6.3 RTL/LTR

**Required:**
- EN → LTR
- FA → RTL (set at `<html dir>` level)
- RU → LTR
- VI → LTR

**Current:** `layout.tsx` hardcodes `lang="en" dir="ltr"`. CSS has `html[dir="rtl"] body` rule but it's never activated. The direction needs to be dynamic per locale.

### 6.4 Language Switcher

**Required:** Functional switcher that changes the URL locale prefix and displays the correct language content. Should show current locale and allow switching to any other locale.

**Current:** Header has a language selector with 4 languages, but it only changes client state (`currentLang`). It does not navigate to a different URL, does not change content, does not change direction, and does not persist the selection.

### 6.5 Localized Metadata

**Required:** Each localized page needs:
- Localized title
- Localized description
- Correct hreflang
- Self-referencing canonical
- `x-default` pointing to English

**Current:** Only root `metadata` export exists in `layout.tsx`. It declares `alternates.languages` but only for the root. No per-page or per-locale metadata exists.

### 6.6 Fonts

**Required:**
- EN/RU/VI → Inter
- FA → Vazirmatn

**Current:** Both fonts are loaded via `next/font/local` in `layout.tsx`. The `globals.css` has `html[dir="rtl"] body { font-family: var(--font-fa); }`. This is correctly set up for when RTL is activated dynamically.

### 6.7 i18n Framework Decision

The documentation does not mandate a specific i18n library. The current codebase has no i18n solution at all. Options include:
- `next-intl` (popular for App Router)
- Custom middleware + locale params
- `next-i18n-router` or similar

This is an **architecture decision to lock** before implementation.

---

## 7. Design System & UI Audit

### 7.1 Color System

**Documentation specifies:**

| Role | Color | Usage |
|---|---|---|
| Primary | Midnight Navy (#0a1628) | Brand identity, primary buttons, navigation, key surfaces |
| Secondary/Interaction | Cyan 600 (#0891b2) | Secondary buttons, interactive states, hover, focus |
| Primary button hover | Cyan 600 / Cyan 700 | — |
| Secondary button hover | Cyan 700 | — |
| Supporting | Smoke White, Silver, Emerald (success only) | — |

**Current implementation:**

| Token | Value | Used For |
|---|---|---|
| `--color-navy` | #0a1628 | Backgrounds, text |
| `--color-navy-light` | #111d33 | Gradient stops |
| `--color-navy-card` | #152238 | Cards, dropdown |
| `--color-navy-glass` | rgba(10,22,40,0.65) | Glass effect |
| `--color-cyan-brand` | #0891b2 | Primary CTAs, icons, borders |
| `--color-cyan-hover` | #06b6d4 | Hover states |
| `--color-cyan-glow` | rgba(8,145,178,0.15) | Glow effects |
| `--color-cyan-light` | #22d3ee | Light cyan accents |
| `--color-emerald-cta` | #047857 | Used once in FeaturedProduct CTA |
| `--color-emerald-hover` | #059669 | Hover for above |
| `--color-gold` | #f59e0b | Not used in code |
| `--color-gold-light` | #fbbf24 | Not used in code |
| `--color-smoke` | #f8fafc | Section backgrounds |
| `--color-silver` | #94a3b8 | Secondary text |

**Conflict — Primary Button Color:**

The documentation says: "Primary button: Midnight Navy. Hover: Cyan 600 / Cyan 700. Text: White. Primary example: Request a Quote."

The code uses `bg-cyan-brand` (Cyan 600) as the primary CTA background color in:
- Header CTA: `bg-cyan-brand hover:bg-cyan-hover`
- Hero CTA: `bg-cyan-brand hover:bg-cyan-hover`
- Final CTA: `bg-cyan-brand hover:bg-cyan-hover`
- BuyerPriorities links: N/A (no CTA in that section)
- FeaturedProduct CTA: `bg-emerald-cta hover:bg-emerald-hover` (this is a third color)

**This is a significant inconsistency.** The docs say the primary CTA should be Midnight Navy with cyan hover. The code uses cyan as the primary button color throughout. This could be:
- An intentional design decision that differs from the docs (the docs say "Primary: Midnight Navy" but also say Cyan 600 is for "Secondary buttons" — the code may have elevated cyan to primary CTA status)
- An accidental divergence during implementation
- An undocumented design refinement

**Recommendation:** Confirm with stakeholders whether the primary CTA should be Navy or Cyan. The documentation is the source of truth unless flagged for confirmation.

### 7.2 Typography

**Documentation specifies:**
- Latin/Cyrillic/Vietnamese → Inter
- Persian → Vazirmatn
- Weights: 400 body, 500 labels/UI, 600 buttons/subheadings, 700 major headings
- Fluid responsive sizing with `clamp()`

**Current:**
- Inter loaded as `--font-sans` (variable, 100-900)
- Vazirmatn loaded as `--font-fa` (variable, 100-900)
- `body` uses `font-family: var(--font-sans)`
- `html[dir="rtl"] body` uses `font-family: var(--font-fa)`
- Headings use `font-bold` (700) — correct
- No `clamp()` usage — uses Tailwind responsive prefixes instead (e.g., `text-3xl sm:text-4xl lg:text-5xl`)

**Assessment:** Fonts are correctly loaded. The documentation recommends `clamp()` for fluid typography, but the current approach uses Tailwind's responsive breakpoints, which is a valid alternative. Not a conflict, just a different implementation approach.

### 7.3 Spacing

**Documentation specifies:** 8px spacing system. 1280–1440px max content width. Large section spacing.

**Current:**
- Sections use `py-20 lg:py-32` (80px/128px vertical padding) — aligns with "large section spacing"
- Content constrained via `max-w-7xl` (1280px) — aligns with max content width
- 8px grid system via Tailwind's default spacing scale — aligns

### 7.4 Cards

**Documentation specifies:** Subtle borders, soft shadows, consistent rounded corners, controlled glass effects. Interactive hover: slight elevation, subtle border transition toward Cyan, minimal Cyan accent, 150-300ms transition.

**Current:**
- Product cards: `border border-gray-200 rounded-xl hover:shadow-card-hover hover:border-cyan-brand/30 transition-all` — aligns well
- Capability cards: `border border-gray-200 rounded-xl hover:shadow-card hover:border-cyan-brand/30 transition-all` — aligns well
- Certification cards: `bg-white rounded-xl flex items-center justify-center p-8 group-hover:shadow-glow-cyan transition-shadow` — uses glow effect, which is slightly different from the "subtle border transition" spec but acceptable
- Market cards: `rounded-2xl overflow-hidden group-hover:scale-105` — uses scale transform instead of border transition; different approach but visually effective

### 7.5 Header

**Documentation specifies:** Sticky, transparent over hero, glass surface after scroll, backdrop blur, compact professional height, smooth transition.

**Current:** `fixed top-4 left-4 right-4` with `glass rounded-xl` when scrolled, `bg-transparent` when not. Uses `backdrop-filter: blur(16px)` via the `.glass` utility. Height is `h-16`. This aligns well with the spec.

**Issue:** The header is positioned `top-4` (16px from top) rather than `top-0`. This is an intentional design choice (creates breathing room) but deviates from standard sticky header positioning. Not a conflict with docs (docs don't specify exact top offset).

### 7.6 Mobile Navigation

**Documentation specifies:** Tap-based, clear hierarchy, large touch targets, accessible focus states.

**Current:** Full-screen mobile menu (`fixed inset-0 bg-navy`), logo at top, nav links with `py-3.5` touch targets, language selector, and RFQ CTA. Good touch target sizes. Uses `lg:hidden` for desktop hide. Aligns well.

### 7.7 Forms

**Documentation specifies:** Accessible, short, clear, mobile-friendly, B2B-oriented. RFQ is primary form.

**Current:** No forms exist.

### 7.8 CTAs

**Documentation specifies:** Primary CTA is "Request a Quote". Should remain easy to discover without making header visually heavy.

**Current:** CTA appears in:
- Header (desktop): small `px-4 py-1.5` button
- Header (mobile): full-width `px-6 py-4` button
- Hero: large `px-8 py-4` button with arrow icon
- FeaturedProduct: `px-6 py-3` emerald button + cyan "Request a Quote" button
- FinalCTA: `px-8 py-4` button with shadow

The CTA is consistently available. The double CTA in FeaturedProduct (emerald "View Full Specifications" + cyan "Request a Quote") is slightly redundant but not problematic.

### 7.9 Icons

**Documentation specifies:** Lucide React. Icon registry for trust features (not dynamic import). Lucide for interface and capability icons.

**Current:** Lucide React is used throughout. Trust capabilities use Lucide icons directly (Package, ShieldCheck, Snowflake, Ship, FileText, Tag, Search, Handshake). This aligns with the documentation.

### 7.10 Glassmorphism

**Documentation specifies:** Secondary technique only. Must never dominate. Used in header (glass on scroll).

**Current:** Glass effect used in:
- Header (on scroll): `.glass` utility with `backdrop-filter: blur(16px)` — appropriate
- No other glass surfaces in current components

This aligns with the documentation — glass is used sparingly and only where specified.

### 7.11 Animations

**Documentation specifies:** 150-300ms transitions, GPU-friendly transforms, small fade/slide interactions, hover transitions. Respect reduced-motion.

**Current:**
- `transition-all duration-300` on various elements — aligns
- `animate-bounce` on scroll indicator — minimal, acceptable
- `hover:scale-105` on buttons and cards — GPU-friendly transform, aligns
- `hover:scale-105` on hero CTA and FinalCTA — slightly more pronounced but acceptable
- `prefers-reduced-motion` media query in `globals.css` — aligns

**Issue:** The `animate-bounce` on the scroll indicator should ideally respect `prefers-reduced-motion`. Currently it doesn't have a reduced-motion override.

### 7.12 Accessibility

**Documentation specifies:** Semantic HTML, keyboard navigation, visible focus states, proper form labels, accessible errors, screen-reader compatibility, sufficient contrast, reduced-motion preferences, ARIA only where semantic HTML is insufficient.

**Current:**
- Focus states: `*:focus-visible { outline: 2px solid var(--color-cyan-brand); outline-offset: 2px; }` — good
- `aria-label="Toggle menu"` on mobile menu button — good
- Semantic HTML: Uses `<header>`, `<nav>`, `<main>`, `<footer>`, `<h1>`-`<h3>`, `<button>`, `<a>` — good
- Contrast: Navy text on white, white text on navy — generally good
- Reduced motion: Media query exists in `globals.css` — good

**Missing:**
- No form elements to validate labels/errors against yet
- No skip-navigation link
- No `aria-current` on active nav items
- No `role` attributes where needed (though semantic HTML mostly covers this)
- Image alt text: Present on all `next/image` components — good

### 7.13 Responsive Behavior

**Documentation specifies:** Mobile-first. Every component must work across mobile, tablet, desktop, large screens.

**Current:**
- Hero: `h-screen min-h-[700px]` — good
- ProductRange: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — good
- BuyerPriorities: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — good
- Certifications: `grid-cols-2 md:grid-cols-4` — good
- SupplyChainPreview: Desktop 8-column flow + mobile stacked list — good
- MarketsFocus: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — good
- Header: Desktop nav + mobile full-screen menu — good
- Footer: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — good

**Assessment:** Responsive behavior is well-implemented across all components.

---

## 8. SEO Audit

### 8.1 Metadata API

**Documentation requires:** Next.js Metadata API, dynamic metadata, canonical URLs, appropriate robots directives, Open Graph, locale-aware metadata.

**Current:**
- Root `metadata` export in `layout.tsx` with:
  - `metadataBase: new URL("https://feizfood.com")`
  - Default title + template
  - Description
  - Keywords
  - Open Graph (type, locale, siteName, title, description)
  - Robots (index, follow, googleBot settings)
  - `alternates`: canonical `/en`, languages EN/FA/RU/VI + x-default

**Assessment:** Root metadata is well-configured. However:
- It's only in the root layout — individual pages need their own `metadata` exports
- The `alternates` config is static (only defines the root `/en` canonical) — needs to be dynamic per locale
- No per-page titles or descriptions exist because no pages exist
- No Twitter Card metadata
- No structured data (Schema.org)

### 8.2 Page-Level Metadata

**Required per page:**
- Unique title
- Unique meta description
- Canonical URL
- Appropriate robots directives
- Open Graph metadata
- Locale-aware metadata

**Current:** Only root metadata exists. No page-level metadata because no pages exist.

### 8.3 hreflang

**Required:**
```html
<link rel="alternate" hreflang="en" href="https://feizfood.com/en/..." />
<link rel="alternate" hreflang="fa" href="https://feizfood.com/fa/..." />
<link rel="alternate" hreflang="ru" href="https://feizfood.com/ru/..." />
<link rel="alternate" hreflang="vi" href="https://feizfood.com/vi/..." />
<link rel="alternate" hreflang="x-default" href="https://feizfood.com/en/..." />
```

**Current:** Declared in root `metadata.alternates.languages` but only for the root path. No page-level hreflang. No actual localized pages to link to.

### 8.4 Canonical URLs

**Required:** Self-referencing canonical on every page.

**Current:** Root canonical is `/en`. No page-level canonicals.

### 8.5 Sitemap

**Required:** `sitemap.xml` including all pages across all locales.

**Current:** Does not exist.

### 8.6 Robots.txt

**Required:** `robots.txt` file.

**Current:** Does not exist.

### 8.7 Structured Data (Schema.org)

**Required:**
- Homepage: Organization, WebSite
- Product detail: Product, BreadcrumbList
- Blog article: Article, BreadcrumbList
- Internal pages: BreadcrumbList where applicable

**Current:** No structured data anywhere.

### 8.8 Image SEO

**Required:** WebP/AVIF, descriptive filenames, descriptive alt text, correct dimensions, responsive images, lazy loading, priority for above-fold.

**Current:**
- `next/image` used throughout — good
- Alt text present on all images — good
- Priority loading on hero image — good
- `sizes` attribute used — good
- Image filenames: Descriptive (`chicken-feet.jpg`, `cargo-ship-wide.jpg`) — mostly good
- WebP/AVIF: `next/image` handles this automatically — good

### 8.9 Internal Linking

**Required:** Logical internal links between all pages with descriptive anchor text.

**Current:** Navigation links exist in header and footer. Product cards link to product detail pages (which don't exist yet). Market cards link to market pages (which don't exist yet). Internal linking structure will be defined once pages are created.

### 8.10 URL Architecture

**Required:** Stable English slugs across locales. Clean URLs.

**Current:** No locale prefix. URLs are root-level. This will need to change to `/[locale]/...` structure.

---

## 9. Security Audit (Non-Invasive Architectural Review)

### 9.1 Security Headers

**Required (from docs):**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
```

**Current:** No security headers configured. `next.config.ts` is empty.

**Severity: High**

### 9.2 CSP

**Required:** No `unsafe-inline` or `unsafe-eval` in production.

**Current:** No CSP configured. The `globals.css` imports `shadcn/tailwind.css` and `tw-animate-css` — these may require `unsafe-inline` for style injection depending on how shadcn v4 handles CSS. This needs verification.

**Severity: High**

### 9.3 HSTS

**Required:** max-age minimum 1 year + includeSubDomains.

**Current:** Not configured.

**Severity: High**

### 9.4 Environment Variables

**Required:** All secrets in `process.env` server-side only. `.env` in `.gitignore`.

**Current:** `.gitignore` correctly excludes `.env*`. No environment variables used in code yet. No `.env.example` file.

**Severity: Low (currently)** — No secrets are exposed because none are used. But no `.env.example` means developers don't know what variables are needed.

### 9.5 API Security

**Required:** Rate limiting (5 req/hour per IP for RFQ), CSRF protection, input sanitization, server-side validation, safe error responses.

**Current:** No API routes exist. No rate limiting, no CSRF protection, no validation.

**Severity: Medium** — No attack surface exists yet because no API exists. But the RFQ API will be a primary attack target and must be built securely from the start.

### 9.6 Form Security

**Required:** Honeypot fields, anti-bot protection, server-side validation.

**Current:** No forms exist.

### 9.7 Image Handling

**Required:** `next/image` for all website images. No ordinary `<img>`.

**Current:** All images use `next/image`. No ordinary `<img>` tags in components.

**Severity: Low** — Image handling is correct.

### 9.8 External Resources

**Current:** 
- Google Fonts NOT used (fonts are self-hosted via `next/font/local`) — good
- No external CDN resources — good
- `next/image` will need `remotePatterns` if any external images are used (none currently)

**Severity: Low**

### 9.9 Dependency Risks

**Current dependencies:**
- `@base-ui/react` — Newer dependency, part of shadcn v4. Should be audited.
- `shadcn` v4.16.2 — Relatively new package. Should be monitored.
- `sonner` — Toast library, imported but unused. Could be removed until needed.
- `tw-animate-css` — Animation utility. Follows shadcn v4 conventions.

**Severity: Low**

### 9.10 Summary Security Findings

| Finding | Severity |
|---|---|
| No security headers configured | High |
| No CSP | High |
| No HSTS | High |
| No X-Frame-Options | High |
| No rate limiting (RFQ API not yet built) | Medium |
| No CSRF protection (RFQ API not yet built) | Medium |
| `.env` correctly gitignored | Low |
| No `.env.example` for developer guidance | Low |
| All images use `next/image` | Low |
| Fonts self-hosted (no external Google Fonts) | Low |
| `sonner` imported but unused (dead dependency) | Low |
| No dependency audit performed | Informational |

---

## 10. Performance Audit

### 10.1 Server Components

**Current:** All page content is rendered as Server Components. Only `Header` uses `"use client"` (justified for scroll detection and mobile menu state).

**Assessment:** Good. Aligns with documentation's "Server Components by default" principle.

### 10.2 JavaScript Payload

**Current concerns:**
- `Header.tsx` is a Client Component — includes `lucide-react` icons, `next/link`, `next/image`, `useEffect`, `useState`. This is necessary but adds client-side JS.
- `sonner` Toaster is rendered in layout but no toasts are triggered — dead code path.
- All section components are Server Components — no unnecessary client JS from content sections.

**Assessment:** Acceptable for the current scope. The Header client bundle will grow when navigation expands.

### 10.3 Image Optimization

**Current:** All images use `next/image` with `fill`, `sizes`, and appropriate `className` for object-fit. Hero image uses `priority`.

**Assessment:** Good. `next/image` handles WebP/AVIF conversion, resizing, and lazy loading automatically.

### 10.4 Font Loading

**Current:** Both Inter and Vazirmatn loaded via `next/font/local` with `display: "swap"`. Variable fonts (100-900 weight range) reduce HTTP requests.

**Assessment:** Good. Variable fonts are optimal. `display: "swap"` prevents FOIT.

### 10.5 Caching

**Current:** No explicit caching configuration. Next.js App Router has default caching behavior.

**Assessment:** Will need explicit caching strategy for CMS content (revalidation via `next.revalidate` or webhook) once CMS is implemented.

### 10.6 Static Generation

**Current:** With no dynamic data, the homepage is effectively statically generated at build time.

**Assessment:** Good baseline. Once CMS content is added, will need `revalidate` or ISR strategy.

### 10.7 Unnecessary Client-Side State

**Current:** `Header.tsx` has:
- `isScrolled` — necessary for glass effect
- `isMobileMenuOpen` — necessary for mobile menu
- `isLangOpen` — necessary for language dropdown
- `currentLang` — **unnecessary** — this state doesn't affect anything functional

The `currentLang` state changes the displayed flag and label in the header but doesn't navigate or change content. This is dead state that should be removed or replaced with actual locale routing.

### 10.8 Third-Party Dependencies

- `@base-ui/react` — Button primitive only. Minimal impact.
- `shadcn` — UI framework. Minimal runtime impact.
- `lucide-react` — Icons. Tree-shakeable.
- `sonner` — Unused. Should be removed.
- `tw-animate-css` — Minimal CSS output.

**Assessment:** Dependency footprint is reasonable.

### 10.9 Animation Cost

- `animate-bounce` on scroll indicator — minimal cost, single element
- `transition-all duration-300` — standard CSS transitions, minimal cost
- `hover:scale-105` — GPU-accelerated transform, minimal cost
- No JavaScript-driven animations — good

### 10.10 Mobile Performance

- Hero image is large (`cargo-ship-wide.jpg`) but uses `priority` and `next/image` optimization
- No unnecessary client-side JS on mobile (Header is the only client component)
- Responsive images via `sizes` attribute

**Assessment:** Should perform well on mobile once real images are in place (current images appear to be generated placeholders from `generate-placeholders.js`).

---

## 11. UX / Mobile Audit

### 11.1 First Impression (Homepage)

**Assessment:** Strong visual first impression. Hero with cargo ship image, bold headline, clear dual CTA. Immediately communicates "international frozen poultry exporter." Navy + cyan color scheme feels premium and industrial. Trust signals (certifications, capabilities) are visible without scrolling too far.

**Concern:** The hero uses `cargo-ship-wide.jpg` which is listed in `generate-placeholders.js` as a placeholder. If this is a placeholder image, the first impression would be of a placeholder, not real imagery. Need to confirm whether real images are in place.

### 11.2 Navigation

**Assessment:** Clean desktop nav with 7 items. Sticky header with glass effect on scroll is polished. Mobile menu is full-screen with clear touch targets. Language switcher UI is present but non-functional.

**Issue:** The language switcher creates an expectation of multilingual functionality that doesn't exist. A user clicking "فارسی" expects to see Persian content — they won't.

### 11.3 Information Hierarchy

**Assessment:** Follows the documented buyer journey:
1. Hero (what we do + CTA)
2. ProductRange (what we sell)
3. FeaturedProduct (deep dive on primary product)
4. BuyerPriorities (why trust us)
5. Certifications (proof of credibility)
6. QualityPreview (quality processes)
7. SupplyChainPreview (operational capability)
8. MarketsFocus (where we export)
9. FinalCTA (final conversion push)

This is a well-structured B2B information hierarchy.

### 11.4 Product Discovery

**Assessment:** Products are shown in a 4-column grid with images, descriptions, specs, and "View Details" links. The FeaturedProduct section gives Chicken Feet extra prominence with detailed specs. Good product discovery flow for the homepage.

**Missing:** No way to actually view product details — the links go to non-existent pages.

### 11.5 Trust Signals

**Assessment:** Two separate trust systems are presented:
1. Certifications section (dark background, logo cards) — distinct from capabilities
2. BuyerPriorities section (white background, icon cards) — capability features

This separation aligns with the documentation's "dual trust architecture" requirement.

**Issue:** Only 4 of 6 certifications shown. Missing Veterinary Certificate and Certificate of Origin.

### 11.6 Market Discovery

**Assessment:** 4 market cards with city images and "Primary Market" badge for Vietnam. Good visual presentation.

**Issue:** Links to individual market pages that don't exist. Documentation says one Markets page, not individual pages.

### 11.7 RFQ Conversion

**Assessment:** CTAs appear in header, hero, featured product section, and final CTA section. The path to RFQ is clear: "Request a Quote" → `/contact`.

**Missing:** `/contact` page doesn't exist. No RFQ form exists. No transactional email infrastructure exists.

### 11.8 Mobile Experience

**Assessment:** Mobile menu is full-screen with large touch targets. All sections stack vertically. Hero is full-height. CTAs are full-width on mobile. Good mobile UX.

**Issue:** The language switcher on mobile uses a `<select>` element which is functional but the selected value doesn't actually change the language.

### 11.9 Feedback States

**Missing:**
- No loading states (no async operations)
- No error states
- No success states
- No empty states
- No form validation feedback (no forms)
- Sonner Toaster is configured but never used

### 11.10 Accessibility

See Section 7.12 for detailed accessibility audit.

---

## 12. Dependency & Implementation Order

### Derived Implementation Dependency Chain

```
Phase 0: Foundation
├── Next.js 16 App Router project structure ✅ (exists)
├── TypeScript strict mode ✅ (exists)
├── Tailwind CSS v4 ✅ (exists)
├── shadcn/ui v4 ✅ (exists)
├── Design tokens (colors, typography, spacing) ✅ (partially exists)
├── Feature-based file structure ⚠️ (partially exists — needs expansion)
├── ESLint + linting ✅ (exists)
└── .gitignore ✅ (exists)

Phase 1: i18n Architecture (BLOCKING — nothing else can be built correctly without this)
├── Locale route structure ([locale] segment)
├── Middleware for locale detection + / → /en redirect
├── Dynamic html lang + dir attributes
├── Locale-specific metadata architecture
├── Language switcher (functional)
├── RTL support activation (FA)
└── x-default configuration

Phase 2: Content/CMS Architecture (BLOCKING — pages need content source)
├── Decap CMS installation + configuration
├── Admin route (admin/index.html + config.yml)
├── Content directory structure
├── Content schemas (products, certifications, features, markets, blog)
├── Markdown content files (EN first, then FA/RU/VI)
├── Content loading utilities
├── Icon registry (Lucide name → component mapping)
└── Image/media handling in CMS

Phase 3: Data Models + Content (BLOCKING — pages need real data)
├── Product content (4 products, EN first)
├── Certification content (6 certifications, EN first)
├── Trust/capability content (8 features, EN first)
├── Market content (4 markets, EN first)
├── Supply chain content (9 steps, EN first)
├── Quality process content (9 processes, EN first)
├── About Us page content
├── Contact page content
└── Blog content structure

Phase 4: Page Routes + Components (BLOCKING for conversion)
├── Layout shell with locale-aware header/footer
├── Home page (locale-prefixed)
├── Products list page
├── Product detail page (template for all 4 products)
├── About Us page
├── Markets page (one page, not individual)
├── Supply Chain page
├── Quality Control page
├── Certifications page
├── Contact page (with RFQ form placeholder)
├── Blog list page
├── Blog post page (template)
├── Custom 404 page
└── Custom 500 page

Phase 5: RFQ Conversion System
├── RFQ form component (client-side validation)
├── RFQ server API route (POST /api/rfq)
├── Server-side validation (Zod schema)
├── Input sanitization
├── Rate limiting
├── Anti-bot protection (honeypot + Turnstile)
├── Resend integration
├── Reply-To configuration
├── Email template
├── Success state
├── Error state
├── Loading state
└── Environment variables (.env.example)

Phase 6: SEO Infrastructure
├── Per-page metadata exports
├── Dynamic metadata based on content
├── Per-locale hreflang
├── Self-referencing canonicals
├── sitemap.xml generation
├── robots.txt
├── Organization schema (homepage)
├── Product schema (product pages)
├── BreadcrumbList schema (applicable pages)
├── Article schema (blog posts)
├── Open Graph per page
├── Twitter Card metadata
└── SEO audit script (/seoaudit)

Phase 7: Security Hardening
├── Security headers in next.config.ts
├── CSP configuration
├── HSTS configuration
├── X-Frame-Options
├── Referrer-Policy
├── Permissions-Policy
├── Rate limiting middleware/enforcement
├── CSRF protection for RFQ
├── Error handling (no stack traces to client)
├── Dependency audit
├── .env.example
└── Security audit

Phase 8: Translations (parallelizable per locale)
├── Persian (FA) — RTL — full translation
├── Russian (RU) — LTR
├── Vietnamese (VI) — LTR — highest priority

Phase 9: Polish + QA
├── Visual refinement
├── Responsive QA across breakpoints
├── RTL QA (Persian)
├── Accessibility audit (WCAG)
├── Core Web Vitals optimization
├── Animation polish
├── Reduced-motion verification
├── Mobile touch target verification
├── /uiaudit
├── /uxaudit
├── /optimize
├── /killcritic
└── Security audit

Phase 10: Deployment Preparation
├── VPS setup
├── Reverse proxy (Nginx/Caddy)
├── HTTPS configuration
├── CI/CD pipeline
├── Decap CMS deployment compatibility
├── Backup strategy
├── Rollback strategy
├── Monitoring setup
└── Production deployment
```

### Why This Order

1. **i18n must come before pages** because every page route depends on the locale structure. Building pages without i18n means rebuilding them with locale prefixes later.

2. **CMS/content must come before pages** because pages consume content. Building pages with hardcoded data means refactoring them to use CMS content later.

3. **Pages must come before RFQ** because the RFQ form lives on the Contact page, and the RFQ flow is part of the buyer journey that passes through product pages first.

4. **SEO comes after content and pages** because SEO metadata depends on having actual content and pages to describe.

5. **Security hardening comes late** because security headers and protections are applied to a running system — they're most effective when there's something to protect.

6. **Translations can happen in parallel** with later-stage work once the English content and pages are stable, because translations are content work, not architecture work.

---

## 13. Architecture Decisions to Lock

The following decisions are **already defined by the documentation** and should be treated as locked:

| Decision | Documentation Position | Status |
|---|---|---|
| Framework | Next.js 16 + App Router + TypeScript | ✅ Locked |
| Styling | Tailwind CSS + shadcn/ui (no separate Radix) | ✅ Locked |
| CMS | Decap CMS → GitHub → Markdown | ✅ Locked |
| Database | None (Git-based content) | ✅ Locked |
| Languages | EN (default), FA (RTL), RU, VI | ✅ Locked |
| URL structure | `/[locale]/...` with English slugs | ✅ Locked |
| Hosting | VPS with reverse proxy | ✅ Locked |
| Email | Resend with Reply-To | ✅ Locked |
| Icon library | Lucide React | ✅ Locked |
| Primary product | Frozen Chicken Feet | ✅ Locked |
| Secondary products | Liver, Gizzard, Heart | ✅ Locked |
| Target markets | Vietnam (primary), UAE, Russia, Thailand | ✅ Locked |
| Certifications | HACCP, ISO 22000, Halal, Health Cert, Veterinary Cert, Certificate of Origin | ✅ Locked |
| Trust features | 8 features with Lucide icons | ✅ Locked |
| RFQ fields | Name, Company, Email, Country, Product, Quantity, Message (required) + Destination Port, Packaging (optional) | ✅ Locked |

The following decisions **need confirmation** before implementation:

| Decision | Issue | Options |
|---|---|---|
| **Primary CTA color** | Docs say Navy; code uses Cyan | Confirm: Navy (per docs) or Cyan (current code) |
| **i18n library** | Not specified by docs | `next-intl` vs custom middleware vs other |
| **Market pages** | Docs say one Markets page; code links to individual market pages | Confirm: single page or individual pages |
| **shadcn/tailwind.css import** | Path assumed in globals.css | Verify this path exists in shadcn v4.16.2 |
| **Sonner usage** | Imported but unused | Keep for RFQ feedback? Use for other interactions? Remove? |
| **Image placeholder strategy** | `generate-placeholders.js` creates placeholder images | Are these placeholders or final? Need real images. |
| **Content file format** | Markdown is specified but format not detailed | YAML frontmatter + Markdown body? JSON? Raw Markdown? |
| **Blog implementation** | Blog is listed as required but no detail in docs | List + detail pages? Categories? Tags? |

---

## 14. Documentation vs Code Conflicts Table

| Area | Documentation Says | Code Does | Conflict? | Recommended Direction |
|---|---|---|---|---|
| Primary CTA color | Midnight Navy with cyan hover | Cyan 600 background (`bg-cyan-brand`) | **Yes** | Confirm with stakeholders. Docs are source of truth unless flagged. |
| Primary button hover | Cyan 600 / Cyan 700 | `hover:bg-cyan-hover` (#06b6d4 = Cyan 500) | Minor | Use Cyan 600/700 per docs |
| FeaturedProduct CTA color | Not specified for this specific button | Emerald (`bg-emerald-cta`) | Undocumented | Docs say emerald only for success states. Confirm if this is intentional. |
| Market pages | One Markets page only | Links to `/markets/vietnam`, `/markets/uae`, etc. | **Yes** | Use single `/markets` page per docs |
| Certifications count | 6 required | 4 shown (missing Veterinary Cert, Certificate of Origin) | **Yes** | Add missing 2 certifications |
| Supply chain steps | 9 steps (Farm → Destination Delivery) | 8 steps (missing Destination Delivery) | **Yes** | Add Destination Delivery step |
| Locale routing | `/[locale]/...` structure | Root-level routes, no locale prefix | **Yes** | Implement `/[locale]/` routing |
| Language switcher | Functional locale switching | Client-state toggle only, no navigation | **Yes** | Implement functional locale switching |
| RTL support | Dynamic per locale (FA = RTL) | Hardcoded `dir="ltr"` in layout | **Yes** | Make direction dynamic based on locale |
| CMS | Decap CMS → GitHub → Markdown | No CMS, hardcoded content | **Yes** | Implement Decap CMS + Markdown content |
| RFQ | Full RFQ flow with Resend | No RFQ infrastructure | **Yes** | Implement RFQ form + API + Resend |
| SEO pages | Metadata per page, sitemap, robots, schema | Root metadata only, no sitemap/robots/schema | **Yes** | Implement per-page SEO + sitemap + robots + schema |
| Security headers | Full security header set | No headers configured | **Yes** | Configure headers in next.config.ts |
| Error pages | 404, 500, loading, empty, etc. | No custom error pages | **Yes** | Implement error pages |
| Blog | Blog list + detail pages | Not implemented | **Yes** | Implement blog |
| About Us | Required page | Not implemented | **Yes** | Implement |
| Quality Control | Required page | Not implemented | **Yes** | Implement |
| Supply Chain | Required page | Not implemented | **Yes** | Implement |
| Certifications page | Required page | Not implemented | **Yes** | Implement |
| Contact | Required page with RFQ | Not implemented | **Yes** | Implement |
| Product detail pages | 4 independent pages | Not implemented | **Yes** | Implement |
| Products list | Required page | Not implemented | **Yes** | Implement |
| `sonner` Toaster | Implied for feedback | Imported but never triggered | Undocumented | Use for RFQ feedback states |
| `generate-placeholders.js` | Not mentioned in docs | Creates placeholder images | Undocumented | Confirm if placeholders or real images |
| Scroll indicator animation | Should respect reduced-motion | `animate-bounce` without reduced-motion override | Minor | Add reduced-motion check |
| `currentLang` state | N/A | Client state that does nothing functional | Code issue | Remove or replace with functional locale routing |

---

## 15. Master Gap Matrix

| Area | Requirement | Current State | Gap | Severity | Dependency | Priority |
|---|---|---|---|---|---|---|
| **Framework** | Next.js 16 + App Router + TS | 16.3.0, App Router, TS 5, strict | ✅ Match | — | — | — |
| **Styling** | Tailwind + shadcn/ui (no Radix) | Tailwind v4 + shadcn v4 + base-ui/react | ✅ Match | — | — | — |
| **i18n routing** | `/[locale]/...` with middleware | No locale routing, no middleware | Full gap | Critical | Phase 1 | P0 |
| **Locale redirect** | `/` → `/en` | No redirect | Full gap | Critical | i18n routing | P0 |
| **RTL support** | Dynamic dir per locale | Hardcoded `dir="ltr"`, CSS rule exists but unused | Full gap | Critical | i18n routing | P0 |
| **Language switcher** | Functional, navigates to locale URL | Client-state toggle, no navigation | Full gap | High | i18n routing | P0 |
| **CMS** | Decap CMS → GitHub → Markdown | No CMS, no config, no content dir | Full gap | Critical | Phase 2 | P1 |
| **Content schemas** | Products, certs, features, markets, blog | Hardcoded in components | Full gap | Critical | CMS | P1 |
| **Content files** | Markdown files per locale | No content files exist | Full gap | Critical | CMS | P1 |
| **Admin route** | `/admin` with Decap CMS | Not implemented | Full gap | High | CMS | P1 |
| **Home page (locale)** | `/[locale]` homepage | `/` exists, no locale prefix | Full gap | Critical | i18n routing | P0 |
| **Products list** | `/[locale]/products` | Not implemented | Full gap | High | i18n + CMS + content | P1 |
| **Product detail** | `/[locale]/products/[slug]` ×4 | Not implemented | Full gap | High | i18n + CMS + content | P1 |
| **About Us** | `/[locale]/about` | Not implemented | Full gap | Medium | i18n + CMS + content | P1 |
| **Markets** | `/[locale]/markets` (one page) | Not implemented; links go to individual pages | Full gap + incorrect links | High | i18n + CMS + content | P1 |
| **Supply Chain** | `/[locale]/supply-chain` | Not implemented | Full gap | Medium | i18n + CMS + content | P1 |
| **Quality Control** | `/[locale]/quality-control` | Not implemented | Full gap | Medium | i18n + CMS + content | P1 |
| **Certifications** | `/[locale]/certifications` | Not implemented | Full gap | Medium | i18n + CMS + content | P1 |
| **Contact** | `/[locale]/contact` with RFQ | Not implemented | Full gap | High | i18n + CMS + content | P1 |
| **Blog** | `/[locale]/blog` + `/[locale]/blog/[slug]` | Not implemented | Full gap | Medium | i18n + CMS + content | P2 |
| **RFQ form** | Accessible B2B form with validation | Not implemented | Full gap | Critical | Contact page | P1 |
| **RFQ API** | POST /api/rfq with validation, rate limit, anti-bot | Not implemented | Full gap | Critical | RFQ form | P1 |
| **Resend** | Transactional email with Reply-To | Not implemented | Full gap | High | RFQ API | P1 |
| **Email template** | Professional RFQ email | Not implemented | Full gap | Medium | Resend | P1 |
| **Root metadata** | Title, description, OG, robots, hreflang | Implemented (root only) | ✅ Partial | — | — | — |
| **Per-page metadata** | Unique title/desc per page per locale | Not implemented | Full gap | High | Pages + content | P4 |
| **Sitemap** | `/sitemap.xml` with all pages | Not implemented | Full gap | High | Pages + routes | P4 |
| **Robots.txt** | `/robots.txt` | Not implemented | Full gap | Medium | — | P4 |
| **Schema.org** | Organization, Product, Article, BreadcrumbList | Not implemented | Full gap | Medium | Pages + content | P4 |
| **Open Graph per page** | Unique OG tags per page | Root OG only | Full gap | Low | Pages + content | P4 |
| **Twitter Card** | Twitter metadata | Not implemented | Full gap | Low | Pages | P4 |
| **Security headers** | Full header set (HSTS, CSP, X-Frame, etc.) | Not configured | Full gap | High | next.config.ts | P4 |
| **CSP** | No unsafe-inline/eval in production | Not configured | Full gap | High | Security headers | P4 |
| **HSTS** | max-age 1 year + includeSubDomains | Not configured | Full gap | High | Security headers | P4 |
| **Rate limiting** | 5 req/hour per IP for RFQ | Not implemented | Full gap | High | RFQ API | P1 |
| **Anti-bot** | Honeypot + Turnstile for RFQ | Not implemented | Full gap | Medium | RFQ form | P1 |
| **CSRF protection** | For RFQ form | Not implemented | Full gap | Medium | RFQ API | P1 |
| **Error pages** | 404, 500, loading, empty | Not implemented | Full gap | Medium | — | P2 |
| **Error boundaries** | Graceful error handling | Not implemented | Full gap | Low | — | P4 |
| **Input validation** | Server-side for RFQ | Not implemented | Full gap | High | RFQ API | P1 |
| **Input sanitization** | For RFQ and all user input | Not implemented | Full gap | High | RFQ API | P1 |
| **Environment variables** | `.env.example`, server-side only | `.gitignore` correct, no `.env.example` | Partial gap | Low | RFQ API | P1 |
| **Image optimization** | `next/image` for all images | Used throughout | ✅ Match | — | — | — |
| **Font optimization** | Self-hosted, optimized | Inter + Vazirmatn via `next/font/local` | ✅ Match | — | — | — |
| **Caching strategy** | ISR/revalidation for CMS content | Not configured | Full gap | Medium | CMS | P4 |
| **Static generation** | Where appropriate | Homepage is effectively static | ✅ Partial | — | — | — |
| **Client JS minimization** | Minimal client components | Only Header is client | ✅ Good | — | — | — |
| **Responsive design** | Mobile-first, all breakpoints | Well implemented | ✅ Good | — | — | — |
| **Mobile navigation** | Full-screen, large touch targets | Implemented | ✅ Good | — | — | — |
| **Accessibility** | WCAG AA, keyboard nav, focus states | Good foundation, some gaps | ⚠️ Partial | — | — | P5 |
| **Reduced motion** | Respected | Media query exists, scroll indicator missing override | Minor gap | Low | — | P5 |
| **Skip navigation** | Skip link for keyboard users | Not implemented | Full gap | Low | — | P5 |
| **Translations (FA)** | Full Persian content, RTL | Not implemented | Full gap | High | Content + i18n | P3 |
| **Translations (RU)** | Full Russian content | Not implemented | Full gap | Medium | Content + i18n | P3 |
| **Translations (VI)** | Full Vietnamese content, highest priority | Not implemented | Full gap | High | Content + i18n | P3 |
| **Sonner Toast** | UI feedback for RFQ and interactions | Imported, configured, never used | Dead code | Low | RFQ | P1 |
| **Certifications completeness** | 6 required | 4 shown | Missing 2 | Medium | CMS + content | P1 |
| **Supply chain completeness** | 9 steps | 8 shown | Missing 1 | Low | CMS + content | P1 |
| **Market page structure** | One page | Links to individual pages | Conflict | Medium | Pages | P1 |
| **Primary CTA color** | Navy per docs | Cyan in code | Conflict | Medium | Design system | P2 |
| **Placeholder images** | Real industrial imagery | Placeholder generator exists | Unknown | Medium | Content + media | P2 |
| **VPS deployment** | Reverse proxy + Node + HTTPS | Not started | Full gap | High | Phase 10 | P4 |
| **CI/CD** | GitHub → Build → VPS | Not started | Full gap | Medium | Deployment | P4 |
| **Backup strategy** | Automated + offsite | Not started | Full gap | Medium | Deployment | P4 |
| **QA scripts** | `/seoaudit`, `/uiaudit`, `/uxaudit`, `/optimize`, `/killcritic` | Not implemented | Full gap | Low | All phases | P5 |

---

## 16. Risk Analysis

### Biggest Architectural Risk

**No i18n routing foundation.** Every page, every link, every piece of metadata, every SEO element depends on the locale routing structure. Building pages without this foundation means they must be rebuilt when i18n is added. This is the single most important architectural decision to make before building any pages.

### Biggest Business Risk

**No RFQ infrastructure.** The primary business objective — generating qualified quotes from international buyers — has zero implementation. Every visitor who wants to request a quote hits a 404 page. This is a complete business failure point.

### Biggest UX Risk

**Non-functional language switcher.** The header presents a language selector with 4 languages as a core navigation element. When a user selects "فارسی", nothing happens. This creates a broken expectation and undermines trust in the site's international capability — which is central to the business.

### Biggest SEO Risk

**No multilingual SEO infrastructure.** The documentation specifies hreflang, x-default, localized metadata, sitemap across locales, and localized schema. Without any of this, the site cannot rank in any language market. For a business whose primary market (Vietnam) requires Vietnamese SEO, this is a critical gap.

### Biggest Security Risk

**No security headers and no API security foundation.** When the RFQ API is built, it will be a public-facing endpoints accepting user input and sending email. Without rate limiting, input validation, CSP, and security headers in place from the start, this will be a high-value attack target. Security must be built in, not bolted on.

---

## 17. Priority Roadmap

### P0 — Foundation / Blocking

| # | What | Why | Dependency | Expected Outcome |
|---|---|---|---|---|
| P0.1 | i18n routing architecture | Every page and route depends on locale structure | None | `/[locale]/...` routes work, `/` redirects to `/en` |
| P0.2 | Middleware for locale detection + redirect | Required for i18n routing | P0.1 | Automatic locale detection and redirect |
| P0.3 | Dynamic html lang + dir attributes | Required for RTL (FA) and proper HTML semantics | P0.1 | Correct lang and dir per locale |
| P0.4 | Design token lock (colors, typography, spacing) | All components depend on consistent tokens | None | Finalized CSS variables, no more drift |
| P0.5 | Primary CTA color decision | Affects every button in the system | None | Documented decision: Navy or Cyan |

### P1 — Core Architecture

| # | What | Why | Dependency | Expected Outcome |
|---|---|---|---|---|
| P1.1 | Decap CMS installation + configuration | Content must be CMS-driven per docs | P0 | Admin interface at `/admin`, CMS can create Markdown files |
| P1.2 | Content directory structure + schemas | All content types need defined schemas | P1.1 | `content/` directory with schema-defined content types |
| P1.3 | Icon registry (Lucide name → component) | Trust features need dynamic icon rendering from CMS data | P1.2 | Safe icon rendering from string names |
| P1.4 | Content loading utilities | Pages need to read Markdown content | P1.2 | Utility functions to load and parse content by locale + slug |
| P1.5 | Product content (EN) — all 4 products | Product pages need content | P1.2, P1.4 | 4 product Markdown files with complete data |
| P1.6 | Certification content (EN) — all 6 | Certification page needs content | P1.2, P1.4 | 6 certification records |
| P1.7 | Trust/capability content (EN) — all 8 | BuyerPriorities needs CMS data | P1.2, P1.4 | 8 feature records |
| P1.8 | Market content (EN) — all 4 | Markets page needs content | P1.2, P1.4 | 4 market records |
| P1.9 | Supply chain content (EN) — 9 steps | Supply chain page needs content | P1.2, P1.4 | 9 step records |
| P1.10 | Quality process content (EN) — 9 processes | Quality page needs content | P1.2, P1.4 | 9 process records |
| P1.11 | About Us page content (EN) | About page needs content | P1.2, P1.4 | About page Markdown |
| P1.12 | Contact page content (EN) | Contact page needs content | P1.2, P1.4 | Contact page Markdown |

### P2 — Core Product Experience

| # | What | Why | Dependency | Expected Outcome |
|---|---|---|---|---|
| P2.1 | Layout shell with locale-aware header/footer | All pages need consistent shell | P0.1, P0.3 | Header with working language switcher, footer with locale-aware links |
| P2.2 | Home page (`/[locale]`) | Primary landing page | P1.5-P1.12, P2.1 | Full homepage in English with CMS-driven content |
| P2.3 | Products list page (`/[locale]/products`) | Product discovery | P1.5, P2.1 | 4-product grid with CMS data |
| P2.4 | Product detail page template (`/[locale]/products/[slug]`) | Product deep-dive | P1.5, P2.1 | Reusable template for all 4 products |
| P2.5 | About Us page (`/[locale]/about`) | Company information | P1.11, P2.1 | About page |
| P2.6 | Markets page (`/[locale]/markets`) — one page | Market presence | P1.8, P2.1 | Single markets page (not individual pages) |
| P2.7 | Supply Chain page (`/[locale]/supply-chain`) | Operational credibility | P1.9, P2.1 | Supply chain page with 9 steps |
| P2.8 | Quality Control page (`/[locale]/quality-control`) | Quality credibility | P1.10, P2.1 | Quality page with 9 processes |
| P2.9 | Certifications page (`/[locale]/certifications`) | Compliance credibility | P1.6, P2.1 | Certifications page with all 6 certs |
| P2.10 | Contact page (`/[locale]/contact`) with RFQ form UI | Conversion entry point | P1.12, P2.1 | Contact page with RFQ form (UI only, no backend yet) |
| P2.11 | Blog list page (`/[locale]/blog`) | Content marketing | P1.2, P2.1 | Blog listing (empty state until posts added) |
| P2.12 | Blog post page template (`/[locale]/blog/[slug]`) | Article rendering | P1.2, P2.1 | Reusable blog post template |
| P2.13 | Custom 404 page | Error state | P2.1 | Polished 404 page |
| P2.14 | Custom 500 page | Error state | P2.1 | Polished 500 page |

### P3 — Conversion

| # | What | Why | Dependency | Expected Outcome |
|---|---|---|---|---|
| P3.1 | RFQ form component with client-side validation | Buyer can submit quote requests | P2.10 | Functional RFQ form UI |
| P3.2 | RFQ server API (`POST /api/rfq`) | Form submissions need backend | P3.1 | API endpoint receives and processes RFQs |
| P3.3 | Server-side validation (Zod schema) | Prevent invalid/submitted data | P3.2 | Validated RFQ data on server |
| P3.4 | Input sanitization | Prevent XSS and injection | P3.2 | Cleaned input data |
| P3.5 | Rate limiting (5 req/hour per IP) | Prevent abuse | P3.2 | Rate-limited endpoint |
| P3.6 | Anti-bot protection (honeypot + Turnstile) | Prevent spam | P3.1 | Bot-resistant form |
| P3.7 | Resend integration | Send emails to company inbox | P3.2 | Emails sent on RFQ submission |
| P3.8 | Reply-To configuration | Sales team replies to buyer | P3.7 | Buyer email in Reply-To header |
| P3.9 | Email template | Professional RFQ email | P3.7 | Formatted email with RFQ details |
| P3.10 | RFQ success state | Buyer confirmation | P3.1, P3.7 | Success UI after submission |
| P3.11 | RFQ error state | Error handling | P3.1, P3.2 | Error UI on failure |
| P3.12 | RFQ loading state | UX during submission | P3.1 | Loading UI during API call |
| P3.13 | `.env.example` with all required variables | Developer onboarding | P3.7 | Documented environment variables |
| P3.14 | Sonner Toast integration for RFQ feedback | User feedback | P3.10, P3.11 | Toast notifications on RFQ submit |

### P4 — SEO / Performance / Security

| # | What | Why | Dependency | Expected Outcome |
|---|---|---|---|---|
| P4.1 | Per-page metadata exports | Unique SEO per page | P2.2-P2.12 | Each page has unique title, description, OG |
| P4.2 | Dynamic metadata from content | Metadata reflects CMS content | P4.1, P1.4 | Metadata generated from content data |
| P4.3 | Per-locale hreflang | International SEO | P0.1, P4.1 | hreflang tags on every page |
| P4.4 | Self-referencing canonicals | SEO best practice | P4.1 | Canonical URL on every page |
| P4.5 | `sitemap.xml` generation | Search engine discovery | P2.2-P2.12 | Complete sitemap with all locale-page combinations |
| P4.6 | `robots.txt` | Crawler control | None | robots.txt file |
| P4.7 | Organization schema (homepage) | Structured data | P2.2 | JSON-LD Organization + WebSite schema |
| P4.8 | Product schema (product pages) | Product rich results | P2.4 | JSON-LD Product + BreadcrumbList schema |
| P4.9 | Article schema (blog posts) | Article rich results | P2.12 | JSON-LD Article + BreadcrumbList schema |
| P4.10 | BreadcrumbList schema (internal pages) | Navigation context | P2.3-P2.12 | BreadcrumbList where applicable |
| P4.11 | Open Graph per page | Social sharing | P4.1 | Unique OG tags per page |
| P4.12 | Twitter Card metadata | Twitter sharing | P4.1 | Twitter Card tags per page |
| P4.13 | Security headers in next.config.ts | Production security | None | All required security headers |
| P4.14 | CSP configuration | XSS protection | P4.13 | Content Security Policy without unsafe-inline/eval |
| P4.15 | HSTS configuration | HTTPS enforcement | P4.13 | Strict-Transport-Security header |
| P4.16 | Dependency audit | Vulnerability check | None | Audited dependencies, updated where needed |
| P4.17 | Caching strategy for CMS content | Performance + freshness | P1.1 | ISR or revalidate strategy |
| P4.18 | Remove unused `sonner` import (if not used) | Reduce bundle | P3.14 (if using) or P2 | Cleaned up dependencies |

### P5 — Polish / QA

| # | What | Why | Dependency | Expected Outcome |
|---|---|---|---|---|
| P5.1 | Persian translation (FA) — full site | RTL market language | P1.5-P1.12 (EN content as source) | Complete Persian version |
| P5.2 | Russian translation (RU) — full site | Secondary market language | P1.5-P1.12 (EN content as source) | Complete Russian version |
| P5.3 | Vietnamese translation (VI) — full site | Primary market language, highest priority | P1.5-P1.12 (EN content as source) | Complete Vietnamese version |
| P5.4 | Visual refinement | Polish per design system | All pages | Consistent, polished visual experience |
| P5.5 | Responsive QA across breakpoints | Mobile-first requirement | All pages | Verified at all breakpoints |
| P5.6 | RTL QA (Persian) | RTL requirement | P5.1 | Verified RTL layout, no layout breaks |
| P5.7 | Accessibility audit (WCAG AA) | Accessibility requirement | All pages | WCAG AA compliance |
| P5.8 | Core Web Vitals optimization | Performance requirement | All pages | LCP < 2.5s, CLS < 0.1, INP < 200ms |
| P5.9 | Animation polish + reduced-motion check | UX requirement | All pages | Smooth animations, reduced-motion respected |
| P5.10 | Mobile touch target verification | Mobile UX requirement | All pages | All touch targets ≥ 44px |
| P5.11 | `/seoaudit` | SEO verification | P4.1-P4.12 | SEO audit script/process |
| P5.12 | `/uiaudit` | UI verification | P5.4 | UI audit process |
| P5.13 | `/uxaudit` | UX verification | P5.5-P5.10 | UX audit process |
| P5.14 | `/optimize` | Performance verification | P5.8 | Optimization audit process |
| P5.15 | `/killcritic` | Full QA audit | All above | Complete QA pass |
| P5.16 | Security audit (final) | Security verification | P4.13-P4.16 | Security audit pass |
| P5.17 | Real image replacement | Placeholder images need replacement | P2 | Real industrial imagery throughout |

---

## 18. Current vs Target Architecture

### Current Architecture

```
User Request
    ↓
Next.js (single route: /)
    ↓
layout.tsx (Server Component, hardcoded lang="en" dir="ltr")
    ↓
page.tsx (Server Component)
    ↓
┌─────────────────────────────────────────────┐
│ Header (Client Component)                   │
│   - Scroll detection (useEffect)            │
│   - Mobile menu state (useState)            │
│   - Language switcher UI (non-functional)   │
├─────────────────────────────────────────────┤
│ Hero (Server Component)                     │
│   - Hardcoded headline + CTA                │
│   - Image: cargo-ship-wide.jpg              │
├─────────────────────────────────────────────┤
│ ProductRange (Server Component)             │
│   - Hardcoded product array (4 items)       │
├─────────────────────────────────────────────┤
│ FeaturedProduct (Server Component)          │
│   - Hardcoded specs (8 items)               │
├─────────────────────────────────────────────┤
│ BuyerPriorities (Server Component)          │
│   - Hardcoded capabilities (8 items)        │
├─────────────────────────────────────────────┤
│ Certifications (Server Component)           │
│   - Hardcoded certs (4 of 6)                │
├─────────────────────────────────────────────┤
│ QualityPreview (Server Component)           │
│   - Hardcoded processes (6 of 9 shown)      │
├─────────────────────────────────────────────┤
│ SupplyChainPreview (Server Component)       │
│   - Hardcoded steps (8 of 9)                │
├─────────────────────────────────────────────┤
│ MarketsFocus (Server Component)             │
│   - Hardcoded markets (4 items)             │
│   - Links to non-existent pages             │
├─────────────────────────────────────────────┤
│ FinalCTA (Server Component)                 │
│   - Hardcoded CTA                            │
├─────────────────────────────────────────────┤
│ Footer (Server Component)                   │
│   - Hardcoded links + contact info          │
└─────────────────────────────────────────────┘

No API routes
No CMS
No i18n
No SEO files
No security headers
No error pages
No translations
```

### Target Architecture

```
User Request
    ↓
Middleware (locale detection, / → /en redirect)
    ↓
[locale] route segment
    ↓
layout.tsx (Server Component, dynamic lang + dir from locale)
    ↓
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layout Shell                                                 │
│   - Header (Client): scroll, mobile menu, functional lang   │
│   - Footer (Server): locale-aware links + contact           │
│   - Toaster (Sonner): for RFQ feedback                      │
└─────────────────────────────────────────────────────────────┘
    ↓
Pages (Server Components, CMS-driven content)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Home                → CMS content + sections                │
│ Products            → CMS product list                      │
│ Products/[slug]     → CMS product detail (template ×4)      │
│ About               → CMS page content                      │
│ Markets             → CMS market data (one page)            │
│ Supply-Chain        → CMS supply chain steps                │
│ Quality-Control     → CMS quality processes                 │
│ Certifications      → CMS certifications (6)                │
│ Contact             → CMS contact info + RFQ form           │
│ Blog                → CMS blog list                        │
│ Blog/[slug]         → CMS blog post (template)              │
└─────────────────────────────────────────────────────────────┘
    ↓
API Routes
    ↓
POST /api/rfq → validate → sanitize → rate limit → anti-bot → Resend → inbox
    ↓
SEO Pipeline (per page)
    ↓
metadata → hreflang → canonical → schema.org → sitemap → robots
    ↓
Security Layer (next.config.ts)
    ↓
CSP + HSTS + X-Frame-Options + Referrer-Policy + Permissions-Policy
    ↓
CMS (Decap CMS → GitHub → Markdown)
    ↓
Content updates → git push → rebuild → live
```

---

## 19. CMS Data Flow (Target)

```
┌─────────────────────────────────────────────────────────────┐
│ Decap CMS (admin interface at /admin)                       │
│                                                              │
│  Admin logs in via GitHub OAuth                              │
│  Admin edits content in visual interface                    │
│  Editorial Workflow: Draft → Review → Publish               │
└─────────────────────────────────────────────────────────────┘
    ↓ (creates/updates Markdown files)
┌─────────────────────────────────────────────────────────────┐
│ GitHub Repository                                            │
│                                                              │
│  content/                                                    │
│  ├── en/                                                     │
│  │   ├── products/                                           │
│  │   │   ├── frozen-chicken-feet.md                         │
│  │   │   ├── chicken-liver.md                               │
│  │   │   ├── chicken-gizzard.md                             │
│  │   │   └── chicken-heart.md                               │
│  │   ├── certifications/                                    │
│  │   │   └── *.md (or JSON)                                 │
│  │   ├── features/                                          │
│  │   │   └── capabilities.md                                │
│  │   ├── markets/                                           │
│  │   │   └── markets.md                                     │
│  │   ├── supply-chain.md                                    │
│  │   ├── quality-control.md                                 │
│  │   ├── about.md                                           │
│  │   ├── contact.md                                         │
│  │   └── blog/                                              │
│  │       └── *.md                                           │
│  ├── fa/  (Persian — RTL)                                   │
│  ├── ru/  (Russian)                                          │
│  └── vi/  (Vietnamese — highest priority)                   │
│                                                              │
│  public/media/                                               │
│  ├── products/                                               │
│  ├── certifications/                                         │
│  └── ...                                                     │
└─────────────────────────────────────────────────────────────┘
    ↓ (Next.js reads at build time or on-demand)
┌─────────────────────────────────────────────────────────────┐
│ Next.js Content Layer                                        │
│                                                              │
│  Content utilities:                                          │
│  - getProduct(locale, slug)                                 │
│  - getProducts(locale)                                      │
│  - getCertifications(locale)                                │
│  - getCapabilities(locale)                                  │
│  - getMarkets(locale)                                       │
│  - getSupplyChainSteps(locale)                              │
│  - getQualityProcesses(locale)                              │
│  - getPageContent(locale, slug)                             │
│  - getBlogPosts(locale)                                     │
│  - getBlogPost(locale, slug)                                │
└─────────────────────────────────────────────────────────────┘
    ↓
Rendered pages with dynamic metadata, schema, hreflang
```

---

## 20. SEO Architecture (Target)

```
Per Page:
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Next.js Metadata API (generateMetadata or static metadata)  │
│                                                              │
│  - title: unique per page per locale                        │
│  - description: unique per page per locale                  │
│  - alternates:                                              │
│    - canonical: self-referencing                            │
│    - languages:                                             │
│      - en: /en/...                                          │
│      - fa: /fa/...                                          │
│      - ru: /ru/...                                          │
│      - vi: /vi/...                                          │
│      - x-default: /en/...                                   │
│  - openGraph:                                               │
│    - title, description, images, locale, type              │
│  - twitter:                                                 │
│    - card, title, description                               │
│  - robots: index, follow (or noindex for draft content)    │
└─────────────────────────────────────────────────────────────┘
    ↓
Schema.org JSON-LD (per page type):
    ↓
    Homepage:    Organization + WebSite
    Product:     Product + BreadcrumbList
    Blog Post:   Article + BreadcrumbList
    Internal:    BreadcrumbList (where applicable)
    ↓
sitemap.xml: All pages across all locales
    ↓
robots.txt: Allow all, point to sitemap
```

---

## 21. Security Architecture (Target)

```
5-Layer Defense in Depth:

Layer 1: CDN/WAF (Cloudflare)
    ↓ DDoS protection, WAF rules, bot management, SSL/TLS

Layer 2: Network (Nginx/Caddy reverse proxy)
    ↓ HTTPS forced, HSTS, IP whitelist for /admin, rate limiting

Layer 3: Application (Next.js)
    ↓ CSP, XSS protection (React auto-escaping), input sanitization

Layer 4: API (RFQ endpoint)
    ↓ Rate limiting (5/hour/IP), CSRF tokens, server-side validation, safe errors

Layer 5: Data
    ↓ Environment secrets (server-side only), .env in .gitignore, no client exposure
```

---

## 22. Visual Architecture Diagram (HTML artifact — see PROJECT-ARCHITECTURE-AUDIT.html)

A complete visual architecture document with diagrams is provided in:
`docs/audit/PROJECT-ARCHITECTURE-AUDIT.html`

---

## 23. Project Roadmap Visual (SVG artifact — see project-roadmap.svg)

A visual roadmap from current state through gap analysis to final system is provided in:
`docs/audit/project-roadmap.svg`

---

## 24. Final Audit Conclusion

### Overall Project Status: **Foundation**

The Feiz Food Group repository has a strong visual foundation — the homepage design is polished, the brand identity is consistent, the component structure is clean, and the technical stack choices are correct. However, the project is at **Foundation** status because none of the documented system has been built. What exists is a single-page visual scaffold with hardcoded English content, no routing infrastructure, no CMS, no conversion flow, and no internationalization.

### Summary of Critical Gaps

1. **No i18n routing** — Every page and feature depends on this
2. **No CMS** — All content must be CMS-driven per specification
3. **No product pages** — 4 product detail pages required, none exist
4. **No RFQ infrastructure** — Primary business conversion has zero implementation
5. **No secondary pages** — 9 of 10 required pages are missing
6. **No translations** — 3 of 4 languages have zero content
7. **No SEO infrastructure** — No sitemap, robots, schema, or per-page metadata
8. **No security headers** — Production security not configured

### Most Important Next Step

**Lock the i18n routing architecture and implement the locale foundation (P0).** Without this, every subsequent page, link, metadata entry, and SEO element will need to be rebuilt. The i18n architecture decision (library choice, route structure, middleware approach) must be finalized and implemented before any page routes are created.

---

*End of Deep Audit Report — English Version*
