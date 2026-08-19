/**
 * Content & CMS-contract regression suite (Roadmap Task 2.2 — ARCH-M1 / M3 / M4,
 * SEO-M1 / M2).
 *
 * Codifies the invariants of the Markdown + Decap CMS content layer so the
 * one-off audit scripts are replaced by maintained repository tests. Guards:
 * collection counts (snapshot) and structural invariants (permanent); slug
 * format/uniqueness/filename-match/locale-parity; referenced media exists;
 * valid dates and non-conflicting order; a single H1 per page (no stray body
 * H1); internal links resolve; and the Decap CMS field set covers every field
 * the loaders read.
 *
 * Run with:  npm test
 */

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { expect, test } from "vitest";

import {
  getBlogPosts,
  getCapabilities,
  getCertifications,
  getMarkets,
  getPageContent,
  getProducts,
  getQualityProcesses,
  getSupplyChainSteps,
} from "@/lib/content";
import { loadCollection } from "@/lib/content/parse";
import { isKnownInternalPath } from "@/lib/content/internal-paths";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Kebab-case slug format enforced by the URL model and the CMS slug pattern. */
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Folder-style collections (pages are handled separately — keyed by slug). */
const FOLDER_COLLECTIONS = [
  "products",
  "markets",
  "certifications",
  "capabilities",
  "supply-chain",
  "quality-control",
  "blog",
] as const;

/**
 * Snapshot of the audited content volume (2026-08-17, 228 records / 100 URLs).
 *
 * This is NOT a permanent limit: add or remove content deliberately, then
 * update this one constant. The structural invariants below (parity, slug
 * format, uniqueness, filename match) are the guards that catch *accidental*
 * loss or drift at any volume.
 */
const BASELINE = {
  totalRecords: 228,
  perCollection: {
    products: 4,
    markets: 4,
    certifications: 6,
    capabilities: 8,
    "supply-chain": 9,
    "quality-control": 9,
    blog: 6,
    pages: 11,
  },
} as const;

/** Loads a folder collection as the common { slug, order } shape. */
function loadBySubdir(
  locale: Locale,
  subdir: string,
): Array<{ slug: string; order: number }> {
  const items =
    subdir === "products"
      ? getProducts(locale)
      : subdir === "markets"
        ? getMarkets(locale)
        : subdir === "certifications"
          ? getCertifications(locale)
          : subdir === "capabilities"
            ? getCapabilities(locale)
            : subdir === "supply-chain"
              ? getSupplyChainSteps(locale)
              : subdir === "quality-control"
                ? getQualityProcesses(locale)
                : subdir === "blog"
                  ? getBlogPosts(locale)
                  : [];
  return items as unknown as Array<{ slug: string; order: number }>;
}

function slugsFor(locale: Locale, subdir: string): string[] {
  return loadBySubdir(locale, subdir).map((item) => item.slug);
}

/** Enumerates page slugs from the filesystem (pages are loaded by slug). */
function pageSlugs(locale: Locale): string[] {
  const dir = path.join(CONTENT_DIR, locale, "pages");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

/** Recursively lists every content Markdown file. */
function allContentMarkdownFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (full.endsWith(".md")) out.push(full);
    }
  };
  walk(CONTENT_DIR);
  return out;
}

/* ── collection counts ──────────────────────────────────────────────────── */

test("the total record count matches the documented baseline", () => {
  let total = 0;
  for (const locale of locales) {
    for (const subdir of FOLDER_COLLECTIONS) {
      total += slugsFor(locale, subdir).length;
    }
    total += pageSlugs(locale).length;
  }
  expect(total, "update BASELINE.totalRecords when content is added/removed").toBe(
    BASELINE.totalRecords,
  );
});

