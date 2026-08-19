/**
 * Blog SEO contract: CMS fields resolve through one helper into metadata,
 * Open Graph / Twitter, BlogPosting JSON-LD, and sitemap lastmod.
 */
import { expect, test } from "vitest";

import sitemapFn from "@/app/sitemap";
import type { BlogPost } from "@/lib/content";
import { getBlogPosts } from "@/lib/content";
import { isHttpsAbsoluteUrl, isKnownInternalPath } from "@/lib/content/internal-paths";
import { parseIsoDate } from "@/lib/content/parse";
import { locales } from "@/lib/i18n/config";
import { resolveBlogSeo } from "@/lib/seo/blog-meta";
import { SITE_URL } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { articleSchema } from "@/lib/seo/schema";

function samplePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    title: "What to Check When Buying Frozen Chicken Feet",
    slug: "what-to-check-when-sourcing-frozen-chicken-feet",
    excerpt: "Five practical points for frozen chicken feet buyers.",
    author: "Feiz Food Group Export Team",
    date: "2026-08-06",
    updated: "2026-08-12",
    image: "/media/blog/frozen-chicken-feet-studio.jpg",
    imageAlt: "Frozen chicken feet arranged on a stainless steel tray",
    imageCaption: "Inspection tray used for a sample check.",
    category: "Sourcing",
    tags: ["IQF chicken feet", "chicken feet specification"],
    focusKeyphrase: "frozen chicken feet specification",
    seoTitle: "Buying Frozen Chicken Feet: 5 Checks",
    seoDescription: "Compare frozen chicken feet suppliers by grade, weight, IQF form, glaze, and sample criteria.",
    ogTitle: "Five checks before you buy frozen chicken feet",
    ogDescription: "Grade, piece weight, IQF form, glaze, and sample method — written down.",
    ogImage: "/media/blog/frozen-chicken-feet-studio.jpg",
    ogImageAlt: "Frozen chicken feet on a tray",
    related: ["/products/frozen-chicken-feet", "/quality-control"],
    enabled: true,
    order: 1,
    body: "## 1. Define the grade\n\nWrite the visual requirements into the specification.\n",
    ...overrides,
  };
}

test("resolveBlogSeo falls back to title, excerpt, and featured image", () => {
  const seo = resolveBlogSeo(
    samplePost({
      seoTitle: undefined,
      seoDescription: undefined,
      ogTitle: undefined,
      ogDescription: undefined,
      ogImage: undefined,
      ogImageAlt: undefined,
      focusKeyphrase: undefined,
      updated: undefined,
    }),
  );
  expect(seo.title).toBe("What to Check When Buying Frozen Chicken Feet");
  expect(seo.description).toBe("Five practical points for frozen chicken feet buyers.");
  expect(seo.ogTitle).toBe(seo.title);
  expect(seo.ogDescription).toBe(seo.description);
  expect(seo.ogImage).toBe("/media/blog/frozen-chicken-feet-studio.jpg");
  expect(seo.ogImageAlt).toBe("Frozen chicken feet arranged on a stainless steel tray");
  expect(seo.modifiedTime).toBe("2026-08-06");
  expect(seo.canonical).toBeUndefined();
});

test("resolveBlogSeo prefers explicit CMS overrides", () => {
  const seo = resolveBlogSeo(samplePost());
  expect(seo.title).toBe("Buying Frozen Chicken Feet: 5 Checks");
  expect(seo.description).toMatch(/Compare frozen chicken feet/);
  expect(seo.ogTitle).toBe("Five checks before you buy frozen chicken feet");
  expect(seo.ogDescription).toMatch(/Grade, piece weight/);
  expect(seo.modifiedTime).toBe("2026-08-12");
  expect(seo.keywords).toContain("frozen chicken feet specification");
  expect(seo.keywords).toContain("IQF chicken feet");
});

test("articleSchema emits the required BlogPosting properties from CMS data", () => {
  const schema = articleSchema("en", samplePost());
  expect(schema["@type"]).toBe("BlogPosting");
  expect(schema.headline).toBe("What to Check When Buying Frozen Chicken Feet");
  expect(schema.description).toMatch(/Compare frozen chicken feet/);
  expect(schema.datePublished).toBe("2026-08-06");
  expect(schema.dateModified).toBe("2026-08-12");
  expect(schema.mainEntityOfPage).toEqual({
    "@type": "WebPage",
    "@id": `${SITE_URL}/en/blog/what-to-check-when-sourcing-frozen-chicken-feet#webpage`,
  });
  const image = schema.image as Record<string, unknown>;
  expect(image["@type"]).toBe("ImageObject");
  expect(image.url).toBe(`${SITE_URL}/media/blog/frozen-chicken-feet-studio.jpg`);
  const author = schema.author as Record<string, unknown>;
  expect(author["@type"]).toBe("Organization");
  expect(author["@type"]).not.toBe("Person");
  expect(author.name).toBe("Feiz Food Group Export Team");
  const publisher = schema.publisher as Record<string, unknown>;
  expect(publisher["@type"]).toBe("Organization");
  expect(publisher.name).toBe("Feiz Food Group");
  expect(String(schema.keywords)).toContain("frozen chicken feet specification");
});

test("articleSchema does not invent an author when the CMS leaves it empty", () => {
  const schema = articleSchema("en", samplePost({ author: undefined }));
  expect("author" in schema).toBe(false);
});

