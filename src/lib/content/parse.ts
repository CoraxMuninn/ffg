import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import type { Locale } from "@/lib/i18n/config";

/**
 * Shared content parsing foundation.
 *
 * This module owns the one pipeline every content loader uses:
 *
 *   Filesystem access → frontmatter parsing → field validation → typed model
 *
 * No loader reimplements file reading or frontmatter parsing; they call into
 * these primitives and provide a small validator for their own entity type.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

/** Raised for invalid/malformed CMS content with a developer-actionable message. */
export class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`[content] ${file}: ${message}`);
    this.name = "ContentError";
  }
}

interface RawFile {
  /** Absolute filesystem path. */
  file: string;
  /** Path relative to the content root. */
  relative: string;
  /** Parsed YAML frontmatter. */
  data: Record<string, unknown>;
  /** Markdown body (without frontmatter), trimmed. */
  content: string;
}

function readMarkdownFile(file: string, relative: string): RawFile | null {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { file, relative, data: (data ?? {}) as Record<string, unknown>, content: content.trim() };
}

function listMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name))
    .sort();
}

/**
 * Locale-aware content directory resolution.
 *
 * No transparent wrong-language fallback (audit SEO-M2, Roadmap Task 5.4):
 * a request for `locale` reads ONLY that locale's directory. Missing localized
 * content yields an empty collection — detail pages then `notFound()` and
 * produce a real 404 — so English can never be served under a false FA/RU/VI
 * URL, canonical, or hreflang cluster. (If a business-required fallback is ever
 * reintroduced it must mark the actual language and `noindex` until translated.)
 */
function resolveDir(locale: Locale, subdir: string): { dir: string } {
  return { dir: path.join(CONTENT_ROOT, locale, subdir) };
}

// ── Field validators ─────────────────────────────────────────────────────────

/** Lowercase kebab-case, the URL-safe slug format shared by every collection
 *  and enforced by the CMS slug pattern. Centralized so the loader rejects a
 *  bad slug at build time rather than emitting an unsafe/ambiguous URL. */
const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(file: string, slug: string): void {
  if (!KEBAB_SLUG.test(slug)) {
    throw new ContentError(
      file,
      `slug "${slug}" must be lowercase kebab-case (a-z, 0-9, hyphens)`,
    );
  }
}

/** Calendar date `YYYY-MM-DD` (the only date format the CMS datetime widget writes). */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads a CMS date field as `YYYY-MM-DD`.
 *
 * Accepts a string or a YAML-parsed `Date`. Invalid values fail loudly with
 * the field name so an editor can fix the frontmatter.
 */
export function parseIsoDate(
  file: string,
  value: unknown,
  key: string,
  required: boolean,
): string | undefined {
  if (value == null || value === "") {
    if (required) {
      throw new ContentError(file, `frontmatter field "${key}" must be a valid YYYY-MM-DD date`);
    }
    return undefined;
  }
  let iso = "";
  if (typeof value === "string") {
    iso = value.trim().slice(0, 10);
  } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
    iso = value.toISOString().slice(0, 10);
  }
  if (!ISO_DATE.test(iso) || Number.isNaN(Date.parse(`${iso}T00:00:00Z`))) {
    throw new ContentError(file, `frontmatter field "${key}" must be a valid YYYY-MM-DD date`);
  }
  return iso;
}

function str(file: string, data: Record<string, unknown>, key: string, required = true): string {
  const value = data[key];
  if (typeof value === "string") return value;
  if (!required && value == null) return "";
  throw new ContentError(file, `frontmatter field "${key}" must be a string, got ${typeof value}`);
}

function num(file: string, data: Record<string, unknown>, key: string, required = true): number {
  const value = data[key];
  if (typeof value === "number") return value;
  if (!required && value == null) return 0;
  throw new ContentError(file, `frontmatter field "${key}" must be a number, got ${typeof value}`);
}

function bool(file: string, data: Record<string, unknown>, key: string, required = true): boolean {
  const value = data[key];
  if (typeof value === "boolean") return value;
  if (!required && value == null) return false;
  throw new ContentError(file, `frontmatter field "${key}" must be a boolean, got ${typeof value}`);
}

function array(file: string, data: Record<string, unknown>, key: string): unknown[] {
  const value = data[key];
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  throw new ContentError(file, `frontmatter field "${key}" must be an array`);
}

// ── Public primitives ────────────────────────────────────────────────────────