test("every collection matches its per-locale count snapshot", () => {
  for (const locale of locales) {
    for (const subdir of FOLDER_COLLECTIONS) {
      expect(slugsFor(locale, subdir).length, `${locale}/${subdir}`).toBe(
        BASELINE.perCollection[subdir],
      );
    }
    expect(pageSlugs(locale).length, `${locale}/pages`).toBe(
      BASELINE.perCollection.pages,
    );
  }
});

/* ── locale parity / translation identity ───────────────────────────────── */

test("every collection has an identical slug set across all four locales", () => {
  for (const subdir of FOLDER_COLLECTIONS) {
    const reference = [...new Set(slugsFor("en", subdir))].sort();
    for (const locale of locales) {
      const slugs = slugsFor(locale, subdir);
      expect(new Set(slugs).size, `${subdir}/${locale}: duplicate slugs`).toBe(
        slugs.length,
      );
      expect([...new Set(slugs)].sort(), `${subdir}/${locale} must match en`).toEqual(
        reference,
      );
    }
  }
  // Pages are keyed by route slug; they must also be translated 1:1.
  const referencePages = [...new Set(pageSlugs("en"))].sort();
  for (const locale of locales) {
    expect([...new Set(pageSlugs(locale))].sort(), `pages/${locale}`).toEqual(
      referencePages,
    );
  }
});

/* ── no wrong-language fallback (Task 5.4 / SEO-M2) ───────────────────────── */

test("a missing locale collection does not fall back to English content", () => {
  // A collection that exists ONLY under en must resolve to an empty set for fa
  // (and ru/vi), never to the English records — so a missing translation
  // cannot be served under a false FA/RU/VI URL, canonical, or hreflang. The
  // probe is created and removed within this test (tests in a file run
  // sequentially), so it never perturbs the count/enumeration tests above.
  const probeDir = path.join(CONTENT_DIR, "en", "__fallback_probe__");
  fs.mkdirSync(probeDir, { recursive: true });
  try {
    fs.writeFileSync(
      path.join(probeDir, "probe.md"),
      "---\ntitle: Probe\nslug: probe\norder: 1\n---\nEnglish-only probe body.\n",
    );
    const validate = (raw: { data: Record<string, unknown> }) => ({
      slug: String(raw.data.slug),
      order: Number(raw.data.order),
    });
    const en = loadCollection("__fallback_probe__", "en", validate);
    const fa = loadCollection("__fallback_probe__", "fa", validate);
    expect(en).toHaveLength(1);
    expect(fa, "fa must not fall back to the English-only collection").toHaveLength(0);
  } finally {
    fs.rmSync(probeDir, { recursive: true, force: true });
  }
});

/* ── slug format ─────────────────────────────────────────────────────────── */

test("every slug is lowercase kebab-case", () => {
  for (const locale of locales) {
    for (const subdir of FOLDER_COLLECTIONS) {
      for (const slug of slugsFor(locale, subdir)) {
        expect(slug, `${locale}/${subdir}/${slug}`).toMatch(KEBAB);
      }
    }
    for (const slug of pageSlugs(locale)) {
      expect(slug, `${locale}/pages/${slug}`).toMatch(KEBAB);
    }
  }
});

/* ── filename ↔ slug ─────────────────────────────────────────────────────── */

test("each content file's filename matches its frontmatter slug", () => {
  for (const file of allContentMarkdownFiles()) {
    const base = path.basename(file, ".md");
    const { data } = matter(fs.readFileSync(file, "utf8"));
    expect(base, file).toBe(data.slug);
  }
});

/* ── media references resolve ─────────────────────────────────────────────── */

