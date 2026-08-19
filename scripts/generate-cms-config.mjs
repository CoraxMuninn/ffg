#!/usr/bin/env node
/**
 * Generates `public/admin/config.yml` for Decap CMS (Roadmap Task 5.2 —
 * ARCH-M2, SEO-M4).
 *
 * Every content collection (products, markets, certifications, capabilities,
 * supply-chain, quality-control, pages, blog) is emitted once PER LOCALE so
 * translators can create/edit/unpublish localized content directly — not just
 * blog. Shared stable English slugs are kept (the folder determines the site
 * language; the slug is the cross-locale identity), and localized SEO/alt fields
 * are exposed on every collection that has them.
 *
 * Rather than hand-maintain ~2,500 lines of near-duplicated YAML, the field set
 * for each collection is defined ONCE (at column 0) and replicated + indented
 * across the four locales by this script (Roadmap: "reduce config duplication
 * through generation"). The generated file is committed; run with `--check`
 * (wired into `prebuild`) to fail CI if the committed file drifts.
 *
 * Two content/config corrections are baked in:
 *  - The blog `language` field is removed (redundant — the folder is the source
 *    of truth; Task 5.1).
 *  - Markets `focus`/`documents` use a plain string list, matching the existing
 *    content and the loader (a single-`field` list would store objects and
 *    break `parseStringList`).
 *
 * Also emits:
 *   - public/admin/internal-paths.json  (known site paths for link suggestions)
 *   - public/admin/blog-quality.js      (browser bundle of src/lib/seo/blog-quality.ts)
 *
 * Run:  node scripts/generate-cms-config.mjs         # write generated admin files
 *       node scripts/generate-cms-config.mjs --check # exit 1 if they would change
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(REPO_ROOT, "public", "admin", "config.yml");
const QUALITY_JS_PATH = path.join(REPO_ROOT, "public", "admin", "blog-quality.js");
const CATALOG_PATH = path.join(REPO_ROOT, "public", "admin", "internal-paths.json");
const QUALITY_TS_PATH = path.join(REPO_ROOT, "src", "lib", "seo", "blog-quality.ts");

/** Locale display metadata. `native` is used in the collection label suffix. */
const LOCALES = [
  { code: "en", native: "English" },
  { code: "fa", native: "فارسی (Persian)" },
  { code: "ru", native: "Русский (Russian)" },
  { code: "vi", native: "Tiếng Việt (Vietnamese)" },
];

const ICON_OPTIONS =
  "[package, shield-check, snowflake, ship, file-text, tag, search, handshake, factory, truck, thermometer, clipboard-check, globe, check-circle]";

/** Localized blog category options + default author byline. */
const BLOG_LOCALE = {
  en: {
    author: "Feiz Food Group Export Team",
    categories: ["Sourcing", "Quality Control", "Cold Chain", "Logistics", "Markets", "Documentation"],
  },
  fa: {
    author: "تیم صادرات Feiz Food Group",
    categories: ["تأمین و خرید", "کنترل کیفیت", "زنجیره سرد", "لجستیک", "بازارها", "مدارک"],
  },
  ru: {
    author: "Экспортная команда Feiz Food Group",
    categories: ["Закупки", "Контроль качества", "Холодовая цепь", "Логистика", "Рынки", "Документы"],
  },
  vi: {
    author: "Đội ngũ xuất khẩu Feiz Food Group",
    categories: ["Nguồn hàng", "Kiểm soát chất lượng", "Chuỗi lạnh", "Logistics", "Thị trường", "Chứng từ"],
  },
};

/** Indents every line of a block by `n` spaces. Field blocks are authored at
 *  column 0 and indented to sit under their parent (`fields:`) at render time. */
