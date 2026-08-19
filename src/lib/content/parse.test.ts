/**
 * Content parse-primitive regression suite (Roadmap Task 2.2 — "purpose-built
 * invalid fixtures fail with actionable messages").
 *
 * The shared validation foundation in `./parse.ts` is what every loader runs
 * before any record reaches the site, so a malformed CMS entry must fail loudly
 * here with a file/field-specific message — never silently coerce or drop it.
 *
 * Run with:  npm test
 */

import { expect, test } from "vitest";

import { ContentError } from "@/lib/content";
import type { RawFile } from "@/lib/content/parse";
import {
  parseBase,
  parseImage,
  parseSpecs,
  parseStringList,
  validateSlug,
} from "@/lib/content/parse";

/** Builds a raw frontmatter record with only the supplied fields. */
function raw(data: Record<string, unknown>, file = "fixtures/invalid.md"): RawFile {
  return { file, relative: file, data, content: "" };
}

/* ── valid fixture (baseline) ─────────────────────────────────────────────── */

test("parseBase accepts a record with all required fields", () => {
  const item = parseBase(
    raw({ title: "Frozen Chicken Feet", slug: "frozen-chicken-feet", order: 1 }),
    false,
  );
  expect(item.title).toBe("Frozen Chicken Feet");
  expect(item.slug).toBe("frozen-chicken-feet");
  expect(item.order).toBe(1);
});

/* ── slug format (Task 5.1) ──────────────────────────────────────────────── */

test("validateSlug rejects non-kebab-case slugs", () => {
  const reject = (slug: string) => expect(() => validateSlug("f.md", slug)).toThrow(ContentError);
  reject("Frozen_Chicken_Feet");
  reject("frozen chicken feet");
  reject("trailing-");
  reject("UPPER");
  // Valid forms do not throw.
  expect(() => validateSlug("f.md", "frozen-chicken-feet")).not.toThrow();
  expect(() => validateSlug("f.md", "iqf-2kg")).not.toThrow();
});

test("parseBase rejects a non-kebab slug at parse time", () => {
  const fn = () => parseBase(raw({ title: "X", slug: "Bad Slug" }), false);
  expect(fn).toThrow(/kebab/);
});

/* ── required-string fields ─────────────────────────────────────────────── */

test("parseBase rejects a missing required title with an actionable message", () => {
  expect(() => parseBase(raw({ slug: "x" }), false)).toThrow(ContentError);
  expect(() => parseBase(raw({ slug: "x" }), false)).toThrow(/title/);
});

test("parseBase rejects a non-string title and names the bad type", () => {
  expect(() => parseBase(raw({ title: 42, slug: "x" }), false)).toThrow(/title/);
  expect(() => parseBase(raw({ title: 42, slug: "x" }), false)).toThrow(/string/);
});

test("the thrown error identifies the offending file", () => {
  const file = "fixtures/en/products/bad.md";
  let caught: unknown;
  try {
    parseBase(raw({ slug: "x" }, file), false);
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(ContentError);
  expect(String(caught)).toContain(file);
});

/* ── list fields ─────────────────────────────────────────────────────────── */

test("parseStringList rejects a list containing non-string entries", () => {
  expect(() => parseStringList(raw({ focus: ["ok", 7] }), "focus")).toThrow(
    /must contain strings/,
  );
});

test("parseSpecs rejects a non-array specs value", () => {
  expect(() => parseSpecs(raw({ specs: "not-a-list" }))).toThrow(/must be an array/);
});

test("parseSpecs rejects a spec object missing a required field", () => {
  expect(() => parseSpecs(raw({ specs: [{ value: "A/A+" }] }))).toThrow(/label/);
});

test("parseSpecs stops silently dropping malformed (non-object) entries", () => {
  // Task 5.1: a non-object spec entry is a real CMS error and must fail loudly
  // with its position, not be filtered out and quietly lost.
  const fn = () =>
    parseSpecs(raw({ specs: [{ label: "Grade", value: "A" }, "bad-string"] }));
  expect(fn).toThrow(/specs.*entry #2/i);
});

/* ── lenient optional fields ─────────────────────────────────────────────── */

test("parseImage and parseIcon return empty for missing optional values", () => {
  // Optional image/icon fields are legitimately absent on certifications etc.,
  // so their absence must not throw.
  expect(parseImage(raw({}))).toBe("");
  expect(() => parseImage(raw({}))).not.toThrow();
});
