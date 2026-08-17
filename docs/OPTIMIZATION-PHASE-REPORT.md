# Optimization phase — report

**Starting point:** commit `6a722bb` ("Markets: unify every destination panel on
the Vietnam template"), clean working tree. None of this phase's three goals had
been started.

**Scope:** performance, homepage market navigation, environment configuration.
No redesign, no architecture change, no database. GitHub → Markdown → Next.js
is unchanged.

---

## A. Performance

### Audit findings (before changing anything)

| Area | Finding |
|---|---|
| Images | All 16 `<Image>` usages already use `next/image` with `sizes`. No raw `<img>` anywhere. |
| `logo/1.png` | **1.2 MB, referenced nowhere.** |
| `feiz-food-logo-footer (2).png` | 121 KB, referenced nowhere. |
| `feiz-food-logo.png` | 401 KB at 2172×724, rendered at 44–64 px tall. |
| Logo dimensions | Declared `83×80` (header) and `110×110` (footer) on a **3:1** image — wrong reserved box. |
| `sonner` | `<Toaster>` in the root layout put a ~44 KB chunk on all 90 pages; `toast()` is only called by the RFQ form. |
| Fonts | Already local variable woff2, `display: swap`, no unused weights. But **both faces preload on every page** (453 KB). |
| Client components | 7 total, all justified (Header menu, RFQ form, Turnstile, Reveal observer, ScrollToTop, error/404). |
| Rendering | Every content page already SSG. `/api/*` correctly dynamic. |
| Third-party | Turnstile script loads only on `/contact` (inside `TurnstileWidget`); Decap loads only under `/admin`. No analytics. |

### Changes made

**1. Removed 1.3 MB of unreferenced image assets**
`public/media/logo/1.png` and `feiz-food-logo-footer (2).png` were dead weight in
the repository and every deployment.

**2. Resized the logo — 401 KB → 46 KB**
2172×724 → 600×200. It renders at most 64 px tall, so 600 px wide is still a
downscale at 3× DPR. Visually identical.

**3. Fixed logo aspect ratios (layout-shift class of bug)**
The `width`/`height` attributes described a square, but the image is 3:1. The
browser reserved the wrong box until the image painted. Now `132×44` (header),
`192×64` (mobile menu), `165×55` (footer). Verified: declared ratio now matches
intrinsic ratio, and Next serves a **256 px** variant instead of 2172 px.

**4. Moved `<Toaster>` from the root layout into the RFQ form**
Isolated A/B on identical builds:

| | With global Toaster | Scoped to `/contact` |
|---|---|---|
| `/en` | 193 KB JS | **184 KB** |
| `/en/products` | 193 KB | **184 KB** |
| `/en/markets` | 193 KB | **184 KB** |
| `/en/blog` | 193 KB | **184 KB** |
| `/en/contact` | 197 KB | 197 KB (unchanged — correct) |

**−9 KB of JavaScript on every page except the one that needs it.** Confirmed the
sonner chunk is absent from `/en`, `/products`, `/markets`, `/blog` and present
only on `/contact`. Toast behaviour re-verified in LTR **and** RTL with correct
localized copy and zero page errors.

### Measured results (all 11 required pages, desktop + mobile)

```
                                        img KB  CLS      broken  console
desktop total                              597  0.0000        0        0
mobile  total                              360  0.0000        0        0
```

- **CLS is 0.0000 on every page** at both viewports.
- **Zero console errors, zero broken images** across all 22 page/viewport runs.
- Mobile serves **40% fewer image bytes** than desktop (360 KB vs 597 KB),
  confirming `sizes` is working — no desktop-sized images on phones.
- Static pages: 90 → **106** (the 16 new market detail pages, all SSG).

### Attempted and reverted (documented so it is not retried blindly)

**Per-locale font preloading.** English pages preload the 111 KB Persian font and
Persian pages preload the 352 KB Latin font — 453 KB where ~350 KB or ~111 KB
would do. Three approaches were tried and **all reverted**:

1. Mounting only one `.variable` class — Next still preloads both.
2. `preload: false` + a shared fonts module — the flag is ignored once the
   layout's module graph imports both faces.
3. An inline script pruning the stray `<link>` — runs *after* the preload
   scanner has already started both fetches, so it is a no-op, and it would
   have required `unsafe-inline`.

Only **one face is ever actually applied** per locale (verified via
`document.fonts`), so this is wasted preload bandwidth, not wasted rendering.
A real fix needs either per-locale root layouts (forks the routing architecture)
or upstream support for conditional preload. Left as a known bottleneck rather
than shipping a fragile hack.

### Not changed, deliberately

- **Animations** — `Reveal` uses a single IntersectionObserver that disconnects
  after firing; no animation library is installed. No measurable cost.
- **Client components** — all 7 need browser APIs. Removing any would break
  behaviour.
- **Image quality/format** — already AVIF/WebP via the optimizer, `qualities:
  [75, 90]`. Recompressing further would visibly degrade the hero artwork.
- **Public-site CSP** — untouched. Still no `unsafe-eval`; that remains scoped
  to `/admin` only.

### Remaining bottlenecks

1. **Fonts (453 KB/page)** — the largest single item. See above.
2. `/en/markets` (148 KB images) and `/en/blog` (107 KB) are the heaviest pages;
   both are image-led by design and already responsive.

---

## B. Homepage market cards → detail pages

**The detail routes did not exist.** Only `/[locale]/markets` (the listing) was
implemented, so there was nothing to link to. Added
`src/app/[locale]/markets/[slug]/page.tsx`, statically generated for every
locale/slug pair from the existing `markets` content collection —
`dynamicParams = false`, so unknown slugs 404 rather than render.

Homepage cards are now a single semantic `<Link>` wrapping the whole card
(`marketPath(locale, slug)`), not an `onClick` handler. This preserves middle
click and "open in new tab", adds no client-side JavaScript, and keeps the
existing hover animation. Added a visible `focus-visible` cyan ring.

Verified by actually clicking each card and reading the resulting H1:

| Card | Lands on | H1 |
|---|---|---|
| Vietnam | `/en/markets/vietnam` | Vietnam |
| UAE | `/en/markets/uae` | UAE |
| Russia | `/en/markets/russia` | Russia |
| Thailand | `/en/markets/thailand` | Thailand |

**All four locales** generate correct hrefs (`/fa/markets/vietnam`,
`/ru/markets/russia`, `/vi/markets/thailand`, …) from the shared `marketPath`
helper — no per-language navigation code. All **16** detail pages return 200.

Keyboard: focusing a card shows the ring and **Enter navigates** to the right
page. Market detail pages are also in the sitemap (16 entries) and the Markets
listing headings now link through to them.

---

## C. Environment configuration

Audited by grepping the whole repository for `process.env`, `NEXT_PUBLIC_`, and
dynamic lookups. This surfaced `src/lib/content/contact.ts`, which reads env via
an `envUrl()` helper and is missed by a naive `process.env.NAME` search.

**12 variables found; all 12 documented. Nothing invented.**

`.env.example` is now committed. Note `.gitignore` had `.env*`, which would have
silently excluded the template — added `!.env.example` while keeping `.env`,
`.env.local` and `.env.production` ignored (verified).

| Variable | Required | Secret | Environment |
|---|---|---|---|
| `RESEND_API_KEY` | Yes (RFQ) | **Yes** | Production |
| `RFQ_TO_EMAIL` | Yes (RFQ) | No | Production |
| `RFQ_FROM_EMAIL` | Yes (RFQ) | No | Production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes in prod | No (public) | Dev/Preview/Prod |
| `TURNSTILE_SECRET_KEY` | Yes in prod | **Yes** | Production |
| `GITHUB_OAUTH_CLIENT_ID` | Yes (`/admin`) | No | Production |
| `GITHUB_OAUTH_CLIENT_SECRET` | Yes (`/admin`) | **Yes** | Production |
| `TRUST_PROXY` | No | No | Self-host only — leave unset on Vercel |
| `RFQ_ALLOWED_ORIGINS` | No | No | Preview |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` | No | No (public) | Any |
| `NEXT_PUBLIC_SOCIAL_TELEGRAM` | No | No (public) | Any |
| `NEXT_PUBLIC_SOCIAL_WHATSAPP` | No | No (public) | Any |

Deliberately **not** env-driven, with reasons in the file: `NODE_ENV` (runtime),
`SITE_URL`/`SITE_NAME` (canonical URLs must not vary by deployment, or a preview
could advertise itself as canonical), Decap `repo` (public, browser-read) and
Decap `base_url` (injected from `window.location.origin`).

No server secret is exposed through `NEXT_PUBLIC_*`. The app builds with none of
these set — they gate runtime features, not compilation.

---

## Validation

| Check | Result |
|---|---|
| `tsc --noEmit` | Clean |
| `eslint` | Clean (exit 0) |
| `next build` | Success — **106** static pages (was 90) |
| Routes | **60/60** (15 routes × 4 locales) return 200 |
| Market detail | 16/16 return 200; unknown slug → 404 |
| CLS | 0.0000 on all 11 pages, desktop + mobile |
| Console errors | 0 across 22 page/viewport runs |
| Broken images | 0 |
| `/admin` | 200 |
| `/api/auth` without env | 500 with a clear message (fail-safe, by design) |
| RFQ toast | Works in LTR and RTL after relocation |

**Pre-existing, not caused by this phase:** ESLint reports errors if
`.vercel/output` exists (build artifacts get linted — `.vercel` is in
`.gitignore` but not in `eslint.config.mjs`'s ignore list). Removing the
directory restores a clean lint. Left alone as out of scope.

---

## Files changed

```
.env.example                                   new
.gitignore                                     !.env.example negation
docs/OPTIMIZATION-PHASE-REPORT.md              new (this file)
public/media/logo/1.png                        deleted (1.2 MB, unused)
public/media/logo/feiz-food-logo-footer (2).png deleted (121 KB, unused)
public/media/logo/feiz-food-logo.png           401 KB → 46 KB
src/app/[locale]/layout.tsx                    Toaster removed
src/app/[locale]/markets/[slug]/page.tsx       new — market detail route
src/app/sitemap.ts                             market detail pages added
src/components/layout/Footer.tsx               logo dimensions
src/components/layout/Header.tsx               logo dimensions (×2)
src/components/markets/MarketPanel.tsx         heading links to detail page
src/components/rfq/RfqForm.tsx                 Toaster mounted here
src/components/sections/MarketsFocus.tsx       passes locale to MarketCard
src/components/shared/cards/MarketCard.tsx     whole card is a Link + focus ring
src/lib/i18n/routes.ts                         marketsPath / marketPath helpers
```

---

## Next continuation point

This phase is complete and committed. Suggested next steps, in priority order:

1. **Set the production environment variables** (see `.env.example` and
   `docs/CMS-ADMIN-SETUP.md`). The RFQ form and `/admin` login stay inert until
   `RESEND_API_KEY`, the Turnstile pair, and the GitHub OAuth pair are set in
   Vercel. This is operator work and cannot be done from the repository.
2. **Font preloading** — revisit if Next.js gains per-request preload control,
   or accept per-locale root layouts as a deliberate architectural change.
3. **Add `.vercel/**` to `eslint.config.mjs`** ignores so local `vercel build`
   output stops tripping lint (one line; deferred as unrelated).