export interface ParsedItem<T> {
  /** Parsed and validated model. */
  item: T;
  /** True when this record came from the English fallback, not the requested locale. */
  fromFallback: boolean;
}

/**
 * Loads and validates all records in a folder-style collection.
 * Each `.md` file is one record. Records are sorted by `order`.
 *
 * @param subdir Collection subdirectory relative to `content/<locale>/`, e.g. "products".
 * @param locale Requested locale (falls back to English when unavailable).
 * @param validate Maps a raw file to a validated typed model.
 */
export function loadCollection<T>(
  subdir: string,
  locale: Locale,
  validate: (raw: RawFile) => T,
  opts: { filterEnabled?: boolean } = {},
): ParsedItem<T>[] {
  const { dir } = resolveDir(locale, subdir);
  const files = listMarkdownFiles(dir);

  return files
    .map((file): ParsedItem<T> | null => {
      const relative = path.relative(CONTENT_ROOT, file);
      const raw = readMarkdownFile(file, relative);
      if (!raw) return null;
      const item = validate(raw);
      if (opts.filterEnabled) {
        const enabled = (item as { enabled?: boolean }).enabled;
        if (enabled === false) return null;
      }
      // `fromFallback` is always false since the wrong-language fallback was
      // removed (Task 5.4); the field is retained on the public shape so
      // callers that guard on it keep compiling.
      return { item, fromFallback: false };
    })
    .filter((entry): entry is ParsedItem<T> => entry !== null)
    .sort((a, b) => orderOf(a.item) - orderOf(b.item));
}

/**
 * Loads and validates a single record by slug from a folder-style collection.
 * Returns `null` when no record matches the slug.
 */
export function loadItemBySlug<T extends { slug: string }>(
  subdir: string,
  locale: Locale,
  slug: string,
  validate: (raw: RawFile) => T,
): ParsedItem<T> | null {
  return (
    loadCollection(subdir, locale, validate)
      // prefer non-fallback when a slug exists in the requested locale
      .find((entry) => entry.item.slug === slug) ?? null
  );
}

function orderOf(item: unknown): number {
  const o = (item as { order?: number }).order;
  return typeof o === "number" ? o : 0;
}

// ── Default entity validators ────────────────────────────────────────────────

export interface RawLike {
  title: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
  enabled: boolean;
  order: number;
  specs: { label: string; value: string }[];
  body: string;
}

export function parseBase(raw: RawFile, withBody: boolean): Omit<RawLike, "icon" | "image" | "specs"> {
  const { file, data, content } = raw;
  const slug = str(file, data, "slug");
  validateSlug(file, slug);
  return {
    title: str(file, data, "title"),
    slug,
    description: str(file, data, "description", false),
    enabled: bool(file, data, "enabled", false),
    order: num(file, data, "order", false),
    body: withBody ? content : "",
  };
}

export function parseImage(raw: RawFile): string {
  const value = str(raw.file, raw.data, "image", false).trim();
  return value;
}

export function parseIcon(raw: RawFile): string {
  return str(raw.file, raw.data, "icon", false);
}

/**
 * Reads an optional frontmatter list of plain strings (e.g. `focus`).
 * Missing keys yield an empty array; non-string entries are rejected so bad
 * CMS input fails loudly at build time rather than rendering as `[object].`
 */
export function parseStringList(raw: RawFile, key: string): string[] {
  return array(raw.file, raw.data, key).map((entry) => {
    if (typeof entry !== "string") {
      throw new ContentError(raw.file, `frontmatter list "${key}" must contain strings`);
    }
    return entry.trim();
  }).filter(Boolean);
}

export function parseSpecs(raw: RawFile): { label: string; value: string }[] {
  return array(raw.file, raw.data, "specs").map((entry, index) => {
    // Stop silently dropping malformed specs (audit ARCH-M3/M4, Roadmap 5.1):
    // a non-object entry is a real CMS error and must fail loudly with its
    // position, not be filtered out and quietly lost.
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new ContentError(
        raw.file,
        `frontmatter list "specs" entry #${index + 1} must be an object with "label" and "value"`,
      );
    }
    const spec = entry as Record<string, unknown>;
    return {
      label: str(raw.file, spec, "label"),
      value: str(raw.file, spec, "value"),
    };
  });
}

// ── Expose raw file shape for custom validators ──────────────────────────────

export type { RawFile };
