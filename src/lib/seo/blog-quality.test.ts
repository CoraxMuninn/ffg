/**
 * Blog content-quality assistant: editorial checks, not a ranking score.
 */
import fs from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

import { getBlogPosts } from "@/lib/content";
import type { BlogPost } from "@/lib/content";
import { locales } from "@/lib/i18n/config";
import {
  analyzeBlogQuality,
  collectPublishBlockers,
  detectKeywordStuffing,
  extractHeadings,
  suggestInternalLinks,
  type BlogQualityInput,
  type InternalPath,
} from "@/lib/seo/blog-quality";
import { SITE_URL } from "@/lib/seo/config";
import { articleSchema } from "@/lib/seo/schema";

const catalog: InternalPath[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public", "admin", "internal-paths.json"), "utf8"),
).paths;

function sample(overrides: Partial<BlogQualityInput> = {}): BlogQualityInput {
  return {
    title: "What to Check When Buying Frozen Chicken Feet",
    slug: "what-to-check-when-sourcing-frozen-chicken-feet",
    excerpt: "Five practical points for frozen chicken feet buyers comparing grade, weight, and IQF form.",
    author: "Feiz Food Group Export Team",
    date: "2026-08-06",
    updated: "2026-08-12",
    image: "/media/blog/frozen-chicken-feet-studio.jpg",
    imageAlt: "Frozen chicken feet arranged on a stainless steel tray",
    category: "Sourcing",
    tags: ["IQF chicken feet", "chicken feet specification"],
    focusKeyphrase: "frozen chicken feet specification",
    seoTitle: "Buying Frozen Chicken Feet: 5 Checks",
    seoDescription:
      "Compare frozen chicken feet suppliers by grade, piece weight, IQF form, glaze, and the sample you will inspect.",
    related: ["/products/frozen-chicken-feet", "/quality-control"],
    body: `Frozen chicken feet buyers should write the specification before they compare offers.

## Define the grade and piece weight

Write the visual grade and the piece-weight range into the specification. Ask for a sample you can inspect.

## Confirm IQF form and glaze

IQF pieces should separate. Ask what glaze percentage is declared on the packing list.

## Plan the inspection

Agree how many cartons you will open and what happens if the sample fails.

Request the current document set through [contact](/contact) or review [quality control](/quality-control).
`,
    ...overrides,
  };
}

function fromPost(post: BlogPost): BlogQualityInput {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    author: post.author,
    date: post.date,
    updated: post.updated,
    image: post.image,
    imageAlt: post.imageAlt,
    imageCaption: post.imageCaption,
    category: post.category,
    tags: post.tags,
    focusKeyphrase: post.focusKeyphrase,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    ogImage: post.ogImage,
    ogImageAlt: post.ogImageAlt,
    related: post.related,
    body: post.body,
  };
}

test("the report includes an editorial heuristic score, not a Google ranking score", () => {
  const report = analyzeBlogQuality(sample(), { catalog });
  expect(report.score).toBeGreaterThanOrEqual(0);
  expect(report.score).toBeLessThanOrEqual(100);
  expect(report.categories.map((item) => item.id)).toEqual([
    "seo",
    "content",
    "keywords",
    "links",
    "structure",
  ]);
  expect(report.disclaimer.toLowerCase()).toMatch(/not a google ranking score/);
  expect(report.checks.every((item) => ["good", "attention", "required"].includes(item.status))).toBe(
    true,
  );
  expect(report.wordCount).toBeGreaterThan(0);
  expect(report.metrics.wordCount).toBe(report.wordCount);
});

test("a complete article has no publish blockers", () => {
  const report = analyzeBlogQuality(sample(), { catalog });
  expect(report.blockers).toEqual([]);
  expect(collectPublishBlockers(sample(), { catalog })).toEqual([]);
  expect(report.checks.some((item) => item.status === "good")).toBe(true);
});

test("missing required contract fields become blockers", () => {
  const blockers = collectPublishBlockers(
    sample({
      title: "",
      excerpt: "",
      image: "",
      imageAlt: "",
      slug: "Not A Slug",
      date: "06-08-2026",
      canonicalUrl: "http://example.com/x",
      related: ["/invented"],
      seoTitle: "x".repeat(61),
      seoDescription: "y".repeat(161),
      body: "# A body H1\n\n## Later\n",
    }),
    { catalog },
  );
  const ids = blockers.map((item) => item.id);
  expect(ids).toEqual(
    expect.arrayContaining([
      "req_title",
      "req_excerpt",
      "req_image",
      "req_image_alt",
      "req_slug",
      "req_date",
      "req_canonical",
      "req_related",
      "req_seo_title_len",
      "req_seo_desc_len",
      "req_no_h1",
    ]),
  );
});

