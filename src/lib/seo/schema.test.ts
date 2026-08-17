/**
 * Structured-data fact-policy tests (audit SEO-M3).
 *
 * Structured data is a set of machine-readable factual assertions, not
 * presentation copy. These tests exist to stop the schema builders from
 * claiming commercial relationships the repository content does not establish
 * — specifically, restating Feiz Food Group's documented exporter/supplier
 * role as if it were the manufacturer or the owner of a product brand.
 *
 * Run with:  npm run test:seo
 *
 * `node:test` + `node:assert` are used deliberately: they ship with Node, so
 * this suite adds no dependency ahead of the Phase 2 test-runner decision
 * (Task 2.1).
 */

import assert from "node:assert/strict";
import test from "node:test";

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
  assert.equal(
    "brand" in schema,
    false,
    "content establishes an exporter/supplier role, not brand ownership",
  );
});

test("Product schema asserts no brand in any locale", () => {
  for (const locale of LOCALES) {
    const schema = productSchema(locale, product);
    assert.equal("brand" in schema, false, `brand emitted for locale ${locale}`);
  }
});

test("the site organization is not named anywhere in Product schema", () => {
  // Catches the substitution itself, not just the `brand` key: re-adding the
  // seller under `manufacturer` or a similar property would fail here too.
  const serialized = JSON.stringify(productSchema("en", product));
  assert.equal(
    serialized.includes(SITE_NAME),
    false,
    `Product schema must not name ${SITE_NAME} as a product-origin party`,
  );
  assert.equal(serialized.includes("#organization"), false);
});

/* ── the general policy ─────────────────────────────────────────────────── */

test("Product schema emits no seller/manufacturer/brand substitution", () => {
  for (const locale of LOCALES) {
    const schema = productSchema(locale, product);
    for (const property of PRODUCT_ORIGIN_CLAIM_PROPERTIES) {
      assert.equal(
        property in schema,
        false,
        `${property} is an origin/ownership claim with no verified content field (${locale})`,
      );
    }
  }
});

test("the fact policy covers the roles the audit calls out", () => {
  // Guards the guard: silently shrinking the policy list would make the test
  // above vacuous.
  for (const property of ["brand", "manufacturer", "offers"]) {
    assert.ok(
      (PRODUCT_ORIGIN_CLAIM_PROPERTIES as readonly string[]).includes(property),
      `${property} must remain in the fact policy`,
    );
  }
});

/* ── the schema must still be useful and valid ──────────────────────────── */

test("Product schema still emits the verified product facts", () => {
  const schema = productSchema("en", product) as Record<string, unknown>;
  assert.equal(schema["@type"], "Product");
  assert.equal(schema["@id"], "https://feizfood.com/en/products/chicken-gizzard#product");
  assert.equal(schema.name, product.title);
  assert.equal(schema.description, product.description);
  assert.equal(schema.url, "https://feizfood.com/en/products/chicken-gizzard");
  assert.equal(schema.inLanguage, "en");
});

test("Product schema keeps the image object", () => {
  const schema = productSchema("en", product) as Record<string, unknown>;
  const image = schema.image as Record<string, unknown>;
  assert.equal(image["@type"], "ImageObject");
  assert.equal(image.url, `https://feizfood.com${product.image}`);
  assert.equal(image.caption, product.imageAlt);
});

test("Product schema keeps specs as additionalProperty", () => {
  const schema = productSchema("en", product) as Record<string, unknown>;
  assert.deepEqual(schema.additionalProperty, [
    { "@type": "PropertyValue", name: "Process", value: "IQF Frozen" },
    { "@type": "PropertyValue", name: "Storage", value: "-18°C" },
  ]);
});

test("a product without specs omits additionalProperty entirely", () => {
  const schema = productSchema("en", { ...product, specs: [] });
  assert.equal("additionalProperty" in schema, false);
});

test("Product schema remains serializable valid JSON-LD", () => {
  for (const locale of LOCALES) {
    const parsed = JSON.parse(JSON.stringify(productSchema(locale, product)));
    assert.equal(parsed["@context"], "https://schema.org");
    assert.equal(parsed["@type"], "Product");
    // Required-for-usefulness properties survive the brand removal.
    for (const key of ["name", "description", "url", "inLanguage"]) {
      assert.ok(parsed[key], `${key} missing for ${locale}`);
    }
  }
});
