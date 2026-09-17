# Feiz Food Group

A multilingual B2B website for Feiz Food Group, an IQF frozen poultry exporter (primary product: frozen chicken feet). Built with Next.js 16 (App Router) and React 19, with content managed through a self-hosted CMS and an RFQ (Request for Quote) lead-generation flow.

## Features

- **Multilingual content** — English (default), Persian (RTL), Russian, and Vietnamese, served from locale-specific Markdown content (`content/{en,fa,ru,vi}/`)
- **RFQ lead form** — `POST /api/rfq` sends inquiries via Resend, protected by Cloudflare Turnstile and a process-local rate limiter
- **CMS-managed content** — Decap CMS admin panel at `/admin`, authenticated through a self-hosted GitHub OAuth broker (no third-party auth broker in the path)
- **SEO** — locale-aware sitemap and robots.txt, product/market/certification pages structured for search
- **Performance budget enforcement** — bundle-size and Lighthouse budgets checked as part of the build (`perf-budget.json`, `lighthouse-budget.json`)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, Lucide icons, Sonner (toasts) |
| Content | Markdown + `gray-matter`, `react-markdown` |
| CMS | Decap CMS, self-hosted GitHub OAuth |
| Email | Resend |
| Bot protection | Cloudflare Turnstile |
| Testing | Vitest |
| Tooling | ESLint, TypeScript strict mode |

## Getting Started

### Prerequisites
- Node.js ≥ 20.18
- npm ≥ 10

### Setup

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# fill in Resend + Turnstile keys for the RFQ form

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000` and redirect to `/en`.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Verify CMS config + vendored Decap assets, then build for production |
| `npm run start` | Start the production server |
| `npm run test` | Run the test suite (Vitest) |
| `npm run typecheck` | Type-check the project |
| `npm run lint` | Lint the codebase |
| `npm run cms:generate` | Generate the Decap CMS config |
| `npm run perf:budget` | Check bundle size against the performance budget |

## Locales

- `/en` — English (default)
- `/fa` — Persian (RTL)
- `/ru` — Russian
- `/vi` — Vietnamese

Root `/` redirects to `/en`. Content for each locale lives under `content/<locale>/`.

## Environment

See `.env.example` for the full list. Turnstile is **required** in production (fails closed if unset). Never commit secrets.

## Production Checklist

These are operator steps and cannot be completed in git:

1. Set `RESEND_API_KEY`, `RFQ_TO_EMAIL`, `RFQ_FROM_EMAIL` (verified sending domain).
2. Set Turnstile site + secret keys.
3. Behind Nginx/Caddy: set `TRUST_PROXY=true` only if the proxy overwrites `X-Forwarded-For`.
4. Optional staging origin allow-list: `RFQ_ALLOWED_ORIGINS`.
5. Create a GitHub OAuth App for Decap CMS with callback `https://<domain>/api/callback`, then set `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET`. Full guide: `docs/CMS-ADMIN-SETUP.md`. Never put tokens in `public/admin/config.yml`.
6. Point DNS at the host, enable HTTPS, and submit the sitemap (`/sitemap.xml`) in Search Console.
7. Send one test RFQ per locale after deploy.

Authoritative production topology: a single Node process behind Nginx, supervised by systemd, on one VPS — see `docs/DEPLOYMENT.md` for the full reasoning (the RFQ rate limiter is process-local, and `TRUST_PROXY` is only safe because Nginx owns the forwarded headers).

## Project Structure

```
src/
  app/
    [locale]/      # Localized pages: home, products, markets, blog, about, contact...
    api/
      rfq/         # RFQ form submission handler
      auth/        # Decap CMS GitHub OAuth — start
      callback/    # Decap CMS GitHub OAuth — callback
      cron/        # Scheduled tasks
      health/      # Health check endpoint
  components/       # Shared UI components
  lib/              # Rate limiting, RFQ logic, content loading, etc.
content/
  en/ fa/ ru/ vi/   # Per-locale Markdown content
scripts/
  generate-cms-config.mjs   # Builds the Decap CMS config
  vendor-decap.mjs          # Vendors the Decap CMS admin bundle
  check-bundle-budget.mjs   # Enforces the performance budget
docs/               # Deployment, CMS setup, performance, and slug policy docs
```

## Documentation

- `docs/DEPLOYMENT.md` — production topology and deployment steps
- `docs/CMS-ADMIN-SETUP.md` — Decap CMS + GitHub OAuth setup guide
- `docs/PERFORMANCE.md` — performance budget details
- `docs/SLUG-POLICY.md` — URL slug conventions across locales

## License

Private project — not licensed for reuse.