function indent(block, n) {
  const pad = " ".repeat(n);
  return block
    .replace(/^\n+/, "")
    .replace(/\n+$/, "")
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

/* ── Field blocks (authored at column 0; identical across locales) ────────── */

const PRODUCTS_FIELDS = `
- { label: "Title", name: "title", widget: "string", required: true }
- { label: "Slug", name: "slug", widget: "string", hint: "Stable English slug, shared across locales.", required: true }
- { label: "Description", name: "description", widget: "string" }
- { label: "SEO title", name: "seoTitle", widget: "string", required: false, hint: "Search title without the brand suffix. Keep the visible product title concise." }
- { label: "SEO description", name: "seoDescription", widget: "text", required: false }
- { label: "Image", name: "image", widget: "image", required: false }
- { label: "Image alt text", name: "imageAlt", widget: "string", required: false, hint: "Describe only what is visibly shown; do not add keywords that are not in the image." }
- { label: "Featured", name: "featured", widget: "boolean", default: false }
- { label: "Enabled", name: "enabled", widget: "boolean", default: true }
- { label: "Order", name: "order", widget: "number", default: 1 }
- label: "Specifications"
  name: "specs"
  widget: "list"
  required: false
  fields:
    - { label: "Label", name: "label", widget: "string" }
    - { label: "Value", name: "value", widget: "string" }
- { label: "Body", name: "body", widget: "markdown", required: false }
`;

const CERTIFICATIONS_FIELDS = `
- { label: "Title", name: "title", widget: "string", required: true }
- { label: "Slug", name: "slug", widget: "string", required: true }
- { label: "Description", name: "description", widget: "string" }
- { label: "Logo", name: "image", widget: "image", required: false }
- { label: "Enabled", name: "enabled", widget: "boolean", default: true }
- { label: "Order", name: "order", widget: "number", default: 1 }
`;

function iconFields() {
  return `
- { label: "Title", name: "title", widget: "string", required: true }
- { label: "Slug", name: "slug", widget: "string", required: true }
- { label: "Description", name: "description", widget: "text" }
- { label: "Icon", name: "icon", widget: "select", options: ${ICON_OPTIONS} }
- { label: "Enabled", name: "enabled", widget: "boolean", default: true }
- { label: "Order", name: "order", widget: "number", default: 1 }
`;
}

const MARKETS_FIELDS = `
- { label: "Country", name: "title", widget: "string", required: true, hint: "Short label used in cards (e.g. Vietnam)." }
- { label: "Detail-page H1", name: "heading", widget: "string", required: false, hint: "Human search-intent heading for the market page; falls back to the country label." }
- { label: "Slug", name: "slug", widget: "string", required: true }
- { label: "Description", name: "description", widget: "string" }
- { label: "SEO title", name: "seoTitle", widget: "string", required: false }
- { label: "SEO description", name: "seoDescription", widget: "text", required: false }
- { label: "Image", name: "image", widget: "image", required: false, hint: "Card image used in the homepage markets grid." }
- { label: "Image alt text", name: "imageAlt", widget: "string", required: false }
- { label: "Panel image (Markets page)", name: "panelImage", widget: "image", required: false, hint: "Wide landscape image for the Markets page panel. Falls back to the card image when empty." }
- { label: "Panel image alt text", name: "panelImageAlt", widget: "string", required: false }
- { label: "Primary Market", name: "primary", widget: "boolean", default: false }
- { label: "Region", name: "region", widget: "string", required: false, hint: "Geographic region label, e.g. Southeast Asia." }
- label: "Buyer focus"
  name: "focus"
  widget: "list"
  required: false
  default: []
  hint: "What buyers in this market typically evaluate. Short phrases — never volumes, prices, or customer names."
- label: "Documents in scope"
  name: "documents"
  widget: "list"
  required: false
  default: []
  hint: "Document TYPES normally requested for this destination. Never certificate numbers or issuing bodies."
- { label: "Enabled", name: "enabled", widget: "boolean", default: true }
- { label: "Order", name: "order", widget: "number", default: 1 }
- { label: "Body", name: "body", widget: "markdown", required: false }
`;

const PAGES_FIELDS = `
- { label: "Title", name: "title", widget: "string", required: true }
- { label: "Slug", name: "slug", widget: "string", required: true }
- { label: "Description", name: "description", widget: "string" }
- { label: "SEO title", name: "seoTitle", widget: "string", required: false, hint: "Search title without the brand suffix; may differ from the visible H1." }
- { label: "SEO description", name: "seoDescription", widget: "text", required: false }
- { label: "Last updated", name: "updated", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false, required: false, hint: "Shown as the revision date on legal pages (privacy, terms). Leave empty on other pages." }
- { label: "Body", name: "body", widget: "markdown", required: false }
`;

function blogFields(localeCode) {
  const { author, categories } = BLOG_LOCALE[localeCode];
  const categoryLines = categories.map((c) => `    - "${c}"`).join("\n");
  // No `language` field (Task 5.1): the folder is the source of truth.
  return `
- label: "SEO & Content Assistant"
  name: "qualityAssistant"
  widget: "blog-quality"
  required: false
  hint: "Live Persian SEO & content panel at the top of every blog article editor. The score is an editorial heuristic, not a Google ranking score. Required items match the site build contract. Recommendations never block saving. Not shown on the Collections dashboard — open New Article or an existing article."
- label: "Title"
  name: "title"
  widget: "string"
  required: true
  hint: "Article headline. Rendered as the only page H1. Do not start the body with #."
- label: "Slug"
  name: "slug"
  widget: "string"
  required: true
  pattern: ["^[a-z0-9]+(?:-[a-z0-9]+)*$", "Lowercase letters, numbers and hyphens only (e.g. sourcing-frozen-chicken-feet)."]
  hint: "Shared English URL segment: /${localeCode}/blog/<slug>. Keep it identical across locales. Changing it changes the article URL."
- label: "Publication date"
  name: "date"
  widget: "datetime"
  date_format: "YYYY-MM-DD"
  time_format: false
  picker_utc: true
  required: true
  hint: "Shown on the article. Used as datePublished and as sitemap lastmod when there is no revision date."
- label: "Revision date"
  name: "updated"
  widget: "datetime"
  date_format: "YYYY-MM-DD"
  time_format: false
  picker_utc: true
  required: false
  hint: "Optional. Must be on or after the publication date. Used as dateModified, Open Graph modifiedTime, and sitemap lastmod."
- label: "Author"
  name: "author"
  widget: "string"
  required: false
  default: "${author}"
  hint: "Team or organization byline only. Do not invent a named person."
- label: "Excerpt / summary"
  name: "excerpt"
  widget: "text"
  required: true
  hint: "1–2 sentences for the listing card. Also the meta description when SEO description is empty."
- label: "Featured image"
  name: "image"
  widget: "image"
  required: true
  media_folder: "/public/media/blog"
  public_folder: "/media/blog"
  choose_url: false
  hint: "Required. Wide landscape (≥1600px). Used on the article, listing, and as the default social image."
- label: "Featured image alt text"
  name: "imageAlt"
  widget: "string"
  required: true
  hint: "Required. Describe what the image shows in the article language. Do not stuff keywords that are not visible."
- label: "Featured image caption"
  name: "imageCaption"
  widget: "string"
  required: false
  hint: "Optional visible caption under the featured image. Leave empty if the image needs no caption."
- label: "Category"
  name: "category"
  widget: "select"
  required: false
  options:
${categoryLines}
- label: "SEO keywords / tags"
  name: "tags"
  widget: "list"
  required: false
  default: []
  hint: "Optional keywords the article actually covers. Press Enter after each tag. Used as schema keywords."
- label: "Focus keyphrase"
  name: "focusKeyphrase"
  widget: "string"
  required: false
  pattern: ["^$|^.{2,80}$", "Keep the focus keyphrase between 2 and 80 characters, or leave it empty."]
  hint: "Optional editorial target phrase (e.g. frozen chicken feet specification). Not shown on the page. Folded into structured-data keywords when set."
- label: "SEO title"
  name: "seoTitle"
  widget: "string"
  required: false
  pattern: ["^$|^.{10,60}$", "SEO title should be 10–60 characters, or left empty to use the article title."]
  hint: "Search-result title without the brand suffix. Leave empty to use the article title. Aim for ~50–60 characters."
- label: "Meta description"
  name: "seoDescription"
  widget: "text"
  required: false
  pattern: ["^$|^.{70,160}$", "Meta description should be 70–160 characters, or left empty to use the excerpt."]
  hint: "Search-result snippet. Leave empty to use the excerpt. Aim for ~150–160 characters."
- label: "Canonical URL"
  name: "canonicalUrl"
  widget: "string"
  required: false
  pattern: ["^$|^https://.+$", "Must be an absolute https URL, or left empty to use this article URL."]
  hint: "Leave empty unless this article is a syndicated copy or an explicit duplicate. Empty = this locale URL is canonical. Hreflang is still generated for real translations."
- label: "OG title"
  name: "ogTitle"
  widget: "string"
  required: false
  hint: "Optional social title. Leave empty to reuse the SEO title (or the article title)."
- label: "OG description"
  name: "ogDescription"
  widget: "text"
  required: false
  hint: "Optional social description. Leave empty to reuse the meta description (or the excerpt)."
- label: "OG / Twitter image"
  name: "ogImage"
  widget: "image"
  required: false
  media_folder: "/public/media/blog"
  public_folder: "/media/blog"
  choose_url: false
  hint: "Optional. Leave empty to reuse the featured image. Use a 1200×630 crop when the featured image is not social-shaped."
- label: "OG / Twitter image alt"
  name: "ogImageAlt"
  widget: "string"
  required: false
  hint: "Optional. Leave empty to reuse the featured-image alt text."
- label: "Related internal pages"
  name: "related"
  widget: "list"
  required: false
  default: []
  hint: "Existing root-relative paths only — no locale prefix, no invented URLs. Examples: /products/frozen-chicken-feet, /quality-control, /markets/vietnam, /contact, /blog/iqf-versus-block-frozen-poultry. Unknown paths fail the build."
- label: "Published"
  name: "enabled"
  widget: "boolean"
  default: true
  hint: "Off hides the article from the site, sitemap, and listing without deleting it."
- label: "Order"
  name: "order"
  widget: "number"
  default: 1
  value_type: "int"
  hint: "Lower numbers appear first in the listing."
- label: "Article body"
  name: "body"
  widget: "markdown"
  required: true
  buttons:
    - bold
    - italic
    - link
    - heading-two
    - heading-three
    - quote
    - bulleted-list
    - numbered-list
  editor_components:
    - image
  hint: "Write in the article language. The title is the H1 — start sections with Heading 2, then Heading 3. Link to existing pages with root-relative paths (/products/frozen-chicken-feet, /quality-control, /contact). Insert images via the + menu; they upload to /media/blog. Do not invent URLs, certifications, prices, or customer names."
`;
}

/* ── Collection definitions ──────────────────────────────────────────────── */

const COLLECTIONS = [
  {
    base: "products",
    subdir: "products",
    label: "Products",
    singular: "Product",
    desc: "Frozen poultry products exported by Feiz Food Group.",
    fields: PRODUCTS_FIELDS,
  },
  {
    base: "certifications",
    subdir: "certifications",
    label: "Certifications",
    singular: "Certification",
    desc: "Certifications and compliance standards.",
    fields: CERTIFICATIONS_FIELDS,
  },
  {
    base: "capabilities",
    subdir: "capabilities",
    label: "Trust / Capabilities",
    singular: "Capability",
    desc: "Business trust and capability features (distinct from certifications).",
    fields: iconFields(),
  },
  {
    base: "markets",
    subdir: "markets",
    label: "Markets",
    singular: "Market",
    desc: "Commercial focus markets used by the Markets listing and localized detail pages.",
    fields: MARKETS_FIELDS,
  },
  {
    base: "supply_chain",
    subdir: "supply-chain",
    label: "Supply Chain",
    singular: "Supply Chain Step",
    desc: "Steps of the export supply chain, in order.",
    fields: iconFields(),
  },
  {
    base: "quality_control",
    subdir: "quality-control",
    label: "Quality Control",
    singular: "Quality Process",
    desc: "Quality-control processes, in order.",
    fields: iconFields(),
  },
  {
    base: "pages",
    subdir: "pages",
    label: "Pages",
    singular: "Page",
    desc: "CMS-managed page content.",
    fields: PAGES_FIELDS,
  },
  // Blog is rendered with its own richer block (sortable fields, view filters).
  { base: "blog", blog: true },
];

function renderCollection(coll, locale) {
  if (coll.blog) return renderBlogCollection(locale);
  const folder = `content/${locale.code}/${coll.subdir}`;
  const name = `${coll.base}_${locale.code}`;
  const label = `${coll.label} — ${locale.native}`;
  const description = `${coll.desc} Saved to ${folder}/ and published at /${locale.code}/.`;
  return (
    `  - name: "${name}"\n` +
    `    label: "${label}"\n` +
    `    label_singular: "${coll.singular}"\n` +
    `    description: >-\n      ${description}\n` +
    `    folder: "${folder}"\n` +
    `    create: true\n` +
    `    slug: "{{slug}}"\n` +
    `    identifier_field: slug\n` +
    `    fields:\n` +
    indent(coll.fields, 6) +
    "\n"
  );
}

function renderBlogCollection(locale) {
  const folder = `content/${locale.code}/blog`;
  const name = `blog_${locale.code}`;
  const label = `Blog — ${locale.native}`;
  const description = `Blog articles for the ${locale.native} site (${locale.code}). Saved to ${folder}/ and published at /${locale.code}/blog/<slug>.`;
  return (
    `  - name: "${name}"\n` +
    `    label: "${label}"\n` +
    `    label_singular: "Article"\n` +
    `    description: >-\n      ${description}\n` +
    `    folder: "${folder}"\n` +
    `    create: true\n` +
    `    delete: true\n` +
    `    slug: "{{slug}}"\n` +
    `    identifier_field: slug\n` +
    `    summary: "{{title}}  —  {{date}}"\n` +
    `    sortable_fields: ["date", "order", "title"]\n` +
    `    view_filters:\n` +
    `      - label: "Published"\n        field: enabled\n        pattern: true\n` +
    `      - label: "Hidden"\n        field: enabled\n        pattern: false\n` +
    `    editor:\n      preview: false\n` +
    `    fields:\n` +
    indent(blogFields(locale.code), 6) +
    "\n"
  );
}

/* ── Assemble ────────────────────────────────────────────────────────────── */

const HEADER = `# !! GENERATED FILE — do not edit by hand. !!
# Regenerate with:  node scripts/generate-cms-config.mjs
# Source of truth: scripts/generate-cms-config.mjs (Roadmap Task 5.2).
#
# Every collection below is emitted once per locale so editors can manage all
# four locales (en/fa/ru/vi) directly in Decap, not just blog. Shared stable
# English slugs remain the cross-locale identity; the folder selects the locale.

backend:
  name: github
  repo: CoraxMuninn/ffg
  branch: master
  # \`base_url\` must point at the OAuth BROKER, not the GitHub API — pointing it
  # at api.github.com (the previous value) can never authenticate, because
  # GitHub has no such endpoint. This app hosts its own broker
  # (src/app/api/auth + /api/callback) so the client secret stays server-side.
  #
  # It is injected at runtime by public/admin/index.html from
  # \`window.location.origin\`, so the same config works on production, on
  # Vercel preview URLs, and on localhost without edits. Decap requests
  # \`<base_url>/<auth_endpoint>\`.
  auth_endpoint: api/auth
  # Least-privilege authorization (audit SEC-M3). Decap would otherwise ask for
  # \`repo\`, which covers every repository the editor can reach — including
  # unrelated private ones. This repository is public, and \`public_repo\` is the
  # narrowest scope that still allows the CMS to write to it.
  #
  # The broker (src/app/api/auth) is the real enforcement point: it always
  # sends its own OAUTH_SCOPE to GitHub and ignores whatever the browser asks
  # for, so a tampered client cannot request more. This line keeps the client's
  # request consistent with what the broker actually sends.
  auth_scope: public_repo
  # Commit messages written to the content repository by the CMS.
  commit_messages:
    create: "content({{collection}}): create {{slug}}"
    update: "content({{collection}}): update {{slug}}"
    delete: "content({{collection}}): delete {{slug}}"
    uploadMedia: "content(media): upload {{path}}"
    deleteMedia: "content(media): delete {{path}}"

# Draft → In review → Ready workflow. Saving a post creates a pull request
# instead of committing to \`master\`, so nothing reaches the live site until
# it is explicitly published from the Workflow tab.
publish_mode: editorial_workflow

# Uploads land in public/media/... and are referenced as /media/... which is
# exactly what the Next.js <Image> components already expect.
media_folder: "public/media"
public_folder: "/media"

collections:
`;

function buildConfig() {
  let out = HEADER;
  for (const coll of COLLECTIONS) {
    for (const locale of LOCALES) {
      out += renderCollection(coll, locale);
    }
  }
  return out.endsWith("\n") ? out : out + "\n";
}

const STATIC_CATALOG = [
  { path: "/", title: "Home", collection: "pages" },
  { path: "/products", title: "Products", collection: "pages" },
  { path: "/markets", title: "Markets", collection: "pages" },
  { path: "/about", title: "About", collection: "pages" },
  { path: "/quality-control", title: "Quality control", collection: "pages" },
  { path: "/supply-chain", title: "Supply chain", collection: "pages" },
  { path: "/certifications", title: "Certifications", collection: "pages" },
  { path: "/contact", title: "Contact", collection: "pages" },
  { path: "/blog", title: "Blog", collection: "pages" },
  { path: "/privacy", title: "Privacy", collection: "pages" },
  { path: "/terms", title: "Terms", collection: "pages" },
];

function frontmatterField(source, key) {
  const quoted = source.match(new RegExp(`^${key}:\\s*"([^"]*)"`, "m"));
  if (quoted) return quoted[1].trim();
  const plain = source.match(new RegExp(`^${key}:\\s*(\\S+)`, "m"));
  return plain ? plain[1].trim() : "";
}

function buildInternalCatalog() {
  const items = [...STATIC_CATALOG];
  const collections = [
    { dir: "products", prefix: "/products", name: "products" },
    { dir: "markets", prefix: "/markets", name: "markets" },
    { dir: "blog", prefix: "/blog", name: "blog" },
  ];
  for (const collection of collections) {
    const folder = path.join(REPO_ROOT, "content", "en", collection.dir);
    if (!fs.existsSync(folder)) continue;
    for (const file of fs.readdirSync(folder).filter((name) => name.endsWith(".md")).sort()) {
      const source = fs.readFileSync(path.join(folder, file), "utf8");
      const slug = frontmatterField(source, "slug") || file.replace(/\.md$/, "");
      const title = frontmatterField(source, "title") || slug;
      items.push({ path: `${collection.prefix}/${slug}`, title, collection: collection.name });
    }
  }
  items.sort((a, b) => a.path.localeCompare(b.path));
  return `${JSON.stringify({ paths: items }, null, 2)}\n`;
}

function buildQualityBrowserBundle() {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    throw new Error("typescript is required to emit public/admin/blog-quality.js");
  }
  const source = fs.readFileSync(QUALITY_TS_PATH, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
      strict: true,
    },
    fileName: "blog-quality.ts",
    reportDiagnostics: true,
  });
  if (!result.outputText || !result.outputText.includes("function analyzeBlogQuality")) {
    throw new Error("blog-quality.ts transpile produced no analyzer");
  }
  const body = result.outputText
    .replace(/^export \{[^}]*\};?\s*$/gm, "")
    .replace(/^export /gm, "");
  return (
    "/* !! GENERATED FILE — do not edit by hand. !! */\n" +
    "/* Source of truth: src/lib/seo/blog-quality.ts */\n" +
    "/* Regenerated by scripts/generate-cms-config.mjs */\n" +
    "window.BlogQuality = (function () {\n" +
    body +
    "\n  return {\n" +
    "    analyzeBlogQuality: analyzeBlogQuality,\n" +
    "    collectPublishBlockers: collectPublishBlockers,\n" +
    "    suggestInternalLinks: suggestInternalLinks,\n" +
    "  };\n" +
    "})();\n"
  );
}

const generated = buildConfig();
const catalog = buildInternalCatalog();
const qualityJs = buildQualityBrowserBundle();
const check = process.argv.includes("--check");

if (check) {
  let ok = true;
  const compare = (filePath, contents, label) => {
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    if (existing === contents) {
      console.log(`✓ ${label} is up to date.`);
      return;
    }
    console.error(`✖ ${label} is out of date.\n  Run: node scripts/generate-cms-config.mjs`);
    ok = false;
  };
  compare(OUT_PATH, generated, "public/admin/config.yml");
  compare(CATALOG_PATH, catalog, "public/admin/internal-paths.json");
  compare(QUALITY_JS_PATH, qualityJs, "public/admin/blog-quality.js");
  if (!ok) process.exit(1);
} else {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, generated);
  fs.writeFileSync(CATALOG_PATH, catalog);
  fs.writeFileSync(QUALITY_JS_PATH, qualityJs);
  console.log(`✓ wrote ${path.relative(REPO_ROOT, OUT_PATH)}`);
  console.log(`✓ wrote ${path.relative(REPO_ROOT, CATALOG_PATH)}`);
  console.log(`✓ wrote ${path.relative(REPO_ROOT, QUALITY_JS_PATH)}`);
}
