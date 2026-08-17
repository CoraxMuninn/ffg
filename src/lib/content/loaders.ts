import type { Locale } from "@/lib/i18n/config";
import type {
  BlogPost,
  Capability,
  Certification,
  Market,
  Page,
  Product,
  QualityProcess,
  SupplyChainStep,
} from "./types";
import {
  loadCollection,
  loadItemBySlug,
  parseBase,
  parseIcon,
  parseImage,
  parseSpecs,
  parseStringList,
  ContentError,
  type RawFile,
} from "./parse";

/** Typed, locale-aware content loaders for the Markdown/Decap CMS layer. */

/** Trims an optional free-text frontmatter field, dropping empty values. */
function optionalString(raw: RawFile, key: string): string | undefined {
  const value = raw.data[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

// ── Products ─────────────────────────────────────────────────────────────────

function validateProduct(raw: RawFile): Product {
  const base = parseBase(raw, true);
  return {
    ...base,
    seoTitle: optionalString(raw, "seoTitle"),
    seoDescription: optionalString(raw, "seoDescription"),
    image: parseImage(raw),
    imageAlt: optionalString(raw, "imageAlt") ?? base.title,
    specs: parseSpecs(raw),
    featured: Boolean(raw.data.featured === true),
  };
}

export function getProducts(locale: Locale): Product[] {
  return loadCollection("products", locale, validateProduct, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

export function getProduct(locale: Locale, slug: string): Product | null {
  return loadItemBySlug("products", locale, slug, validateProduct)?.item ?? null;
}

// ── Certifications ───────────────────────────────────────────────────────────

function validateCertification(raw: RawFile): Certification {
  const base = parseBase(raw, false);
  return {
    title: base.title,
    slug: base.slug,
    description: base.description,
    image: parseImage(raw),
    enabled: base.enabled,
    order: base.order,
  };
}

export function getCertifications(locale: Locale): Certification[] {
  return loadCollection("certifications", locale, validateCertification, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

// ── Trust / capability features ──────────────────────────────────────────────

function validateCapability(raw: RawFile): Capability {
  const base = parseBase(raw, false);
  return {
    title: base.title,
    slug: base.slug,
    description: base.description,
    icon: parseIcon(raw),
    enabled: base.enabled,
    order: base.order,
  };
}

export function getCapabilities(locale: Locale): Capability[] {
  return loadCollection("capabilities", locale, validateCapability, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

// ── Markets ──────────────────────────────────────────────────────────────────

function validateMarket(raw: RawFile): Market {
  const base = parseBase(raw, true);
  return {
    title: base.title,
    heading: optionalString(raw, "heading") ?? base.title,
    slug: base.slug,
    description: base.description,
    seoTitle: optionalString(raw, "seoTitle"),
    seoDescription: optionalString(raw, "seoDescription"),
    image: parseImage(raw),
    imageAlt: optionalString(raw, "imageAlt") ?? base.title,
    panelImage: optionalString(raw, "panelImage") ?? "",
    panelImageAlt:
      optionalString(raw, "panelImageAlt") ??
      optionalString(raw, "imageAlt") ??
      base.title,
    primary: Boolean(raw.data.primary === true),
    enabled: base.enabled,
    order: base.order,
    region: optionalString(raw, "region") ?? "",
    focus: parseStringList(raw, "focus"),
    documents: parseStringList(raw, "documents"),
    body: base.body,
  };
}

export function getMarkets(locale: Locale): Market[] {
  return loadCollection("markets", locale, validateMarket, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

// ── Supply-chain steps ───────────────────────────────────────────────────────

function validateSupplyChainStep(raw: RawFile): SupplyChainStep {
  const base = parseBase(raw, false);
  return {
    title: base.title,
    slug: base.slug,
    description: base.description,
    icon: parseIcon(raw),
    enabled: base.enabled,
    order: base.order,
  };
}

export function getSupplyChainSteps(locale: Locale): SupplyChainStep[] {
  return loadCollection("supply-chain", locale, validateSupplyChainStep, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

// ── Quality-control processes ────────────────────────────────────────────────

function validateQualityProcess(raw: RawFile): QualityProcess {
  const base = parseBase(raw, false);
  return {
    title: base.title,
    slug: base.slug,
    description: base.description,
    icon: parseIcon(raw),
    enabled: base.enabled,
    order: base.order,
  };
}

export function getQualityProcesses(locale: Locale): QualityProcess[] {
  return loadCollection("quality-control", locale, validateQualityProcess, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

// ── Pages ────────────────────────────────────────────────────────────────────

function validatePage(raw: RawFile): Page {
  const base = parseBase(raw, true);

  const rawUpdated = raw.data.updated;
  let updated: string | undefined;
  if (typeof rawUpdated === "string" && rawUpdated.trim()) {
    updated = rawUpdated.trim();
  } else if (rawUpdated instanceof Date && !Number.isNaN(rawUpdated.getTime())) {
    updated = rawUpdated.toISOString().slice(0, 10);
  }

  return {
    title: base.title,
    slug: base.slug,
    description: base.description,
    seoTitle: optionalString(raw, "seoTitle"),
    seoDescription: optionalString(raw, "seoDescription"),
    body: base.body,
    ...(updated ? { updated } : {}),
  };
}

export function getPageContent(locale: Locale, slug: string): Page | null {
  return loadItemBySlug("pages", locale, slug, validatePage)?.item ?? null;
}

// ── Blog ─────────────────────────────────────────────────────────────────────

function validateBlogPost(raw: RawFile): BlogPost {
  const base = parseBase(raw, true);
  const { file, data } = raw;

  const excerpt =
    typeof data.excerpt === "string" && data.excerpt
      ? data.excerpt
      : base.description;

  let date = "";
  if (typeof data.date === "string") {
    date = data.date;
  } else if (data.date instanceof Date && !Number.isNaN(data.date.getTime())) {
    date = data.date.toISOString().slice(0, 10);
  }
  if (!date) {
    throw new ContentError(file, 'frontmatter field "date" must be a valid date');
  }

  return {
    title: base.title,
    slug: base.slug,
    excerpt,
    author: optionalString(raw, "author"),
    date,
    image: parseImage(raw),
    imageAlt: optionalString(raw, "imageAlt"),
    category: optionalString(raw, "category"),
    tags: parseStringList(raw, "tags"),
    seoTitle: optionalString(raw, "seoTitle"),
    seoDescription: optionalString(raw, "seoDescription"),
    enabled: base.enabled,
    order: base.order,
    body: base.body,
  };
}

export function getBlogPosts(locale: Locale): BlogPost[] {
  return loadCollection("blog", locale, validateBlogPost, {
    filterEnabled: true,
  }).map((entry) => entry.item);
}

export function getBlogPost(locale: Locale, slug: string): BlogPost | null {
  return loadItemBySlug("blog", locale, slug, validateBlogPost)?.item ?? null;
}
