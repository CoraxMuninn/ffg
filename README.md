# Feiz Food Group

B2B site for Feiz Food Group — IQF frozen poultry export (primary product: frozen chicken feet).

## Stack

- Next.js 16 App Router, React 19, TypeScript (strict)
- Tailwind CSS 4, Lucide, Sonner
- Markdown content (`content/{en,fa,ru,vi}/`) + Decap CMS admin at `/admin`
- RFQ: `POST /api/rfq` → Resend (server-only)

## Locales

`/en` (default), `/fa` (RTL), `/ru`, `/vi`. Root `/` redirects to `/en`.

## Scripts

```bash
npm install
cp .env.example .env.local   # fill Resend + Turnstile for RFQ
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Environment

See `.env.example`. In production, Turnstile is required (fail-closed). Do not commit secrets.

## Production checklist

These are operator steps — they cannot be completed in git:

1. Set `RESEND_API_KEY`, `RFQ_TO_EMAIL`, `RFQ_FROM_EMAIL` (verified domain).
2. Set Turnstile site + secret keys.
3. Behind nginx/caddy: `TRUST_PROXY=true` only if the proxy overwrites `X-Forwarded-For`.
4. Optional staging Origin: `RFQ_ALLOWED_ORIGINS`.
5. Decap CMS GitHub OAuth: create a GitHub OAuth App with callback
   `https://<domain>/api/callback`, then set `GITHUB_OAUTH_CLIENT_ID` and
   `GITHUB_OAUTH_CLIENT_SECRET`. Full guide: `docs/CMS-ADMIN-SETUP.md`.
   (Never put tokens in `public/admin/config.yml`.)
6. Point DNS at the host; HTTPS; submit `https://feizfood.com/sitemap.xml` in Search Console.
7. Send one test RFQ per locale after deploy.

`docs/audit/DEEP-AUDIT-*.md` describes an older scaffold and is **not** current.
