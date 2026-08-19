# Content Manager (`/admin`) — setup & usage

Decap CMS, editing Markdown in this repository through GitHub. No database, no
second CMS: articles are commits, and the site rebuilds from them.

---

## 1. One-time setup (operator)

### 1.1 Create a GitHub OAuth App

<https://github.com/settings/developers> → **New OAuth App**

| Field | Value |
|---|---|
| Application name | `Feiz Food Group CMS` |
| Homepage URL | `https://feizfood.com` |
| Authorization callback URL | `https://feizfood.com/api/callback` |

Generate a client secret and keep the page open.

> The callback URL must match the deployment exactly. To also use the CMS on
> a preview deployment, register a second OAuth App with that preview domain —
> GitHub allows only one callback URL per app.

### 1.2 Set the environment variables on the server

Set these in the deployment environment (the systemd service environment on
the VPS — see `DEPLOYMENT.md`):

| Variable | Value | Exposure |
|---|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | Client ID from 1.1 | Server-only |
| `GITHUB_OAUTH_CLIENT_SECRET` | Client secret from 1.1 | **Server-only — never commit** |
| `OAUTH_ALLOWED_ORIGINS` | *Optional.* Extra approved origins, comma-separated | Server-only |

Restart the service after adding them. Until they are set, `/api/auth` returns a clear
`500` explaining what is missing, and login will not work.

**Approved OAuth origins.** OAuth destinations come from an exact allowlist,
never from request headers (audit `SEC-M2`). Allowed out of the box:

- `https://feizfood.com` and `https://www.feizfood.com`
- `http://localhost`, `http://127.0.0.1`, `http://[::1]` (any port) —
  **non-production builds only**

A request arriving on any other host — including a poisoned
`X-Forwarded-Host`, an unexpected port, or an HTTP downgrade — gets a `400`
from `/api/auth` and `/api/callback` instead of an OAuth redirect.

This means **preview deployments do not authenticate automatically.** To enable
one, register its exact full origin (scheme + host, no trailing path):

```
OAUTH_ALLOWED_ORIGINS=https://staging.feizfood.com
```

Each registered origin must also be added as an authorized callback URL on the
GitHub OAuth App (`<origin>/api/callback`), or GitHub rejects the exchange.
Remove preview origins once the deployment is retired.

### 1.3 Grant editors access

Anyone who can log in must have **write access to `CoraxMuninn/ffg`**
(Settings → Collaborators). Decap commits as the signed-in user, so GitHub
permissions *are* the CMS permissions — there is no separate user list.

**This is the only thing standing between a GitHub account and your content.**
The OAuth App authenticates *who* someone is; the repository's collaborator
list decides what they may do. A GitHub user who is not a collaborator can sign
in and will simply be unable to read or write anything through the CMS.

Operational requirements:

- **Least-privilege collaborators.** Grant **Write**, not Admin — editors need
  to commit content and open pull requests, nothing more. Admin additionally
  allows changing repository settings, branch protection, and collaborators.
- **Require 2FA.** Every collaborator must have two-factor authentication
  enabled. If the repository is moved under an organization, enforce it
  centrally with *Organization → Settings → Authentication security → Require
  two-factor authentication*. A CMS token is only as strong as the GitHub
  account behind it.
- **Review access periodically** and remove collaborators when they leave.
- **Protect `master`** so published content lands only via the editorial
  workflow's pull requests.

### 1.4 Authorization scope — what the CMS token can reach

The OAuth token issued to an editor's browser requests **`public_repo`**, not
GitHub's broad `repo` scope (audit `SEC-M3`).

The difference is the blast radius if a token is ever stolen:

| Scope | Grants |
|---|---|
| `repo` | Read/write to **every** repository the editor can reach, **including unrelated private ones** |
| `public_repo` *(in use)* | Read/write to **public repositories only** — no private-repository access whatsoever |

`public_repo` is sufficient because `CoraxMuninn/ffg` is a public repository and
Decap's GitHub backend only performs repository-content operations (contents,
git refs/blobs/trees/commits, pull requests, issue labels) plus `/user` to
identify the signed-in editor, which needs no additional scope.

