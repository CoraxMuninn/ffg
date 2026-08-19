/**
 * Structured-data fact-policy tests (audit SEO-M3).
 *
 * Structured data is a set of machine-readable factual assertions, not
 * presentation copy. These tests exist to stop the schema builders from
 * claiming commercial relationships the repository content does not establish
 * — specifically, restating Feiz Food Group's documented exporter/supplier
 * role as if it were the manufacturer or the owner of a product brand.
 *
 * Run with:  npm test
 *
 * Part of the Roadmap Task 2.1 regression foundation (Vitest runner).
 */

import { expect, test } from "vitest";

import type { Product } from "../content/types";
import type { Locale } from "../i18n/config";
import { SITE_NAME } from "./config";
import { PRODUCT_ORIGIN_CLAIM_PROPERTIES, productSchema } from "./schema";

/** A product carrying only fields the content model actually defines. */
const product: Product = {
  title: "Frozen Chicken Gizzard",
  slug: "chicken-gizzard",
  description: "IQF frozen chicken gizzard for B2B enquiries.",
  image: "/media/products/chicken-gizzard-iqf.jpg",
  imageAlt: "Frozen chicken gizzard pieces on a stainless steel tray",
  specs: [
    { label: "Process", value: "IQF Frozen" },
    { label: "Storage", value: "-18°C" },
  ],
  featured: false,
  enabled: true,
  order: 3,
  body: "Frozen chicken gizzard is a secondary product in the range.",
};

const LOCALES: Locale[] = ["en", "fa", "ru", "vi"];

/* ── the specific regression: brand ─────────────────────────────────────── */

test("Product schema does not assert a brand", () => {
  const schema = productSchema("en", product);
  expect(
    "brand" in schema,
    "content establishes an exporter/supplier role, not brand ownership",
  ).toBe(false);
});

test("Product schema asserts no brand in any locale", () => {
  for (const locale of LOCALES) {
    const schema = productSchema(locale, product);
    expect("brand" in schema, `brand emitted for locale ${locale}`).toBe(false);
  }
});

test("the site organization is not named anywhere in Product schema", () => {
  // Catches the substitution itself, not just the `brand` key: re-adding the
  // seller under `manufacturer` or a similar property would fail here too.
  const serialized = JSON.stringify(productSchema("en", product));
  expect(
    serialized.includes(SITE_NAME),
    `Product schema must not name ${SITE_NAME} as a product-origin party`,
  ).toBe(false);
  expect(serialized.includes("#organization")).toBe(false);
});

/* ── the general policy ─────────────────────────────────────────────────── */

test("Product schema emits no seller/manufacturer/brand substitution", () => {
  for (const locale of LOCALES) {
    const schema = productSchema(locale, product);
    for (const property of PRODUCT_ORIGIN_CLAIM_PROPERTIES) {
      expect(
        property in schema,
        `${property} is an origin/ownership claim with no verified content field (${locale})`,
      ).toBe(false);
    }
  }
});

test("the fact policy covers the roles the audit calls out", () => {
  // Guards the guard: silently shrinking the policy list would make the test
  // above vacuous.
  for (const property of ["brand", "manufacturer", "offers"]) {
    expect(
      (PRODUCT_ORIGIN_CLAIM_PROPERTIES as readonly string[]).includes(property),
      `${property} must remain in the fact policy`,
    ).toBe(true);
  }
});

/* ── the schema must still be useful and valid ──────────────────────────── */

test("Product schema still emits the verified product facts", () => {
  const schema = productSchema("en", product) as Record<string, unknown>;
  expect(schema["@type"]).toBe("Product");
  expect(schema["@id"]).toBe("https://feizfood.com/en/products/chicken-gizzard#product");
  expect(schema.name).toBe(product.title);
  expect(schema.description).toBe(product.description);
  expect(schema.url).toBe("https://feizfood.com/en/products/chicken-gizzard");
  expect(schema.inLanguage).toBe("en");
});

test("Product schema keeps the image object", () => {
  const schema = productSchema("en", product) as Record<string, unknown>;
  const image = schema.image as Record<string, unknown>;
  expect(image["@type"]).toBe("ImageObject");
  expect(image.url).toBe(`https://feizfood.com${product.image}`);
  expect(image.caption).toBe(product.imageAlt);
});

test("Product schema keeps specs as additionalProperty", () => {
  const schema = productSchema("en", product) as Record<string, unknown>;
  expect(schema.additionalProperty).toEqual([
    { "@type": "PropertyValue", name: "Process", value: "IQF Frozen" },
    { "@type": "PropertyValue", name: "Storage", value: "-18°C" },
  ]);
});

test("a product without specs omits additionalProperty entirely", () => {
  const schema = productSchema("en", { ...product, specs: [] });
  expect("additionalProperty" in schema).toBe(false);
});

test("Product schema remains serializable valid JSON-LD", () => {
  for (const locale of LOCALES) {
    const parsed = JSON.parse(JSON.stringify(productSchema(locale, product)));
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Product");
    // Required-for-usefulness properties survive the brand removal.
    for (const key of ["name", "description", "url", "inLanguage"]) {
      expect(Boolean(parsed[key]), `${key} missing for ${locale}`).toBe(true);
    }
  }
});
