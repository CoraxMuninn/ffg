import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "./config";
import { buildAlternates } from "./hreflang";

export { buildAlternates } from "./hreflang";

/** Re-exported so existing `@/lib/seo/metadata` imports keep resolving. */
export type { Alternates } from "./hreflang";

/**
 * Builds complete, unique per-page metadata for an indexable page.
 *
 * Canonical + hreflang come from the single counterpart-aware helper
 * (`buildAlternates`), and OG/Twitter images carry verified dimensions/type and
 * a localized alt (Roadmap Task 5.7).
 */
const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  fa: "fa_IR",
  ru: "ru_RU",
  vi: "vi_VN",
};

/** MIME type for the social-image `type` field, inferred from the extension. */
function imageContentType(imagePath: string): string | undefined {
  const ext = path.extname(imagePath.split("?")[0]!).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    default:
      return undefined;
  }
}

const dimensionCache = new Map<string, { width: number; height: number } | null>();

/**
 * Reads verified pixel dimensions for a root-relative image path using a small,
 * dependency-free parser for the formats this site ships (JPEG, PNG, WebP,
 * GIF). Dimensions are required for valid Open Graph image objects and let
 * social platforms render the preview without a second fetch. A failed/unread
 * read returns `undefined` — the image is still referenced, just without
 * dimensions. Results are cached for the life of the build.
 */
function readImageDimensions(
  buffer: Buffer,
): { width: number; height: number } | undefined {
  // PNG: 8-byte signature, then IHDR with BE width/height at offset 16/20.
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  // GIF: logical screen descriptor, LE width/height at offset 6/8.
  if (buffer.length >= 10 && buffer[0] === 0x47 && buffer[1] === 0x49) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  // WebP (RIFF....WEBP): dimensions live in the VP8/VP8L/VP8X chunk.
  if (
    buffer.length >= 30 &&
    buffer[0] === 0x52 &&
    buffer[8] === 0x57 &&
    buffer[12] === 0x56 &&
    buffer[13] === 0x50
  ) {
    const fourcc = buffer.toString("ascii", 12, 16);
    if (fourcc === "VP8X") {
      return {
        width: (buffer.readUIntLE(24, 3) & 0xffffff) + 1,
        height: (buffer.readUIntLE(27, 3) & 0xffffff) + 1,
      };
    }
    if (fourcc === "VP8 " && buffer.length >= 26) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (fourcc === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
  }
  // JPEG: scan markers for a Start-Of-Frame segment; width/height follow.
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      // Standalone markers (no length payload).
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      // SOFn markers carry the frame dimensions.
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }
  return undefined;
}

function imageDimensions(imagePath: string): { width: number; height: number } | undefined {
  if (!imagePath || imagePath.startsWith("http")) return undefined;
  if (dimensionCache.has(imagePath)) {
    return dimensionCache.get(imagePath) ?? undefined;
  }
  let result: { width: number; height: number } | undefined;
  try {
    const filePath = path.join(process.cwd(), "public", imagePath);
    if (fs.existsSync(filePath)) {
      // Read the full file: JPEG's Start-Of-Frame marker follows EXIF and
      // quantization segments that can be tens of KB in. This runs at most once
      // per unique social image at build time (results are cached), so the cost
      // is negligible.
      result = readImageDimensions(fs.readFileSync(filePath));
    }
  } catch {
    result = undefined;
  }
  dimensionCache.set(imagePath, result ?? null);
  return result;
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
  /**
   * Locales that carry an equivalent translation of this path (Task 5.3).
   * Defaults to every locale (static routes); detail pages pass the subset
   * whose content resolves so hreflang never targets a missing translation.
   */
  availableLocales?: readonly Locale[];
  /**
   * Optional absolute canonical override (syndication / explicit duplicate).
   * When omitted, the locale+path URL is the canonical. Hreflang languages
   * still come from `availableLocales` and are never invented.
   */
  canonical?: string;
  /** Social title; defaults to `title`. */
  ogTitle?: string;
  /** Social description; defaults to `description`. */
  ogDescription?: string;
  /** Present only for editorial pages so Open Graph emits article metadata. */
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  };
}

export function buildPageMetadata({
  locale,
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = title,
  availableLocales,
  canonical,
  ogTitle,
  ogDescription,
  article,
}: PageMetadataInput): Metadata {
  const imagePath = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;
  const dimensions = imageDimensions(ogImage);
  const imageType = imageContentType(imagePath);
  const url = `${SITE_URL}/${locale}${path}`;
  const socialTitle = ogTitle ?? title;
  const socialDescription = ogDescription ?? description;
  const alternates = buildAlternates(locale, path, availableLocales);
  if (canonical) {
    alternates.canonical = canonical;
  }
  const ogImageObject: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
    type?: string;
  } = { url: imagePath, alt: ogImageAlt };
  if (dimensions) {
    ogImageObject.width = dimensions.width;
    ogImageObject.height = dimensions.height;
  }
  if (imageType) ogImageObject.type = imageType;

  const sharedOpenGraph = {
    locale: OG_LOCALES[locale],
    alternateLocale: locales
      .filter((candidate) => candidate !== locale)
      .map((candidate) => OG_LOCALES[candidate]),
    url,
    siteName: SITE_NAME,
    title: socialTitle,
    description: socialDescription,
    images: [ogImageObject],
  };

  return {
    title,
    description,
    alternates,
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
          modifiedTime: article.modifiedTime,
          authors: article.authors,
          tags: article.tags,
        }
      : {
          type: "website",
          ...sharedOpenGraph,
        },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [{ url: imagePath, alt: ogImageAlt }],
    },
  };
}
