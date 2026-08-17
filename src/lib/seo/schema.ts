// Relative rather than the `@/` alias: this module is compiled standalone by
// `tsconfig.test.json` for the dependency-free `node --test` suite, which has
// no path-alias resolver.
import type { BlogPost, Product } from "../content";
import { PUBLIC_EMAIL } from "../content/contact";
import { localeConfig } from "../i18n/config";
import type { Locale } from "../i18n/config";
import { SITE_NAME, SITE_URL } from "./config";

/**
 * JSON-LD structured-data builders.
 *
 * Only properties represented by visible or repository-documented information
 * are emitted. There are deliberately no offers, prices, availability,
 * ratings, reviews, certificate numbers, business capacities, or customer
 * claims. All URLs are absolute and every entity carries the active language.
 *
 * Fact policy — commercial roles are distinct and must never be substituted
 * for one another (audit SEO-M3):
 *
 * - **seller / exporter / supplier** — the party offering goods for sale. This
 *   is the documented role of Feiz Food Group.
 * - **manufacturer** — the party that produces the goods.
 * - **brand** — the marque the goods are sold under, which implies ownership.
 *
 * Being the seller does not make an organization the manufacturer or the brand
 * owner. Emit `brand`, `manufacturer`, or a comparable claim only when the
 * repository content actually establishes that specific relationship, and
 * source it from a real content field rather than defaulting to the site
 * organization. `PRODUCT_ORIGIN_CLAIM_PROPERTIES` below encodes this rule so
 * the policy is enforced by tests rather than by convention.
 */

type Schema = Record<string, unknown>;

function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path}`;
}

export function organizationSchema(locale: Locale, description: string): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    email: PUBLIC_EMAIL,
    description,
    inLanguage: localeConfig[locale].language,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/media/logo/feiz-food-logo.png`,
    },
  };
}

export function webSiteSchema(locale: Locale): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/${locale}#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: localeConfig[locale].language,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function webPageSchema(
  locale: Locale,
  name: string,
  description: string,
  path: string,
  image?: string
): Schema {
  const url = `${SITE_URL}/${locale}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: localeConfig[locale].language,
    isPartOf: { "@id": `${SITE_URL}/${locale}#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    ...(image
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: absoluteUrl(image),
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(
  locale: Locale,
  items: { name: string; path: string }[]
): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    inLanguage: localeConfig[locale].language,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.path}`,
    })),
  };
}

/**
 * Product properties that assert who made, owns, or is accountable for the
 * goods themselves — as opposed to describing the goods.
 *
 * `productSchema` must not emit any of these while the content model has no
 * verified field to source them from: doing so would restate the seller as the
 * producer or brand owner (audit SEO-M3). Enforced by the fact-policy test in
 * `schema.test.ts`; extend this list rather than adding a one-off exception.
 */
export const PRODUCT_ORIGIN_CLAIM_PROPERTIES = [
  "brand",
  "manufacturer",
  "productionDate",
  "countryOfOrigin",
  "countryOfAssembly",
  "countryOfLastProcessing",
  "award",
  "hasCertification",
  "offers",
  "aggregateRating",
  "review",
] as const;

export function productSchema(locale: Locale, product: Product): Schema {
  const url = `${SITE_URL}/${locale}/products/${product.slug}`;
  const schema: Schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    description: product.description,
    url,
    inLanguage: localeConfig[locale].language,
    image: product.image
      ? {
          "@type": "ImageObject",
          url: absoluteUrl(product.image),
          caption: product.imageAlt,
        }
      : undefined,
    // No `brand` (audit SEO-M3). See the fact policy above: repository content
    // establishes Feiz Food Group as an exporter/supplier of these goods, not
    // as the manufacturer or the owner of a product brand. Naming the
    // organization as `brand` asserted a commercial relationship the content
    // does not support. Re-add only when verified brand ownership exists as a
    // real content field on Product — never by substituting the seller.
  };

  if (product.specs.length > 0) {
    schema.additionalProperty = product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
    }));
  }

  return schema;
}

export function articleSchema(locale: Locale, post: BlogPost): Schema {
  const url = `${SITE_URL}/${locale}/blog/${post.slug}`;
  const schema: Schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    inLanguage: localeConfig[locale].language,
    datePublished: post.date,
    image: post.image
      ? {
          "@type": "ImageObject",
          url: absoluteUrl(post.image),
          ...(post.imageAlt ? { caption: post.imageAlt } : {}),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/media/logo/feiz-food-logo.png`,
      },
    },
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags.length > 0 ? { keywords: post.tags } : {}),
  };

  // The CMS stores a team/byline string rather than a verified named person.
  // Organization is therefore accurate; Person would invent an individual.
  if (post.author) {
    schema.author = { "@type": "Organization", name: post.author };
  }
  return schema;
}
