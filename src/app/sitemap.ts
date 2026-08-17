import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/seo/config";
import { getBlogPosts, getMarkets, getProducts } from "@/lib/content";

/**
 * Generates the sitemap for all indexable pages across all locales.
 *
 * Only public, indexable routes are included — no API, admin, or error routes.
 * Product slugs and blog slugs are derived from the CMS content, so the sitemap
 * stays in sync with the actual content.
 */

/** Every sitemap URL carries the same alternates as its HTML `<head>`. */
function localizedAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])
    ),
    "x-default": `${SITE_URL}/en${path}`,
  };
}

// Static public routes shared by every locale (stable English path segments).
const STATIC_ROUTES = [
  { path: "", priority: 1 },
  { path: "/products", priority: 0.9 },
  { path: "/about", priority: 0.7 },
  { path: "/quality-control", priority: 0.7 },
  { path: "/supply-chain", priority: 0.7 },
  { path: "/certifications", priority: 0.7 },
  { path: "/markets", priority: 0.7 },
  { path: "/contact", priority: 0.8 },
  { path: "/blog", priority: 0.6 },
  // Legal pages: indexable and linked from the footer, but low priority so
  // they never compete with commercial pages in search.
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales as readonly Locale[]) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        alternates: { languages: localizedAlternates(route.path) },
        changeFrequency: route.path === "" ? "monthly" : "monthly",
        priority: route.priority,
      });
    }

    for (const product of getProducts(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/products/${product.slug}`,
        alternates: { languages: localizedAlternates(`/products/${product.slug}`) },
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }

    // Market detail pages are statically generated per locale/slug.
    for (const market of getMarkets(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/markets/${market.slug}`,
        alternates: { languages: localizedAlternates(`/markets/${market.slug}`) },
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const post of getBlogPosts(locale)) {
      const lastModified = Number.isNaN(Date.parse(post.date))
        ? undefined
        : new Date(post.date);
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${post.slug}`,
        alternates: { languages: localizedAlternates(`/blog/${post.slug}`) },
        changeFrequency: "monthly",
        priority: 0.6,
        ...(lastModified ? { lastModified } : {}),
      });
    }
  }

  return entries;
}