test("every referenced image path exists under public/", () => {
  const missing: string[] = [];
  const check = (ref: string, label: string) => {
    if (!ref) return;
    if (!fs.existsSync(path.join(PUBLIC_DIR, ref))) missing.push(`${label}: ${ref}`);
  };
  for (const locale of locales) {
    for (const product of getProducts(locale)) {
      check(product.image, `${locale}/products/${product.slug}`);
    }
    for (const market of getMarkets(locale)) {
      check(market.image, `${locale}/markets/${market.slug}`);
      check(market.panelImage, `${locale}/markets/${market.slug}#panel`);
    }
    for (const cert of getCertifications(locale)) {
      check(cert.image, `${locale}/certifications/${cert.slug}`);
    }
    for (const post of getBlogPosts(locale)) {
      check(post.image ?? "", `${locale}/blog/${post.slug}`);
    }
  }
  expect(missing, missing.join("\n")).toEqual([]);
});

/* ── SEO field lengths (Task 5.1) ──────────────────────────────────────────── */

test("optional SEO title/description fields stay within indexable limits", () => {
  // Soft regression guard: the optional `seoTitle`/`seoDescription` overrides
  // are meant to fit search result displays. Asserted in CI (not as a hard
  // build-time throw) so a legitimate one-character edit never blocks the
  // build, while accidental bloat is still caught.
  const over: string[] = [];
  for (const file of allContentMarkdownFiles()) {
    const { data } = matter(fs.readFileSync(file, "utf8"));
    const seoTitle = typeof data.seoTitle === "string" ? data.seoTitle : "";
    const seoDescription =
      typeof data.seoDescription === "string" ? data.seoDescription : "";
    if (seoTitle.length > 60) over.push(`${file}: seoTitle=${seoTitle.length}`);
    if (seoDescription.length > 160)
      over.push(`${file}: seoDescription=${seoDescription.length}`);
  }
  expect(over, over.join("\n")).toEqual([]);
});

/* ── dates & ordering ─────────────────────────────────────────────────────── */

