import { defaultLocale, locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { SITE_URL } from "./config";

/**
 * Counterpart-aware hreflang / canonical (audit SEO-M1, Roadmap Task 5.3).
 *
 * Locale alternates are emitted ONLY for locales that actually carry an
 * equivalent translation of the path. The stable English slug shared across
 * locales is the translation/entity ID: a translation "exists" for a locale
 * when its content loader resolves that slug (no wrong-language fallback — see
 * Task 5.4). This prevents hreflang from ever pointing at a 404 or at
 * unrelated content, and keeps partial/disabled translation clusters valid.
 *
 * `x-default` targets the default locale when it is part of the cluster,
 * otherwise the first available locale — never a non-existent page.
 *
 * The same helper drives both the HTML `<head>` alternates (via
 * `buildPageMetadata`) and the sitemap `alternates.languages`, so the two can
 * never disagree (Roadmap: "use one helper for both HTML and sitemap").
 */
export interface Alternates {
  canonical: string;
  languages: Record<string, string>;
}

export function buildAlternates(
  locale: Locale,
  path: string,
  availableLocales: readonly Locale[] = locales,
): Alternates {
  const languages: Record<string, string> = {};
  for (const candidate of availableLocales) {
    languages[candidate] = `${SITE_URL}/${candidate}${path}`;
  }
  const xDefaultLocale = availableLocales.includes(defaultLocale)
    ? defaultLocale
    : availableLocales[0];
  if (xDefaultLocale) {
    languages["x-default"] = `${SITE_URL}/${xDefaultLocale}${path}`;
  }
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages,
  };
}