**Enforcement is server-side.** The broker (`src/app/api/auth`) always sends
its own `OAUTH_SCOPE` constant to GitHub and ignores the `scope` parameter the
browser supplies, so tampering with the client cannot request more. The
matching `auth_scope: public_repo` in `config.yml` keeps the client's request
consistent with what the broker sends.

#### Why not a repository-scoped GitHub App?

A GitHub App installed on a single repository would be narrower still, and it
remains the preferred long-term end state. **Decap 3.15.1 cannot use one:** its
GitHub backend has no installation-token support (`installation_id` does not
appear anywhere in the runtime), `app_id` belongs to the GitLab/Gitea PKCE
backends, and the config schema constrains `auth_scope` to exactly
`["repo", "public_repo"]`. Adopting a GitHub App would require replacing
Decap's GitHub backend or brokering installation tokens ourselves.

`public_repo` plus the collaborator and 2FA controls above is therefore the
documented end-state control. Re-evaluate if a future Decap release adds
GitHub App support.

> **If the repository is ever made private,** `public_repo` will stop working
> and the CMS will fail to load content. Do not simply widen the scope back to
> `repo` — that re-opens `SEC-M3`. Prefer a dedicated editor identity whose
> account holds no other private repositories, and update `OAUTH_SCOPE` in
> `src/lib/cms/oauth.ts` together with `auth_scope` in `config.yml`.

---

## 2. Daily use (administrator)

### Access and log in
1. Go to **`https://feizfood.com/admin`**
2. Click **Login with GitHub**
3. Authorize the app in the popup (first time only)

The popup returns a token to the browser for the session. The client secret
stays on the server; no token is ever written to the repository.

### Where the SEO & Content Assistant is
It is **not** a dashboard card, sidebar item, or Workflow tab. It is the
**first field inside a blog article editor**.

1. Sidebar → **Blog — English** (or فارسی / Русский / Tiếng Việt)
2. **+ Blog — …** (new) or open an existing article
3. The top of the form is labeled **SEO & Content Assistant**

It only exists on the four blog collections. Products, pages, markets, and
the other collections do not have it.

### Create an article
1. Pick the language collection in the sidebar — **Blog — English**,
   **Blog — فارسی**, **Blog — Русский**, or **Blog — Tiếng Việt**
2. **New Article**, then complete the fields:

| Field | Notes |
|---|---|
| SEO & Content Assistant | Compact live Persian SEO & content panel (editorial score /100, category bars, keyword field). Not saved to the article. |
| Title | Required. Rendered as the only page `H1`. |
| Slug | Required. Shared English kebab-case URL segment. Identical across locales. |
| Publication date | Required. `datePublished` and sitemap `lastmod` when there is no revision. |
| Revision date | Optional. Must be on or after the publication date. `dateModified` + sitemap `lastmod`. |
| Author | Optional team/organization byline. Do not invent a named person. |
| Excerpt / summary | Required. Listing card; fallback meta description. |
| Featured image | Required. Wide landscape; default social image. |
| Featured image alt | Required. Describe what the image shows. |
| Featured image caption | Optional visible caption. |
| Category | Optional, from a fixed list. |
| SEO keywords / tags | Optional. Become schema `keywords`. |
| Focus keyphrase | Optional editorial target. Not shown on the page. Not a density target. |
| SEO title | Optional 10–60 character search title. Empty = article title. |
| Meta description | Optional 70–160 character snippet. Empty = excerpt. |
| Canonical URL | Optional absolute `https://` URL. Empty = this article URL. |
| OG title / description / image / alt | Optional social overrides. Empty = SEO/featured values. Twitter/X reuses the same fields. |
| Related internal pages | Optional list of **existing** root-relative paths. Unknown paths fail the build. |
| Published | Off hides the article from the site, sitemap, and listing. |
| Order | Lower numbers appear first. |
| Article body | Required. Toolbar: H2/H3, paragraphs, bold/italic, lists, links, quotes, images. Do **not** use H1. |

Internal links in the body must use existing root-relative paths (`/products/frozen-chicken-feet`, `/quality-control`, `/markets/vietnam`, `/contact`). The locale prefix is added automatically. Do not invent URLs, certifications, prices, or customer names.

