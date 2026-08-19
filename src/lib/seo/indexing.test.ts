/**
 * Routing / SEO indexing regression suite (Roadmap Task 2.2 — SEO-M1 / M2,
 * ARCH-M1).
 *
 * Exercises the real `sitemap.ts`, `robots.ts`, and `metadata.ts` against the
 * live content so the 100 indexable URLs, their canonical/hreflang alternates,
 * the robots policy, and the structured-data shapes stay correct as content
 * evolves.
 *
 * Run with:  npm test
 */

import { expect, test } from "vitest";

import robotsFn from "@/app/robots";
import sitemapFn from "@/app/sitemap";
import type { BlogPost } from "@/lib/content";
import { getBlogPosts, getMarkets, getProducts } from "@/lib/content";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/seo/config";
import { buildAlternates, buildPageMetadata } from "@/lib/seo/metadata";
import {
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
  webSiteSchema,
} from "@/lib/seo/schema";

const sitemap = sitemapFn();

/** Splits `${SITE_URL}/${locale}${path}` back into its locale and path. */
function localeAndPath(url: string): { locale: Locale; path: string } {
  const withoutSite = url.slice(SITE_URL.length); // "/en/products/x"
  const parts = withoutSite.split("/"); // ["", "en", "products", "x"]
  const locale = parts[1] as Locale;
  const rest = parts.slice(2).join("/"); // "products/x"
  return { locale, path: rest ? `/${rest}` : "" };
}

/* ── sitemap ─────────────────────────────────────────────────────────────── */

test("sitemap covers exactly the documented URL baseline (100)", () => {
  // Snapshot of the audited indexable surface. Update intentionally alongside
  // BASELINE in content.contract.test.ts when content/routes are added.
  expect(sitemap.length).toBe(100);
});

test("every sitemap URL is an https site URL under a locale prefix", () => {
  for (const entry of sitemap) {
    expect(entry.url.startsWith(`${SITE_URL}/`)).toBe(true);
    const { locale } = localeAndPath(entry.url);
    expect((locales as readonly string[]).includes(locale)).toBe(true);
    expect(entry.url.startsWith("https://")).toBe(true);
  }
});

test("sitemap URLs are unique", () => {
  const urls = sitemap.map((entry) => entry.url);
  expect(new Set(urls).size).toBe(urls.length);
});

test("sitemap excludes API, admin, and other non-public routes", () => {
  for (const entry of sitemap) {
    expect(entry.url).not.toMatch(/\/(api|admin|_next)\b/);
  }
});

test("sitemap includes every product, market, and blog detail per locale", () => {
  const urls = new Set(sitemap.map((entry) => entry.url));
  for (const locale of locales) {
    for (const product of getProducts(locale)) {
      expect(urls.has(`${SITE_URL}/${locale}/products/${product.slug}`)).toBe(true);
    }
    for (const market of getMarkets(locale)) {
      expect(urls.has(`${SITE_URL}/${locale}/markets/${market.slug}`)).toBe(true);
    }
    for (const post of getBlogPosts(locale)) {
      expect(urls.has(`${SITE_URL}/${locale}/blog/${post.slug}`)).toBe(true);
    }
  }
});

test("every sitemap entry declares hreflang for all locales plus x-default", () => {
  for (const entry of sitemap) {
    const { path } = localeAndPath(entry.url);
    const languages = entry.alternates?.languages ?? {};
    for (const locale of locales) {
      expect(languages[locale], `${entry.url} → ${locale}`).toBe(
        `${SITE_URL}/${locale}${path}`,
      );
    }
    expect(languages["x-default"]).toBe(`${SITE_URL}/en${path}`);
  }
});

/* ── robots ───────────────────────────────────────────────────────────────── */

const robots = robotsFn();

