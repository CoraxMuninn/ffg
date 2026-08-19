import type { Locale } from "./config";

/**
 * Typed route helpers for locale-aware navigation.
 *
 * Centralizes path construction so components never hand-concatenate locale
 * prefixes. All helpers return absolute, locale-prefixed paths.
 */

/** Prefixes a path with the locale. Pass "/" or a leading-slash path. */
export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function productsPath(locale: Locale): string {
  return `/${locale}/products`;
}

export function productPath(locale: Locale, slug: string): string {
  return `/${locale}/products/${slug}`;
}

export function marketsPath(locale: Locale): string {
  return `/${locale}/markets`;
}

/** Detail page for a single destination market, e.g. /en/markets/vietnam. */
export function marketPath(locale: Locale, slug: string): string {
  return `/${locale}/markets/${slug}`;
}

export function contactPath(locale: Locale, productSlug?: string): string {
  const base = `/${locale}/contact`;
  if (!productSlug) return base;
  return `${base}?product=${encodeURIComponent(productSlug)}`;
}