The **SEO & Content Assistant** at the top of the form is a compact live checklist. Required and attention items stay open; passing checks stay collapsed. “How to fix” is hidden until the editor asks. The Persian collection renders the panel RTL. It follows Google Search Central’s 2026 people-first guidance and the official note that visibility in AI Overviews / AI Mode is still SEO — not a separate GEO/AEO project.

- **Required** — genuine contract problems (missing title, excerpt, featured image + alt, invalid slug/date/canonical, unknown internal paths, SEO fields over the length limits, a body H1). These fail the production build.
- **Needs attention** — writing quality, people-first prompts, keyphrase stuffing, thin introductions, missing next steps, image alt, suggested existing internal links. These never block saving.
- **Good** — that check looks fine.

There is **no ranking score**, no required word count, and no keyword-density target. Suggested links come only from pages that already exist on this site.

3. **Save** → stored as a *Draft* (a pull request; nothing is live yet)

### Publish
Open the **Workflow** tab, drag the entry **Draft → In review → Ready**, then
**Publish now**. This merges the pull request into `master`; rebuild the site (the
deployment's rebuild step) and the article appears within a couple of minutes.

### Edit / unpublish / delete
- **Edit** — open the article, change it, save, publish again.
- **Unpublish** — set **Published** to off. Removes it from the blog listing,
  the article URL, and the sitemap, but keeps the file.
- **Delete** — **Delete entry** in the editor; removes the Markdown file.

---

## 3. Where things live

| Thing | Location |
|---|---|
| English articles | `content/en/blog/<slug>.md` |
| Persian articles | `content/fa/blog/<slug>.md` |
| Russian articles | `content/ru/blog/<slug>.md` |
| Vietnamese articles | `content/vi/blog/<slug>.md` |
| Uploaded images | `public/media/blog/` |
| Image URL in Markdown | `/media/blog/<file>` |
| CMS collections & fields | `public/admin/config.yml` *(generated)* |
| Blog quality analyzer | `src/lib/seo/blog-quality.ts` → `public/admin/blog-quality.js` *(generated)* |
| Known internal paths | `public/admin/internal-paths.json` *(generated)* |
| Quality widget | `public/admin/blog-quality-widget.js` |
| CMS entry point | `public/admin/index.html` |
| CMS runtime (self-hosted) | `public/admin/vendor/decap-cms/<version>/` |
| CMS runtime manifest | `public/admin/decap-cms-manifest.json` |
| Vendoring script | `scripts/vendor-decap.mjs` |
| OAuth broker | `src/app/api/auth`, `src/app/api/callback` |

> **`config.yml` is generated** by `scripts/generate-cms-config.mjs`
> (Roadmap Task 5.2): every collection is emitted once per locale. Do not edit
> it by hand — edit the generator and run `npm run cms:generate`. `prebuild`
> fails if the committed file drifts from the generator output.

Locales are independent: an article written in one collection appears only on
that language's site. Translations are separate entries sharing the same slug.

---

## 4. How a published article reaches the site

```
/admin  →  commit to content/<locale>/blog/*.md  (via GitHub)
        →  site rebuild (build step on the VPS)
        →  getBlogPosts(locale) reads the folder
        →  /<locale>/blog  and  /<locale>/blog/<slug>
```

`src/lib/content/loaders.ts` reads the folder at build time, so no code change
is needed for a new article. Posts with `enabled: false` are filtered out;
remaining posts sort by `order`.

---

## 5. The Decap runtime — self-hosted and version-pinned

The CMS bundle is **served from this origin**, not from a CDN.

Previously `/admin` loaded `decap-cms@^3` from unpkg. That is a mutable semver
range on third-party infrastructure, re-resolved on every cache cycle, with no
integrity pinning — for the one script that receives an editor's GitHub token.
A compromised release, CDN path, or upstream account could have exfiltrated
credentials and rewritten published content (audit `SEC-M1`).

### 5.1 How it is pinned

Three layers, each independently checkable:

| Layer | Artifact | Guarantees |
|---|---|---|
| Dependency | `decap-cms` exact version in `package.json` (no `^`) | `npm audit`/`npm ci` see it; `package-lock.json` holds the registry `integrity` hash and signature |
| Served bytes | `public/admin/vendor/decap-cms/<version>/` | The exact files the browser executes, committed and reviewable |
| Verification | `public/admin/decap-cms-manifest.json` | SHA-256 of every served file; any drift is a diff in review |

`scripts/vendor-decap.mjs` copies the runtime out of `node_modules` and writes
the manifest. `npm run verify:decap` re-hashes everything and fails on any
mismatch. **This runs automatically as `prebuild`, so a tampered or
out-of-date runtime fails the build rather than shipping.**

Only the entry (`decap-cms.js`) and its 92 code-split chunks
(`<id>.decap-cms.js`) are vendored. Source maps, the parallel `*.cms.js`
build, and `cms.css` are deliberately excluded — the entry needs none of them,
and shipping maps would publish readable admin source.

### 5.2 Updating the runtime

Deliberate and reviewed — updates are no longer received automatically.

```bash
# 1. Review upstream first: release notes, diff, and open advisories.
#    https://github.com/decaporg/decap-cms/releases
npm view decap-cms versions --json
npm view decap-cms@<new-version> dist.integrity

# 2. Pin the exact version (never a range).
npm install --save-exact --save-dev decap-cms@<new-version>

# 3. Re-vendor and update the manifest.
npm run vendor:decap

# 4. Point the entry point at the new path.
#    public/admin/index.html → <script src="/admin/vendor/decap-cms/<new-version>/decap-cms.js">

# 5. Verify, audit, and build.
npm run verify:decap
npm audit
npm run lint && npm run typecheck && npm run build
```

**Security checks before deploying an update:**

1. `npm run verify:decap` passes (hashes match the installed package).
2. `package-lock.json` shows the expected `resolved` registry URL and
   `integrity` hash — confirm it against `npm view decap-cms@<v> dist.integrity`.
3. `npm audit` reviewed; see 5.3 for how to read the result.
4. Review the `git diff`: `package.json`, `package-lock.json`,
   `index.html`, the manifest, and the vendored directory should be the *only*
   changes. The manifest diff is the human-readable summary of what changed.
5. Load `/admin` and confirm: CMS renders, **no requests leave this origin**,
   no CSP violations, and "Login with GitHub" completes.
6. Confirm the old version directory was removed (the script prunes it) so no
   stale runtime remains reachable.

### 5.3 Dependency scanning coverage

Because `decap-cms` is a real entry in `package.json`/`package-lock.json`, it
is covered by `npm audit` — which was **not** true of the unpkg script tag.

`npm audit` currently reports high-severity advisories reaching the CMS through
three upstream transitive packages:

| Package | Advisory | Reachability here |
|---|---|---|
| `immutable` (≤4.3.8) | DoS via hash collision / trie overflow | Decap's own state layer; client-side only, in an authenticated admin |
| `trim` (<0.0.3) | ReDoS | Pulled by the legacy `remark` chain in the markdown widget |
| `mdast-util-to-hast`, `remark-parse`, `remark-rehype` | inherit `trim` | Markdown widget rendering |

Important context: **this is not new risk introduced by self-hosting.** The
identical code was already executing in editors' browsers via unpkg — it was
simply invisible to tooling. Self-hosting made it auditable.

No fix is available without an upstream Decap release: every advisory resolves
to `decap-cms` itself, and `npm audit fix --force` would only downgrade to an
incompatible major. All are denial-of-service, client-side, and reachable only
by an authenticated editor at `/admin`. Re-check with `npm audit` on each
update and upgrade when upstream ships a fix.

## 6. Notes

- `/admin` is `noindex, nofollow` and excluded from the sitemap.
- The admin CSP allows `unsafe-eval` because Decap compiles its config schema
  at runtime. This applies **only** to `/admin`; the public-site CSP still
  forbids eval entirely. Since the runtime is local, the admin CSP no longer
  trusts `unpkg.com` in *any* directive.
- `backend.base_url` is injected from `window.location.origin` at runtime, so
  the same config works on production, previews, and localhost.
- Because publishing triggers a rebuild, an article goes live a few minutes
  after **Publish now** — not instantly.