function asArray(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

test("robots allows public crawling and blocks API/admin", () => {
  // `rules` is a single rule or an array; normalize before indexing.
  const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
  expect(asArray(rule?.allow)).toContain("/");
  expect(asArray(rule?.disallow)).toContain("/api/");
  expect(asArray(rule?.disallow)).toContain("/admin/");
});

test("robots declares the sitemap URL", () => {
  expect(robots.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
});

/* ── metadata: canonical + hreflang ───────────────────────────────────────── */

test("buildAlternates emits a canonical plus four locale hreflang and x-default", () => {
  const alt = buildAlternates("fa", "/products");
  expect(alt.canonical).toBe(`${SITE_URL}/fa/products`);
  for (const locale of locales) {
    expect(alt.languages[locale]).toBe(`${SITE_URL}/${locale}/products`);
  }
  expect(alt.languages["x-default"]).toBe(`${SITE_URL}/en/products`);
});

test("buildAlternates emits hreflang only for available counterparts (Task 5.3)", () => {
  // A partial translation cluster (English + fa only): hreflang must list
  // exactly those two plus x-default, and must NOT advertise the missing
  // ru/vi translations (which would point at 404s or wrong-language content).
  const partial = buildAlternates("en", "/products/x", ["en", "fa"]);
  expect(Object.keys(partial.languages).sort()).toEqual(["en", "fa", "x-default"]);
  expect(partial.languages["en"]).toBe(`${SITE_URL}/en/products/x`);
  expect(partial.languages["fa"]).toBe(`${SITE_URL}/fa/products/x`);
  expect(partial.languages["x-default"]).toBe(`${SITE_URL}/en/products/x`);
  expect(partial.languages["ru"]).toBeUndefined();
  expect(partial.languages["vi"]).toBeUndefined();
});

test("buildAlternates x-default follows the default locale when available", () => {
  // When the default locale (en) is absent from the cluster, x-default points
  // at the first available locale rather than a non-existent English page.
  const noEnglish = buildAlternates("fa", "/blog/x", ["fa", "ru"]);
  expect(noEnglish.languages["x-default"]).toBe(`${SITE_URL}/fa/blog/x`);
});

test("buildPageMetadata produces indexable metadata with OG and twitter", () => {
  const md = buildPageMetadata({
    locale: "en",
    title: "About",
    description: "Company background",
    path: "/about",
  });
  expect(md.title).toBe("About");
  expect(md.description).toBe("Company background");
  expect(md.alternates?.canonical).toBe(`${SITE_URL}/en/about`);
  // `robots` is the object form for indexable pages (string form would mean
  // "noindex"/etc.), so narrow before reading its flags.
  const robotsMeta =
    typeof md.robots === "object" && md.robots !== null ? md.robots : null;
  expect(robotsMeta?.index).toBe(true);
  expect(robotsMeta?.follow).toBe(true);
  expect(md.openGraph?.url).toBe(`${SITE_URL}/en/about`);
  // `card` exists only on the typed card variants, not the base TwitterMetadata.
  expect(md.twitter && "card" in md.twitter ? md.twitter.card : undefined).toBe(
    "summary_large_image",
  );
});

test("sitemap URLs and metadata canonicals are reciprocal", () => {
  // Every sitemap URL must equal the canonical buildAlternates would produce
  // for the same locale/path, so the two never disagree.
  for (const entry of sitemap) {
    const { locale, path } = localeAndPath(entry.url);
    expect(buildAlternates(locale, path).canonical).toBe(entry.url);
  }
});

/* ── JSON-LD shapes ───────────────────────────────────────────────────────── */

test("organization, website, and breadcrumb schemas are valid JSON-LD", () => {
  const org = organizationSchema("en", "Frozen poultry exporter");
  expect(org["@context"]).toBe("https://schema.org");
  expect(org["@type"]).toBe("Organization");
  expect(org.name).toBeTruthy();
  expect(org.url).toBe(SITE_URL);

  const site = webSiteSchema("fa");
  expect(site["@type"]).toBe("WebSite");
  expect(site.inLanguage).toBe("fa");

  const crumbs = breadcrumbSchema("en", [
    { name: "Home", path: "" },
    { name: "Products", path: "/products" },
  ]);
  expect(crumbs["@type"]).toBe("BreadcrumbList");
  expect(crumbs.itemListElement).toHaveLength(2);
  expect((crumbs.itemListElement as Array<{ position: number }>)[0].position).toBe(1);
});

test("articleSchema serializes a blog post and makes no origin claims", () => {
  const post: BlogPost = {
    title: "IQF vs Block-Frozen Poultry",
    slug: "iqf-versus-block-frozen-poultry",
    excerpt: "How freezing affects sampling and repacking.",
    author: "Feiz Food Group Export Team",
    date: "2026-07-30",
    image: "/media/blog/example.jpg",
    imageAlt: "Open cartons of frozen poultry",
    category: "Sourcing",
    tags: ["IQF poultry"],
    related: [],
    enabled: true,
    order: 1,
    body: "Article body.",
  };
  const article = articleSchema("en", post);
  expect(article["@type"]).toBe("BlogPosting");
  expect(article.datePublished).toBe("2026-07-30");
  // Must round-trip through JSON (no undefined leaking, no cycles).
  expect(() => JSON.parse(JSON.stringify(article))).not.toThrow();
  // SEO-M3 policy extends here too: no brand/manufacturer substitution.
  expect("brand" in article).toBe(false);
  expect("manufacturer" in article).toBe(false);
});
