/**
 * Typed content models for all CMS-managed entities.
 *
 * These mirror the frontmatter under `content/<locale>/...` and the Decap CMS
 * fields. SEO titles are intentionally separate from visible H1 copy, and image
 * alt text is localized content rather than a component-level English string.
 */

/** A product specification (e.g. Grade, Weight, Glaze). */
export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  title: string;
  /** Stable English slug, shared across all locales. */
  slug: string;
  /** Short description shown in listings and under the H1. */
  description: string;
  /** Optional search/social title, separate from the visible H1. */
  seoTitle?: string;
  /** Optional search/social description. */
  seoDescription?: string;
  /** Hero/listing image path under /media. */
  image: string;
  /** Localized description of what is visibly shown in the image. */
  imageAlt: string;
  /** Ordered list of repository-documented specifications. */
  specs: ProductSpec[];
  /** Flags the primary product for featured presentation. */
  featured: boolean;
  enabled: boolean;
  order: number;
  /** Long-form description (Markdown body). */
  body: string;
}

export interface Certification {
  title: string;
  slug: string;
  description: string;
  /** Certification image path under /media; usually empty to avoid implied proof. */
  image: string;
  enabled: boolean;
  order: number;
}

export interface Capability {
  title: string;
  slug: string;
  description: string;
  /** Lucide icon registry key (string, not an executable reference). */
  icon: string;
  enabled: boolean;
  order: number;
}

export interface Market {
  /** Short country label used in cards and navigation. */
  title: string;
  /** Search-intent H1 used on the market detail page. */
  heading: string;
  slug: string;
  description: string;
  /** Optional search/social title, separate from the visible H1. */
  seoTitle?: string;
  /** Optional search/social description. */
  seoDescription?: string;
  /** Listing/card image, used by the homepage markets grid. */
  image: string;
  /** Localized description of the listing/card image. */
  imageAlt: string;
  /** Wide editorial image for market panels/detail pages. */
  panelImage: string;
  /** Localized description of the wide market image. */
  panelImageAlt: string;
  /** Vietnam is the primary commercial market. */
  primary: boolean;
  enabled: boolean;
  order: number;
  /** Optional geographic region label. */
  region: string;
  /** Questions a buyer may need to evaluate; not claims about buyers or volumes. */
  focus: string[];
  /** Document categories to verify for the destination. */
  documents: string[];
  /** Optional long-form description from the CMS body. */
  body: string;
}

export interface SupplyChainStep {
  title: string;
  slug: string;
  description: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface QualityProcess {
  title: string;
  slug: string;
  description: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface Page {
  title: string;
  slug: string;
  description: string;
  /** Optional search/social title, separate from the visible H1. */
  seoTitle?: string;
  /** Optional search/social description. */
  seoDescription?: string;
  /** Long-form page content (Markdown body). */
  body: string;
  /** Optional ISO date (YYYY-MM-DD) for legal-page revisions. */
  updated?: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  author?: string;
  /** ISO date string, e.g. "2026-08-11". */
  date: string;
  image?: string;
  /** Localized description of what is visibly shown in the article image. */
  imageAlt?: string;
  /** Optional editorial category (CMS `category`). */
  category?: string;
  /** Optional keyword tags (CMS `tags`). */
  tags: string[];
  /** Optional `<title>` override; falls back to `title`. */
  seoTitle?: string;
  /** Optional meta-description override; falls back to `excerpt`. */
  seoDescription?: string;
  enabled: boolean;
  order: number;
  /** Long-form article content (Markdown body). */
  body: string;
}
