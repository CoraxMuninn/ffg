import fs from "node:fs";
import path from "node:path";

/**
 * Known public routes and a filesystem check for CMS-driven detail slugs.
 *
 * Used to validate editor-supplied internal links (`related`, markdown hrefs)
 * without inventing URLs and without going through content loaders (which
 * would recurse while a blog post is still being parsed).
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

/** Static public paths that every locale serves. */
export const STATIC_INTERNAL_PATHS = new Set([
  "/",
  "/products",
  "/markets",
  "/about",
  "/quality-control",
  "/supply-chain",
  "/certifications",
  "/contact",
  "/blog",
  "/privacy",
  "/terms",
]);

const DETAIL_COLLECTIONS = new Set(["products", "markets", "blog"]);

/** True when a locale-relative href points at a known route or record. */
export function isKnownInternalPath(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  const [pathname] = href.split(/[?#]/);
  if (!pathname) return false;
  if (STATIC_INTERNAL_PATHS.has(pathname)) return true;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return false;
  const [collection, slug] = parts;
  if (!DETAIL_COLLECTIONS.has(collection)) return false;
  // Shared English slugs are the cross-locale identity (docs/SLUG-POLICY.md).
  return fs.existsSync(path.join(CONTENT_ROOT, "en", collection, `${slug}.md`));
}

/** Absolute https URL suitable as a canonical override. */
export function isHttpsAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
