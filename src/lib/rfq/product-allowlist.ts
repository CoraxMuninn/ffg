import { getProducts } from "@/lib/content";
import { locales } from "@/lib/i18n/config";

/**
 * Cached allowlist of valid product identifiers.
 *
 * RFQ validation must confirm the submitted product is a real, enabled CMS
 * product. The form submits the stable English slug; older clients and
 * localized titles are still accepted so a FA/RU/VI title is not rejected.
 * The cache is process-lifetime, matching the documented single-instance VPS.
 */

interface ProductAllowlist {
  slugs: Set<string>;
  titles: Set<string>;
  /** Slug → English title for sales-facing email copy. */
  labelBySlug: Map<string, string>;
}

let cached: ProductAllowlist | null = null;

function buildAllowlist(): ProductAllowlist {
  const slugs = new Set<string>();
  const titles = new Set<string>();
  const labelBySlug = new Map<string, string>();

  for (const locale of locales) {
    for (const product of getProducts(locale)) {
      slugs.add(product.slug);
      titles.add(product.title);
      if (locale === "en") {
        labelBySlug.set(product.slug, product.title);
      }
    }
  }

  return { slugs, titles, labelBySlug };
}

function getAllowlist(): ProductAllowlist {
  if (!cached) cached = buildAllowlist();
  return cached;
}

export function getValidProductTitles(): Set<string> {
  return getAllowlist().titles;
}

export function isValidProductTitle(title: string): boolean {
  return isValidProductIdentifier(title);
}

/** True when `value` is an enabled product slug or a known localized title. */
export function isValidProductIdentifier(value: string): boolean {
  const { slugs, titles } = getAllowlist();
  return slugs.has(value) || titles.has(value);
}

/** Canonical English title for email; falls back to the submitted value. */
export function resolveProductLabel(value: string): string {
  const { labelBySlug } = getAllowlist();
  return labelBySlug.get(value) ?? value;
}