test("quality recommendations warn and do not block publishing", () => {
  const thin = sample({
    focusKeyphrase: "frozen chicken feet specification",
    related: [],
    body: "In today's fast-paced world we delve into the landscape of poultry.\n\nIn this article we will unlock the potential of trade.",
  });
  const report = analyzeBlogQuality(thin, { catalog });
  const attention = report.checks.filter((item) => item.status === "attention");
  expect(attention.length).toBeGreaterThan(0);
  expect(attention.every((item) => item.group !== "ready" || item.id.startsWith("req_") === false || item.status !== "required")).toBe(
    true,
  );
  const blockerIds = new Set(report.blockers.map((item) => item.id));
  for (const item of attention) {
    expect(blockerIds.has(item.id)).toBe(false);
  }
});

test("updated before publication is a blocker; later revision is not", () => {
  expect(
    collectPublishBlockers(sample({ date: "2026-08-12", updated: "2026-08-01" }), { catalog }).some(
      (item) => item.id === "req_updated",
    ),
  ).toBe(true);
  expect(
    collectPublishBlockers(sample({ date: "2026-08-01", updated: "2026-08-12" }), { catalog }).some(
      (item) => item.id === "req_updated",
    ),
  ).toBe(false);
});

test("detectKeywordStuffing flags unnatural repetition, not a density target", () => {
  const phrase = "frozen chicken feet";
  const stuffed = Array.from({ length: 12 }, () => phrase).join(" ");
  expect(detectKeywordStuffing(stuffed, phrase)).toBe(true);
  expect(
    detectKeywordStuffing(
      "Buyers comparing frozen chicken feet should write the specification first. Then inspect a sample.",
      phrase,
    ),
  ).toBe(false);
  const report = analyzeBlogQuality(
    sample({
      focusKeyphrase: phrase,
      body: `${phrase} ${phrase} ${phrase} ${phrase} ${phrase} ${phrase} ${phrase} ${phrase}`,
    }),
    { catalog },
  );
  expect(report.checks.find((item) => item.id === "kw_stuffing")?.status).toBe("attention");
  expect(report.blockers.some((item) => item.id === "kw_stuffing")).toBe(false);
});

test("a missing keyphrase is allowed; an unused one needs attention", () => {
  const none = analyzeBlogQuality(sample({ focusKeyphrase: undefined }), { catalog });
  expect(none.checks.find((item) => item.id === "kw_focus")?.status).toBe("good");
  expect(none.checks.find((item) => item.id === "kw_present")?.status).toBe("attention");
  expect(none.keyword.present).toBe(false);
  expect(none.blockers.some((item) => item.id === "kw_present")).toBe(false);
  const unused = analyzeBlogQuality(
    sample({
      focusKeyphrase: "halal poultry documentation pack",
      title: "Cold-store layout notes",
      excerpt: "A short note about racking.",
      body: "## Racking\n\nDescribe aisle width.\n",
    }),
    { catalog },
  );
  expect(unused.checks.find((item) => item.id === "kw_focus")?.status).toBe("attention");
  expect(unused.keyword.inTitle).toBe(false);
});

test("heading structure rejects a body H1 and warns when H3 comes first", () => {
  expect(extractHeadings("## One\n### Two")[0]).toEqual({ level: 2, text: "One" });
  const h1 = analyzeBlogQuality(sample({ body: "# Title again\n\n## Later\n" }), { catalog });
  expect(h1.checks.find((item) => item.id === "req_no_h1")?.status).toBe("required");
  const inverted = analyzeBlogQuality(sample({ body: "### Detail\n\nSome text.\n" }), { catalog });
  expect(inverted.checks.find((item) => item.id === "structure_headings")?.status).toBe("attention");
});

test("internal-link suggestions use only catalogued paths", () => {
  const suggestions = suggestInternalLinks(
    sample({ related: [], body: "Write the frozen chicken feet specification before you compare offers." }),
    catalog,
  );
  expect(suggestions.length).toBeGreaterThan(0);
  expect(suggestions.some((item) => item.path === "/products/frozen-chicken-feet")).toBe(true);
  expect(suggestions.every((item) => catalog.some((known) => known.path === item.path))).toBe(true);
  expect(suggestions.some((item) => item.path === "/blog/what-to-check-when-sourcing-frozen-chicken-feet")).toBe(
    false,
  );
});

