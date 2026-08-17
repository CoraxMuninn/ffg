import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { defaultLocale } from "@/lib/i18n/config";
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
 * Requests content for `locale` but falls back to the default (English) locale
 * when the requested locale has no directory/files. This is the explicit
 * fallback strategy: missing translations surface as English rather than
 * silently mixing languages or hiding content.
 */
function resolveDir(locale: Locale, subdir: string): { dir: string; isFallback: boolean } {
  const requested = path.join(CONTENT_ROOT, locale, subdir);
  if (fs.existsSync(requested)) return { dir: requested, isFallback: false };
  if (locale !== defaultLocale) {
    const fallback = path.join(CONTENT_ROOT, defaultLocale, subdir);
    if (fs.existsSync(fallback)) return { dir: fallback, isFallback: true };
  }
  return { dir: requested, isFallback: locale !== defaultLocale };
}

// ── Field validators ─────────────────────────────────────────────────────────

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
  const { dir, isFallback } = resolveDir(locale, subdir);
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
      return { item, fromFallback: isFallback };
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
  return {
    title: str(file, data, "title"),
    slug: str(file, data, "slug"),
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
  return array(raw.file, raw.data, "specs")
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => ({
      label: str(raw.file, s, "label"),
      value: str(raw.file, s, "value"),
    }));
}

// ── Expose raw file shape for custom validators ──────────────────────────────

export type { RawFile };
