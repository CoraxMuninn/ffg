import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/seo/config";
import { buildAlternates } from "@/lib/seo/hreflang";
import {
  getBlogPosts,
  getMarkets,
  getPageContent,
  getProducts,
  localesWithBlogPost,
  localesWithMarket,
  localesWithProduct,
} from "@/lib/content";

/**
 * Generates the sitemap for all indexable pages across all locales.
 *
 * Only public, indexable routes are included — no API, admin, or error routes.
 * Product/market/blog slugs are derived from the CMS content, so the sitemap
 * stays in sync with the actual content.
 *
 * Canonical + hreflang come from the single counterpart-aware helper
 * (`buildAlternates`, Task 5.3): a detail URL declares alternates only for the
 * locales whose content actually carries that slug, so hreflang never targets a
 * 404. `lastModified` is content-driven (blog publication/revision dates and
 * legal-page revision dates); static commercial pages carry no synthetic date
 * (Task 5.7 / SEO-L2). Synthetic `priority`/`changeFrequency` are intentionally
 * omitted — they were never maintained and search engines ignore them.
 */

/** Legal/page routes that carry an editorial revision date in the CMS. */
const DATED_PAGE_ROUTES = new Set(["/privacy", "/terms"]);

// Static public routes shared by every locale (stable English path segments).
// Priority is omitted (search engines ignore it; see Task 5.7).
const STATIC_ROUTES = [
  "",
  "/products",
  "/about",
  "/quality-control",
  "/supply-chain",
  "/certifications",
  "/markets",
  "/contact",
  "/blog",
  "/privacy",
  "/terms",
] as const;

/** ISO date → Date, or undefined when absent/invalid. */
function parseDate(value: string | undefined): Date | undefined {
  if (!value || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales as readonly Locale[]) {
    for (const path of STATIC_ROUTES) {
      const lastModified = DATED_PAGE_ROUTES.has(path)
        ? parseDate(getPageContent(locale, path.slice(1))?.updated)
        : undefined;
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        alternates: { languages: buildAlternates(locale, path).languages },
        ...(lastModified ? { lastModified } : {}),
      });
    }

    for (const product of getProducts(locale)) {
      const path = `/products/${product.slug}`;
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        alternates: {
          languages: buildAlternates(locale, path, localesWithProduct(product.slug)).languages,
        },
      });
    }

    for (const market of getMarkets(locale)) {
      const path = `/markets/${market.slug}`;
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        alternates: {
          languages: buildAlternates(locale, path, localesWithMarket(market.slug)).languages,
        },
      });
    }

    for (const post of getBlogPosts(locale)) {
      const path = `/blog/${post.slug}`;
      const lastModified = parseDate(post.updated ?? post.date);
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        alternates: {
          languages: buildAlternates(locale, path, localesWithBlogPost(post.slug)).languages,
        },
        ...(lastModified ? { lastModified } : {}),
      });
    }
  }

  return entries;
}