test("unknown related and body paths are rejected; invented URLs are never suggested", () => {
  const report = analyzeBlogQuality(
    sample({
      related: ["/does-not-exist"],
      body: "See the [made up page](/invented-page).\n\n## Next\n\nAsk for a sample.",
    }),
    { catalog },
  );
  expect(report.checks.find((item) => item.id === "req_related")?.status).toBe("required");
  expect(report.checks.find((item) => item.id === "link_internal")?.status).toBe("required");
  expect(report.suggestions.every((item) => item.path.startsWith("/"))).toBe(true);
  expect(report.suggestions.some((item) => item.path.includes("invented"))).toBe(false);
});

test("image and alt checks require a described featured image and warn on empty body alts", () => {
  const missing = analyzeBlogQuality(sample({ image: "", imageAlt: "" }), { catalog });
  expect(missing.checks.find((item) => item.id === "req_image")?.status).toBe("required");
  expect(missing.checks.find((item) => item.id === "req_image_alt")?.status).toBe("required");
  const stuffedAlt = analyzeBlogQuality(
    sample({
      imageAlt: "frozen chicken feet specification frozen chicken feet specification tray",
    }),
    { catalog },
  );
  expect(stuffedAlt.checks.find((item) => item.id === "img_featured")?.status).toBe("attention");
  const bodyAlt = analyzeBlogQuality(sample({ body: "## Photo\n\n![](/media/blog/x.jpg)\n" }), { catalog });
  expect(bodyAlt.checks.find((item) => item.id === "img_body")?.status).toBe("attention");
});

test("people-first checks flag generic AI wording and reward operational detail", () => {
  const generic = analyzeBlogQuality(
    sample({
      body: "In today's fast-paced world we delve into the landscape of poultry. Unlock the potential.",
    }),
    { catalog },
  );
  expect(generic.checks.find((item) => item.id === "people_filler")?.status).toBe("attention");
  expect(generic.checks.find((item) => item.id === "people_original")?.status).toBe("attention");
  const useful = analyzeBlogQuality(sample(), { catalog });
  expect(useful.checks.find((item) => item.id === "people_expertise")?.status).toBe("good");
  expect(useful.checks.find((item) => item.id === "people_useful")?.status).toBe("good");
});

test("metadata length and emptiness are classified correctly", () => {
  const longTitle = analyzeBlogQuality(sample({ seoTitle: "T".repeat(61) }), { catalog });
  expect(longTitle.checks.find((item) => item.id === "req_seo_title_len")?.status).toBe("required");
  const shortDesc = analyzeBlogQuality(sample({ seoDescription: "Too short." }), { catalog });
  expect(shortDesc.checks.find((item) => item.id === "search_meta")?.status).toBe("attention");
  expect(shortDesc.blockers.some((item) => item.id === "search_meta")).toBe(false);
});

test("BlogPosting JSON-LD stays consistent with visible article fields", () => {
  const post: BlogPost = {
    title: "What to Check When Buying Frozen Chicken Feet",
    slug: "what-to-check-when-sourcing-frozen-chicken-feet",
    excerpt: "Five practical points for frozen chicken feet buyers.",
    author: "Feiz Food Group Export Team",
    date: "2026-08-06",
    updated: "2026-08-12",
    image: "/media/blog/frozen-chicken-feet-studio.jpg",
    imageAlt: "Frozen chicken feet arranged on a stainless steel tray",
    tags: ["IQF chicken feet"],
    related: [],
    enabled: true,
    order: 1,
    body: "## Grade\n\nWrite the grade into the specification.\n",
    seoDescription: "Compare frozen chicken feet suppliers by grade and sample method.",
    ogImage: "/media/blog/some-other-social-crop.jpg",
  };
  const schema = articleSchema("en", post);
  expect(schema.headline).toBe(post.title);
  expect(schema.description).toBe(post.seoDescription);
  expect(schema.datePublished).toBe(post.date);
  expect(schema.dateModified).toBe(post.updated);
  const image = schema.image as { url: string; caption: string };
  expect(image.url).toBe(`${SITE_URL}${post.image}`);
  expect(image.caption).toBe(post.imageAlt);
  expect(image.url).not.toContain("some-other-social-crop");
  expect((schema.author as { "@type": string })["@type"]).toBe("Organization");
  expect((schema.publisher as { "@type": string })["@type"]).toBe("Organization");
  expect(schema.mainEntityOfPage).toEqual({
    "@type": "WebPage",
    "@id": `${SITE_URL}/en/blog/${post.slug}#webpage`,
  });
});