test("blog dates are valid ISO calendar dates", () => {
  for (const locale of locales) {
    for (const post of getBlogPosts(locale)) {
      expect(post.date, `${locale}/blog/${post.slug}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(post.date)), `${locale}/blog/${post.slug}`).toBe(
        false,
      );
    }
  }
});

test("orders are unique within each collection and locale", () => {
  for (const locale of locales) {
    for (const subdir of FOLDER_COLLECTIONS) {
      const orders = loadBySubdir(locale, subdir).map((item) => item.order);
      expect(new Set(orders).size, `${locale}/${subdir}: conflicting orders`).toBe(
        orders.length,
      );
    }
  }
});

test("at most one market is flagged primary per locale (Task 5.5)", () => {
  // Market hierarchy is content-driven via the `primary` field, not a hardcoded
  // slug. At most one market may be primary so the presentation stays
  // unambiguous; exactly-zero is allowed (the page falls back to the first).
  for (const locale of locales) {
    const primaries = getMarkets(locale).filter((market) => market.primary);
    expect(primaries.length, `${locale}/markets: multiple primary markets`).toBeLessThanOrEqual(1);
  }
});

/* ── document outline: a single H1 (the title), bodies use ## ─────────────── */

test("no content body introduces a stray H1", () => {
  const bodies: Array<{ label: string; body: string }> = [];
  for (const locale of locales) {
    for (const product of getProducts(locale)) {
      if (product.body) bodies.push({ label: `${locale}/products/${product.slug}`, body: product.body });
    }
    for (const market of getMarkets(locale)) {
      if (market.body) bodies.push({ label: `${locale}/markets/${market.slug}`, body: market.body });
    }
    for (const post of getBlogPosts(locale)) {
      bodies.push({ label: `${locale}/blog/${post.slug}`, body: post.body });
    }
    for (const slug of pageSlugs(locale)) {
      const page = getPageContent(locale, slug);
      if (page?.body) bodies.push({ label: `${locale}/pages/${slug}`, body: page.body });
    }
  }
  for (const { label, body } of bodies) {
    // The page renders the title as the only H1; a body `#` would duplicate it.
    expect(body, `${label}: stray H1`).not.toMatch(/^# +/m);
  }
});

/* ── internal links resolve to real routes ────────────────────────────────── */

/** True when a locale-relative href points at a known route or record. */
function resolvesInternally(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return true; // external: not asserted here
  return isKnownInternalPath(href.split(/[?#]/)[0] ?? href);
}

test("every internal link in a body resolves to a real route or record", () => {
  // Markdown link syntax, excluding images (`![alt](src)`).
  const linkRe = /(?<!!)\[(?:[^\]]+)\]\(([^)]+)\)/g;
  const broken: string[] = [];
  for (const locale of locales) {
    const scan = (label: string, body: string) => {
      for (const match of body.matchAll(linkRe)) {
        const href = match[1].split(/\s+/)[0];
        if (!resolvesInternally(href)) broken.push(`${label}: ${href}`);
      }
    };
    for (const product of getProducts(locale)) {
      if (product.body) scan(`${locale}/products/${product.slug}`, product.body);
    }
    for (const market of getMarkets(locale)) {
      if (market.body) scan(`${locale}/markets/${market.slug}`, market.body);
    }
    for (const post of getBlogPosts(locale)) {
      scan(`${locale}/blog/${post.slug}`, post.body);
    }
    for (const slug of pageSlugs(locale)) {
      const page = getPageContent(locale, slug);
      if (page?.body) scan(`${locale}/pages/${slug}`, page.body);
    }
  }
  expect(broken, broken.join("\n")).toEqual([]);
});

/* ── Decap CMS field contract ─────────────────────────────────────────────── */
//
// For each collection the CMS must let editors set every field the loader
// reads, otherwise a real content field would be uneditable (ARCH-M3/M4). The
// config is validated section-by-section against the loader field set.

/**
 * Canonical loader field set per collection BASE. Task 5.2 emits each base once
 * per locale (`<base>_<locale>`), so every variant must expose exactly these
 * fields — editors can then manage any locale's content without Git. `blog`
 * includes `updated` (Task 5.7 dateModified) and no longer includes the
 * redundant `language` field (Task 5.1 — the folder is the source of truth).
 */
const EXPECTED_CMS_FIELDS: Record<string, readonly string[]> = {
  products: ["title", "slug", "description", "seoTitle", "seoDescription", "image", "imageAlt", "specs", "featured", "enabled", "order", "body"],
  certifications: ["title", "slug", "description", "image", "enabled", "order"],
  capabilities: ["title", "slug", "description", "icon", "enabled", "order"],
  markets: ["title", "heading", "slug", "description", "seoTitle", "seoDescription", "image", "imageAlt", "panelImage", "panelImageAlt", "primary", "region", "focus", "documents", "enabled", "order", "body"],
  supply_chain: ["title", "slug", "description", "icon", "enabled", "order"],
  quality_control: ["title", "slug", "description", "icon", "enabled", "order"],
  pages: ["title", "slug", "description", "seoTitle", "seoDescription", "updated", "body"],
  blog: [
    "title",
    "slug",
    "date",
    "updated",
    "author",
    "excerpt",
    "image",
    "imageAlt",
    "imageCaption",
    "category",
    "tags",
    "focusKeyphrase",
    "seoTitle",
    "seoDescription",
    "canonicalUrl",
    "ogTitle",
    "ogDescription",
    "ogImage",
    "ogImageAlt",
    "related",
    "enabled",
    "order",
    "body",
  ],
};

/** Every collection base is emitted once per locale (Task 5.2). */
const CMS_LOCALES = ["en", "fa", "ru", "vi"];
const cmsCollectionName = (base: string, locale: string) => `${base}_${locale}`;

/** Splits config.yml into one text block per collection (by `name`). */
function cmsCollectionSections(): Map<string, string> {
  const text = fs.readFileSync(
    path.join(process.cwd(), "public", "admin", "config.yml"),
    "utf8",
  );
  const sections = new Map<string, string>();
  const lines = text.split("\n");
  let seenCollections = false;
  let current: string | null = null;
  const buffer: string[] = [];
  const flush = () => {
    if (current) sections.set(current, buffer.join("\n"));
  };
  for (const line of lines) {
    if (/^collections:\s*$/.test(line)) seenCollections = true;
    const marker = line.match(/^  - name: "([^"]+)"/);
    if (seenCollections && marker) {
      flush();
      current = marker[1];
      buffer.length = 0;
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

/** True when `field` appears as a CMS field name (`name: field`) in `section`. */
function cmsDeclaresField(section: string, field: string): boolean {
  return new RegExp(`name:\\s+["']?${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?(?=[\\s,}])`).test(
    section,
  );
}

test("the Decap config defines every collection for every locale (Task 5.2)", () => {
  const sections = cmsCollectionSections();
  for (const base of Object.keys(EXPECTED_CMS_FIELDS)) {
    for (const locale of CMS_LOCALES) {
      const name = cmsCollectionName(base, locale);
      expect(sections.has(name), `CMS missing collection ${name}`).toBe(true);
    }
  }
});

test("every loader field is editable in every locale's Decap collection", () => {
  const sections = cmsCollectionSections();
  for (const [base, fields] of Object.entries(EXPECTED_CMS_FIELDS)) {
    for (const locale of CMS_LOCALES) {
      const name = cmsCollectionName(base, locale);
      const section = sections.get(name);
      expect(section, `CMS collection ${name} missing`).toBeDefined();
      for (const field of fields) {
        expect(
          cmsDeclaresField(section as string, field),
          `${name}: CMS does not declare field "${field}"`,
        ).toBe(true);
      }
    }
  }
});

test("the Blog quality widget is compact, localized, and strips itself on save", () => {
  const widget = fs.readFileSync(
    path.join(process.cwd(), "public", "admin", "blog-quality-widget.js"),
    "utf8",
  );
  expect(widget).toMatch(/SEO & Content Assistant/);
  expect(widget).toMatch(/دستیار سئو و محتوا/);
  expect(widget).toMatch(/امتیاز سئو و محتوا/);
  expect(widget).toMatch(/کلمه کلیدی اصلی/);
  expect(widget).toMatch(/مهم‌ترین اقدامات قبل از انتشار/);
  expect(widget).toMatch(/dir:\s*"rtl"/);
  expect(widget).toMatch(/role: "region"/);
  expect(widget).toMatch(/aria-expanded/);
  expect(widget).toMatch(/deleteIn\(\["data", "qualityAssistant"\]\)/);
  expect(widget).toMatch(/shouldComponentUpdate/);
  expect(widget).not.toMatch(/ranking score =/);
});

test("blog collections register the live content-quality widget", () => {
  const sections = cmsCollectionSections();
  for (const locale of CMS_LOCALES) {
    const section = sections.get(`blog_${locale}`);
    expect(section, `CMS blog_${locale} missing`).toBeDefined();
    expect(section).toMatch(/widget:\s*"blog-quality"/);
    expect(section).toMatch(/label:\s*"SEO & Content Assistant"/);
    expect(cmsDeclaresField(section as string, "qualityAssistant")).toBe(true);
    expect(
      EXPECTED_CMS_FIELDS.blog.includes("qualityAssistant"),
      "qualityAssistant is editor-only and must not become a loader field",
    ).toBe(false);
  }
});

test("the blog collections no longer carry the redundant language field (Task 5.1)", () => {
  const sections = cmsCollectionSections();
  for (const locale of CMS_LOCALES) {
    const section = sections.get(`blog_${locale}`);
    expect(section, `CMS blog_${locale} missing`).toBeDefined();
    // `language` was redundant — the collection folder already selects the
    // locale — and must not be re-added.
    expect(
      cmsDeclaresField(section as string, "language"),
      `blog_${locale}: redundant "language" field present`,
    ).toBe(false);
  }
});
