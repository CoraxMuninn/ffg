import type { Metadata } from "next";

import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "./config";

/**
 * Builds locale-aware `alternates` (canonical + hreflang) for a path.
 *
 * All locales share the same English path segment (stable English slugs), so
 * each page produces a canonical plus hreflang for every locale, with
 * `x-default` pointing at English.
 *
 * @param locale  Active locale.
 * @param path    Localized path WITHOUT the locale prefix, e.g. "/products".
 */
export function buildAlternates(locale: Locale, path: string) {
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${SITE_URL}/${l}${path}`])
  ) as Record<(typeof locales)[number], string>;

  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      ...languages,
      "x-default": `${SITE_URL}/en${path}`,
    },
  };
}

export interface PageMetadataInput {
  locale: Locale;
  /** Page title WITHOUT the brand suffix (the layout appends the brand). */
  title: string;
  description: string;
  /** Localized path without locale prefix, e.g. "/about". */
  path: string;
  /** Absolute or root-relative image URL for Open Graph/Twitter. */
  ogImage?: string;
  /** Localized description of what the social image actually shows. */
  ogImageAlt?: string;
  /** Present only for editorial pages so Open Graph emits article metadata. */
  article?: {
    publishedTime: string;
    authors?: string[];
    tags?: string[];
  };
}

/**
 * Builds complete, unique per-page metadata for an indexable page.
 */
const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  fa: "fa_IR",
  ru: "ru_RU",
  vi: "vi_VN",
};

export function buildPageMetadata({
  locale,
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = title,
  article,
}: PageMetadataInput): Metadata {
  const imagePath = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;
  const url = `${SITE_URL}/${locale}${path}`;
  const sharedOpenGraph = {
    locale: OG_LOCALES[locale],
    alternateLocale: locales
      .filter((candidate) => candidate !== locale)
      .map((candidate) => OG_LOCALES[candidate]),
    url,
    siteName: SITE_NAME,
    title,
    description,
    images: [{ url: imagePath, alt: ogImageAlt }],
  };

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: article
      ? {
          type: "article",
          ...sharedOpenGraph,
          publishedTime: article.publishedTime,
          authors: article.authors,
          tags: article.tags,
        }
      : {
          type: "website",
          ...sharedOpenGraph,
        },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imagePath],
    },
  };
}