test("no check requires a word count or keyword density", () => {
  const report = analyzeBlogQuality(sample({ body: "Short." }), { catalog });
  for (const item of report.checks) {
    expect(item.why.toLowerCase()).not.toMatch(/must be at least \d+ words/);
    expect(item.how.toLowerCase()).not.toMatch(/keyword density/);
    expect(item.id).not.toBe("word_count");
  }
});

test("published articles have no contract blockers", () => {
  for (const locale of locales) {
    for (const post of getBlogPosts(locale)) {
      const blockers = collectPublishBlockers(fromPost(post), { catalog });
      expect(blockers, `${locale}/${post.slug}: ${blockers.map((item) => item.id).join(",")}`).toEqual([]);
    }
  }
});

test("a generic title needs attention for search intent; a buyer task does not", () => {
  const vague = analyzeBlogQuality(sample({ title: "Poultry news" }), { catalog });
  expect(vague.checks.find((item) => item.id === "search_intent")?.status).toBe("attention");
  expect(vague.blockers.some((item) => item.id === "search_intent")).toBe(false);
  const specific = analyzeBlogQuality(sample(), { catalog });
  expect(specific.checks.find((item) => item.id === "search_intent")?.status).toBe("good");
});

test("a meta description that ignores the title topic needs attention", () => {
  const report = analyzeBlogQuality(
    sample({
      title: "What to Check When Buying Frozen Chicken Feet",
      seoDescription:
        "Our team is pleased to share an update about company culture and the office garden this season.",
    }),
    { catalog },
  );
  expect(report.checks.find((item) => item.id === "search_meta")?.status).toBe("attention");
  expect(report.blockers.some((item) => item.id === "search_meta")).toBe(false);
});

test("Persian operational terms count as expertise, not only English jargon", () => {
  const report = analyzeBlogQuality(
    sample({
      locale: "fa",
      title: "بازرسی پای مرغ منجمد",
      excerpt: "نکات عملی برای مقایسه مشخصات و نمونه.",
      body: `خریدار باید مشخصات را پیش از مقایسه پیشنهاد بنویسد.

## بازرسی نمونه

درجه و وزن قطعه را در مشخصات ثبت کنید و نمونه را بازرسی کنید.

از طریق [تماس](/contact) مجموعه مدارک جاری را بخواهید.
`,
    }),
    { catalog },
  );
  expect(report.checks.find((item) => item.id === "people_expertise")?.status).toBe("good");
});

test("the generated catalog only lists known site paths", () => {
  expect(catalog.some((item) => item.path === "/products/frozen-chicken-feet")).toBe(true);
  expect(catalog.some((item) => item.path === "/quality-control")).toBe(true);
  expect(catalog.every((item) => item.path.startsWith("/"))).toBe(true);
  expect(catalog.some((item) => item.path.includes("://"))).toBe(false);
});

test("keyword placement and search intent are reported without becoming blockers", () => {
  const report = analyzeBlogQuality(
    sample({
      focusKeyphrase: "frozen chicken feet",
      title: "What to Check When Buying Frozen Chicken Feet",
      seoTitle: "Buying Frozen Chicken Feet: 5 Checks",
      seoDescription: "Compare frozen chicken feet suppliers by grade and sample method.",
    }),
    { catalog },
  );
  expect(report.keyword.present).toBe(true);
  expect(report.keyword.inTitle).toBe(true);
  expect(report.keyword.inSlug).toBe(true);
  expect(report.intent.type).toBe("informational");
  expect(report.intent.aligned).toBe(true);
  expect(report.blockers.some((item) => item.id.startsWith("kw_"))).toBe(false);
  expect(report.topActions.length).toBeLessThanOrEqual(5);
});

test("contract blockers cap the editorial score and never come from word count", () => {
  const empty = analyzeBlogQuality(
    sample({
      title: "",
      excerpt: "",
      image: "",
      imageAlt: "",
      slug: "",
      date: "",
      body: "",
      focusKeyphrase: undefined,
      related: [],
    }),
    { catalog },
  );
  expect(empty.blockers.length).toBeGreaterThan(0);
  expect(empty.score).toBeLessThanOrEqual(55);
  expect(empty.checks.some((item) => item.id === "word_count")).toBe(false);
  expect(empty.checks.find((item) => item.id === "content_depth")?.status).toBe("attention");
  expect(empty.blockers.some((item) => item.id === "content_depth")).toBe(false);
});