test("buildPageMetadata maps CMS social fields onto Open Graph and Twitter", () => {
  const seo = resolveBlogSeo(samplePost());
  const md = buildPageMetadata({
    locale: "en",
    title: seo.title,
    description: seo.description,
    path: `/blog/${samplePost().slug}`,
    ogImage: seo.ogImage,
    ogImageAlt: seo.ogImageAlt,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    article: {
      publishedTime: seo.publishedTime,
      modifiedTime: seo.modifiedTime,
      authors: seo.authors,
      tags: seo.tags,
    },
  });
  expect(md.title).toBe(seo.title);
  expect(md.description).toBe(seo.description);
  expect(md.openGraph?.title).toBe(seo.ogTitle);
  expect(md.openGraph?.description).toBe(seo.ogDescription);
  expect(md.openGraph && "type" in md.openGraph ? md.openGraph.type : undefined).toBe("article");
  expect(md.twitter && "card" in md.twitter ? md.twitter.card : undefined).toBe(
    "summary_large_image",
  );
  const twitterImages = md.twitter && "images" in md.twitter ? md.twitter.images : undefined;
  expect(twitterImages).toBeDefined();
});

test("a CMS canonical override replaces only the canonical, not hreflang", () => {
  const md = buildPageMetadata({
    locale: "en",
    title: "Title",
    description: "Description",
    path: "/blog/example",
    canonical: "https://feizfood.com/en/blog/canonical-target",
    availableLocales: ["en", "fa"],
  });
  expect(md.alternates?.canonical).toBe("https://feizfood.com/en/blog/canonical-target");
  const languages = md.alternates?.languages ?? {};
  expect(languages.en).toBe(`${SITE_URL}/en/blog/example`);
  expect(languages.fa).toBe(`${SITE_URL}/fa/blog/example`);
  expect(languages.ru).toBeUndefined();
});

test("every published article produces complete SEO metadata and BlogPosting schema", () => {
  for (const locale of locales) {
    for (const post of getBlogPosts(locale)) {
      const seo = resolveBlogSeo(post);
      expect(post.title.trim().length, `${locale}/${post.slug} title`).toBeGreaterThan(0);
      expect(post.excerpt.trim().length, `${locale}/${post.slug} excerpt`).toBeGreaterThan(0);
      expect(post.image, `${locale}/${post.slug} image`).toMatch(/^\/media\//);
      expect(post.imageAlt.trim().length, `${locale}/${post.slug} imageAlt`).toBeGreaterThan(0);
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (post.updated) {
        expect(post.updated >= post.date, `${locale}/${post.slug} updated`).toBe(true);
      }
      if (seo.title.length > 60) {
        throw new Error(`${locale}/${post.slug} seo title is ${seo.title.length} chars`);
      }
      expect(seo.description.length, `${locale}/${post.slug} description`).toBeLessThanOrEqual(160);

      const schema = articleSchema(locale, post);
      for (const key of [
        "headline",
        "description",
        "image",
        "datePublished",
        "dateModified",
        "publisher",
        "mainEntityOfPage",
      ]) {
        expect(schema[key], `${locale}/${post.slug} schema.${key}`).toBeTruthy();
      }
      if (post.author) {
        expect((schema.author as { "@type": string })["@type"]).toBe("Organization");
      }

      const md = buildPageMetadata({
        locale,
        title: seo.title,
        description: seo.description,
        path: `/blog/${post.slug}`,
        ogImage: seo.ogImage,
        ogImageAlt: seo.ogImageAlt,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        canonical: seo.canonical,
        article: {
          publishedTime: seo.publishedTime,
          modifiedTime: seo.modifiedTime,
          authors: seo.authors,
          tags: seo.tags,
        },
        availableLocales: ["en", "fa", "ru", "vi"],
      });
      expect(md.openGraph?.images).toBeDefined();
      expect(md.twitter && "images" in md.twitter ? md.twitter.images : undefined).toBeDefined();
    }
  }
});

test("sitemap lastmod for blog posts is the revision date when present, else the publication date", () => {
  const sitemap = sitemapFn();
  for (const locale of locales) {
    for (const post of getBlogPosts(locale)) {
      const entry = sitemap.find(
        (item) => item.url === `${SITE_URL}/${locale}/blog/${post.slug}`,
      );
      expect(entry, `${locale}/blog/${post.slug} missing from sitemap`).toBeDefined();
      const expected = new Date(post.updated ?? post.date).toISOString().slice(0, 10);
      const lastmod =
        entry?.lastModified instanceof Date
          ? entry.lastModified.toISOString().slice(0, 10)
          : String(entry?.lastModified ?? "").slice(0, 10);
      expect(lastmod).toBe(expected);
    }
  }
});

test("related and canonical helpers reject invented or non-https values", () => {
  expect(isKnownInternalPath("/products/frozen-chicken-feet")).toBe(true);
  expect(isKnownInternalPath("/quality-control")).toBe(true);
  expect(isKnownInternalPath("/products/does-not-exist")).toBe(false);
  expect(isKnownInternalPath("/invented")).toBe(false);
  expect(isHttpsAbsoluteUrl("https://feizfood.com/en/blog/x")).toBe(true);
  expect(isHttpsAbsoluteUrl("http://feizfood.com/en/blog/x")).toBe(false);
  expect(isHttpsAbsoluteUrl("/en/blog/x")).toBe(false);
});

test("parseIsoDate rejects invalid CMS dates and accepts YAML Date objects", () => {
  expect(parseIsoDate("f.md", "2026-08-06", "date", true)).toBe("2026-08-06");
  expect(parseIsoDate("f.md", new Date("2026-08-06T00:00:00Z"), "date", true)).toBe(
    "2026-08-06",
  );
  expect(parseIsoDate("f.md", undefined, "updated", false)).toBeUndefined();
  expect(() => parseIsoDate("f.md", "06-08-2026", "date", true)).toThrow(/YYYY-MM-DD/);
  expect(() => parseIsoDate("f.md", undefined, "date", true)).toThrow(/date/);
});
