/**
 * Deterministic Blog content-quality assistant.
 *
 * Editorial guidance aligned with Google Search Central (2026):
 *   - Creating helpful, reliable, people-first content
 *   - Optimizing for generative AI features (AI Overviews / AI Mode) is still SEO
 *
 * This module never produces a ranking score, never requires a word count or
 * keyword density, and never invents URLs, authors, or structured data.
 * Required items match the site's existing build contract. Everything else
 * warns. Safe to run in Node tests and (after transpile) in the Decap widget.
 */

export type CheckStatus = "good" | "attention" | "required";

export type CheckGroup =
  | "ready"
  | "search"
  | "people-first"
  | "visibility"
  | "keywords"
  | "links"
  | "images"
  | "structure";

export interface QualityCheck {
  id: string;
  group: CheckGroup;
  status: CheckStatus;
  label: string;
  why: string;
  how: string;
}

export interface InternalPath {
  path: string;
  title: string;
  collection: string;
}

export interface BlogQualityInput {
  title: string;
  slug: string;
  excerpt: string;
  author?: string;
  date?: string;
  updated?: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  category?: string;
  tags: string[];
  focusKeyphrase?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  related: string[];
  body: string;
  locale?: string;
}

export type QualityCategoryId = "seo" | "content" | "keywords" | "links" | "structure";

export type SearchIntentType =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational"
  | "unclear";

export interface QualityCategoryScore {
  id: QualityCategoryId;
  score: number;
  status: CheckStatus;
}

export interface KeywordPlacement {
  phrase: string;
  present: boolean;
  inTitle: boolean;
  inSeoTitle: boolean;
  inMeta: boolean;
  inIntro: boolean;
  inBody: boolean;
  inHeadings: boolean;
  inSlug: boolean;
  count: number;
  densityPercent: number;
  stuffed: boolean;
  relatedTerms: string[];
}

export interface SearchIntentEstimate {
  type: SearchIntentType;
  aligned: boolean;
  reason: string;
}

export interface QualityMetrics {
  wordCount: number;
  recommendedWordMin: number;
  recommendedWordMax: number;
  titleChars: number;
  seoTitleChars: number;
  metaChars: number;
  excerptChars: number;
  h2Count: number;
  h3Count: number;
  bodyH1Count: number;
  internalLinks: number;
  externalLinks: number;
  relatedCount: number;
  keywordCount: number;
  keywordDensityPercent: number;
}

export interface BlogQualityReport {
  checks: QualityCheck[];
  blockers: QualityCheck[];
  suggestions: InternalPath[];
  wordCount: number;
  disclaimer: string;
  /** Editorial heuristic 0–100. Not a Google ranking score. */
  score: number;
  categories: QualityCategoryScore[];
  metrics: QualityMetrics;
  keyword: KeywordPlacement;
  intent: SearchIntentEstimate;
  topActions: QualityCheck[];
}

/** Suggested briefing length for this site’s buyer articles. Not a ranking rule. */
export const EDITORIAL_WORD_RANGE = { min: 500, max: 1800 } as const;

export const QUALITY_DISCLAIMER =
  "Editorial checklist for people-first writing. Not a Google ranking score, and it does not guarantee visibility in Search, AI Overviews, or AI Mode.";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS_RE = /^https:\/\/\S+$/i;

const ENGLISH_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "for",
  "nor",
  "on",
  "in",
  "at",
  "to",
  "of",
  "by",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "with",
  "from",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "into",
  "about",
  "over",
  "after",
  "before",
  "when",
  "what",
  "which",
  "who",
  "how",
  "why",
  "your",
  "you",
  "our",
  "their",
  "his",
  "her",
]);

const AI_FILLER_PHRASES = [
  "in today's fast-paced",
  "in todays fast-paced",
  "in the ever-evolving",
  "delve into",
  "dive into",
  "it's important to note",
  "it is important to note",
  "unlock the potential",
  "comprehensive guide to everything",
  "in this article we will",
  "in this article, we will",
  "the world of",
  "landscape of",
  "revolutionize",
  "cutting-edge",
  "leverage",
  "multifaceted",
  "robust solution",
  "at the end of the day",
  "game-changer",
  "elevate your",
  "navigate the",
  "tapestry",
  "realm of",
  "crucial to understand",
  "whether you're a",
  "whether you are a",
  "look no further",
  "in conclusion,",
];

const EXPERTISE_TERMS = [
  "spec",
  "specification",
  "inspect",
  "inspection",
  "sample",
  "glaze",
  "carton",
  "pallet",
  "cold chain",
  "iqf",
  "block-frozen",
  "block frozen",
  "hs code",
  "health certificate",
  "document",
  "temperature",
  "moisture",
  "grade",
  "packing",
  "container",
  "load-out",
  "load out",
  "core temperature",
  "buyer",
  "importer",
  "export",
  "verify",
  "checklist",
];

/** Extra operational terms so FA/RU/VI copy is not scored only against English. */
const EXPERTISE_TERMS_I18N: Record<string, string[]> = {
  fa: ["مشخصات", "بازرسی", "نمونه", "زنجیره سرد", "صادرات", "خریدار", "درجه", "کارتن"],
  ru: ["спецификац", "инспекц", "образец", "холодов", "экспорт", "покупател", "сорт", "короб"],
  vi: ["thông số", "kiểm tra", "mẫu", "chuỗi lạnh", "xuất khẩu", "người mua", "cấp độ", "thùng"],
};

function expertiseLexicon(locale?: string): string[] {
  const extra = locale ? (EXPERTISE_TERMS_I18N[locale] ?? []) : [];
  return extra.length ? EXPERTISE_TERMS.concat(extra) : EXPERTISE_TERMS;
}

const NEXT_STEP_RE =
  /\b(contact|enquire|inquiry|rfq|sample|spec(?:ification)?|verify|check|next step|ask for|request)\b|تماس|استعلام|далее|свяж|liên hệ|yêu cầu/i;

const GENERIC_HEADING_RE =
  /^(introduction|overview|conclusion|summary|final thoughts|in conclusion|مقدمه|نتیجه|введение|заключение|giới thiệu|kết luận)$/i;

function check(
  id: string,
  group: CheckGroup,
  status: CheckStatus,
  label: string,
  why: string,
  how: string,
): QualityCheck {
  return { id, group, status, label, why, how };
}

export function trimToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

export function normalizeIsoDate(value: unknown): string {
  const raw = trimToString(value);
  if (!raw) return "";
  return raw.slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString().slice(0, 10) === value;
}

export function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function extractHeadings(body: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  for (const match of body.matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)) {
    headings.push({ level: match[1].length, text: match[2].trim() });
  }
  return headings;
}

export function extractMarkdownImages(body: string): { alt: string; src: string }[] {
  const images: { alt: string; src: string }[] = [];
  for (const match of body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
    images.push({ alt: match[1].trim(), src: match[2].trim() });
  }
  return images;
}

export function extractMarkdownLinks(body: string): { text: string; href: string }[] {
  const links: { text: string; href: string }[] = [];
  for (const match of body.matchAll(/(?<!!)\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g)) {
    links.push({ text: match[1].trim(), href: match[2].trim() });
  }
  return links;
}

function significantTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff\u0600-\u06ff\u00c0-\u024f\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !ENGLISH_STOPWORDS.has(token));
}

function countPhrase(haystack: string, phrase: string): number {
  const needle = phrase.trim().toLowerCase();
  if (!needle) return 0;
  const source = haystack.toLowerCase();
  let count = 0;
  let from = 0;
  while (from <= source.length) {
    const at = source.indexOf(needle, from);
    if (at === -1) break;
    count += 1;
    from = at + needle.length;
  }
  return count;
}

function firstParagraph(body: string): string {
  const withoutHeadings = body.replace(/^#{1,6}\s+.*$/gm, "").trim();
  const block = withoutHeadings.split(/\n\s*\n/)[0] ?? "";
  return block.trim();
}

function lastBlock(body: string): string {
  const parts = body
    .trim()
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?؟。])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function catalogHas(catalog: InternalPath[], href: string): boolean {
  const [pathname] = href.split(/[?#]/);
  return catalog.some((item) => item.path === pathname);
}

export function detectKeywordStuffing(text: string, keyphrase: string): boolean {
  const phrase = keyphrase.trim();
  if (!phrase) return false;
  const words = wordCount(text);
  const count = countPhrase(text, phrase);
  if (count === 0) return false;
  const collapsed = text.toLowerCase().replace(/\s+/g, " ");
  const triple = `${phrase.toLowerCase()} ${phrase.toLowerCase()} ${phrase.toLowerCase()}`;
  if (collapsed.includes(triple)) return true;
  if (words > 0 && count >= 5 && count / words > 0.04) return true;
  if (count >= 8) return true;
  return false;
}

export function suggestInternalLinks(
  input: BlogQualityInput,
  catalog: InternalPath[],
): InternalPath[] {
  const used = new Set<string>();
  for (const href of input.related) used.add(href.split(/[?#]/)[0] ?? href);
  for (const link of extractMarkdownLinks(input.body)) {
    if (link.href.startsWith("/") && !link.href.startsWith("//")) {
      used.add(link.href.split(/[?#]/)[0] ?? link.href);
    }
  }
  const self = `/blog/${input.slug}`;
  used.add(self);

  const query = significantTokens(
    [input.title, input.focusKeyphrase ?? "", input.excerpt, ...(input.tags ?? []), input.body.slice(0, 1200)].join(
      " ",
    ),
  );
  if (query.length === 0) return [];

  const scored = catalog
    .filter((item) => !used.has(item.path))
    .map((item) => {
      const hay = new Set(significantTokens(`${item.title} ${item.path} ${item.collection}`));
      let score = 0;
      for (const token of query) {
        if (hay.has(token)) score += 2;
        else if (`${item.title} ${item.path}`.toLowerCase().includes(token)) score += 1;
      }
      return { item, score };
    })
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score || a.item.path.localeCompare(b.item.path));

  const picked: InternalPath[] = [];
  const seen = new Set<string>();
  for (const entry of scored) {
    if (seen.has(entry.item.path)) continue;
    seen.add(entry.item.path);
    picked.push(entry.item);
    if (picked.length === 5) break;
  }
  return picked;
}

function publishContractChecks(input: BlogQualityInput, catalog: InternalPath[]): QualityCheck[] {
  const title = trimToString(input.title);
  const excerpt = trimToString(input.excerpt);
  const slug = trimToString(input.slug);
  const image = trimToString(input.image);
  const imageAlt = trimToString(input.imageAlt);
  const date = normalizeIsoDate(input.date);
  const updated = normalizeIsoDate(input.updated);
  const seoTitle = trimToString(input.seoTitle);
  const seoDescription = trimToString(input.seoDescription);
  const canonical = trimToString(input.canonicalUrl);
  const related = (input.related ?? []).map((item) => trimToString(item)).filter(Boolean);
  const headings = extractHeadings(input.body);

  const unknownRelated = catalog.length
    ? related.filter((href) => !catalogHas(catalog, href))
    : related.filter((href) => !href.startsWith("/") || href.startsWith("//"));

  return [
    check(
      "req_title",
      "ready",
      title ? "good" : "required",
      "Title",
      "The title is the page H1, the BlogPosting headline, and the default search title.",
      "Write a specific headline a buyer would recognize. Do not start the body with #.",
    ),
    check(
      "req_excerpt",
      "ready",
      excerpt ? "good" : "required",
      "Excerpt / description",
      "The excerpt is the listing summary and the fallback meta description.",
      "Write 1–2 sentences that say what the reader will be able to do after reading.",
    ),
    check(
      "req_image",
      "ready",
      image ? "good" : "required",
      "Featured image",
      "A published article needs a real featured image for the page, listings, and default social image.",
      "Upload a wide photograph to the media library. Do not invent a stock scene that did not happen.",
    ),
    check(
      "req_image_alt",
      "ready",
      image && imageAlt ? "good" : "required",
      "Featured image alt text",
      "Alt text describes the photograph for readers who cannot see it. Keyword stuffing here is harmful.",
      "Describe what is visibly shown, in the article language.",
    ),
    check(
      "req_slug",
      "ready",
      slug && SLUG_RE.test(slug) ? "good" : "required",
      "Slug",
      "The slug is the stable English URL segment shared across locales.",
      "Use lowercase letters, numbers, and hyphens only. Keep it identical in every language collection.",
    ),
    check(
      "req_date",
      "ready",
      date && isValidIsoDate(date) ? "good" : "required",
      "Publication date",
      "datePublished and sitemap lastmod (when there is no revision) come from this field.",
      "Pick a real calendar date. Do not change it later just to look fresh.",
    ),
    check(
      "req_updated",
      "ready",
      !updated || (isValidIsoDate(updated) && (!date || updated >= date)) ? "good" : "required",
      "Revision date",
      "If set, the revision must be on or after publication. It becomes dateModified and sitemap lastmod.",
      "Set a revision date only when the article actually changed.",
    ),
    check(
      "req_canonical",
      "ready",
      !canonical || HTTPS_RE.test(canonical) ? "good" : "required",
      "Canonical URL",
      "A canonical override must be an absolute https URL. Leave it empty to use this article URL.",
      "Use this only for a syndicated copy. Hreflang is still generated from real translations.",
    ),
    check(
      "req_related",
      "ready",
      unknownRelated.length === 0 ? "good" : "required",
      "Related internal pages",
      "Unknown paths fail the production build. The site never invents URLs.",
      unknownRelated.length
        ? `These paths are not on the site: ${unknownRelated.join(", ")}. Use existing root-relative paths such as /products/frozen-chicken-feet.`
        : "Use existing root-relative paths only — no locale prefix.",
    ),
    check(
      "req_seo_title_len",
      "ready",
      !seoTitle || seoTitle.length <= 60 ? "good" : "required",
      "SEO title length",
      "An override longer than 60 characters is truncated in search results and fails the build.",
      "Shorten the SEO title, or leave it empty to use the article title.",
    ),
    check(
      "req_seo_desc_len",
      "ready",
      !seoDescription || seoDescription.length <= 160 ? "good" : "required",
      "Meta description length",
      "An override longer than 160 characters fails the build.",
      "Trim the meta description, or leave it empty to use the excerpt.",
    ),
    check(
      "req_no_h1",
      "ready",
      headings.some((heading) => heading.level === 1) ? "required" : "good",
      "Heading hierarchy (no body H1)",
      "The title field is the only H1. A Markdown # in the body duplicates it.",
      "Start sections with Heading 2, then Heading 3.",
    ),
  ];
}

function searchChecks(input: BlogQualityInput): QualityCheck[] {
  const title = trimToString(input.title);
  const excerpt = trimToString(input.excerpt);
  const seoTitle = trimToString(input.seoTitle);
  const seoDescription = trimToString(input.seoDescription);
  const displayTitle = seoTitle || title;
  const displayDescription = seoDescription || excerpt;
  const clickbait = /(you won'?t believe|shocking|unbelievable|must[- ]see|secret trick)/i.test(title);

  let titleStatus: CheckStatus = "good";
  let titleWhy = "The title reads as a clear, specific summary of the article.";
  let titleHow = "Keep it descriptive. Google asks whether the heading is a helpful summary, not a teaser.";
  if (!title) {
    titleStatus = "required";
    titleWhy = "Without a title the page has no H1 and no headline.";
    titleHow = "Add a specific headline.";
  } else if (clickbait || title === title.toUpperCase()) {
    titleStatus = "attention";
    titleWhy = "ALL-CAPS or shocking titles are the opposite of a helpful summary.";
    titleHow = "Rewrite it as the sentence you would put on a printed briefing.";
  } else if (title.length > 70) {
    titleStatus = "attention";
    titleWhy = "Very long titles wrap awkwardly. This is a display note, not a ranking rule.";
    titleHow = "Shorten the visible title. Put nuance in the first paragraph.";
  }

  let metaStatus: CheckStatus = "good";
  let metaWhy = "Readers get an honest snippet of what the article covers.";
  let metaHow = "Leave the SEO description empty to reuse the excerpt, or write a 70–160 character snippet.";
  if (!displayDescription) {
    metaStatus = "required";
    metaWhy = "Search and social have nothing to show without an excerpt or meta description.";
    metaHow = "Write the excerpt first.";
  } else if (seoDescription && seoDescription.length < 70) {
    metaStatus = "attention";
    metaWhy = "A very short override is usually less useful than the excerpt.";
    metaHow = "Write a complete sentence, or clear the field to use the excerpt.";
  } else if (displayDescription.toLowerCase() === title.toLowerCase()) {
    metaStatus = "attention";
    metaWhy = "Repeating the title as the description wastes the snippet.";
    metaHow = "Say what the reader will learn or check, not the title again.";
  } else {
    const titleTokens = significantTokens(title);
    const descTokens = new Set(significantTokens(displayDescription));
    const shared = titleTokens.filter((token) => descTokens.has(token)).length;
    if (titleTokens.length > 0 && shared === 0) {
      metaStatus = "attention";
      metaWhy = "The snippet does not mention the topic named in the title.";
      metaHow = "Reuse one or two specific words from the title so the result matches the page.";
    }
  }

  const intentCue =
    /how|what|when|why|vs\.?|versus|check|guide|compare|source|buy|checklist|چگونه|چیست|چه |как |что |làm sao|cách |kiểm tra|so sánh/i.test(
      title,
    ) || significantTokens(title).length >= 4;
  const intentStatus: CheckStatus = !title || intentCue ? "good" : "attention";

  return [
    check("search_title", "search", titleStatus, "Title quality and clarity", titleWhy, titleHow),
    check(
      "search_intent",
      "search",
      intentStatus,
      "Search intent",
      intentStatus === "good"
        ? "The title names a task or question a buyer would actually have."
        : "The title is too generic to match a specific search intent.",
      "Name the decision or check (for example, what to inspect, or how to compare IQF with block-frozen). Do not write a teaser.",
    ),
    check(
      "search_meta",
      "search",
      metaStatus,
      "Meta description quality",
      metaWhy,
      metaHow,
    ),
    check(
      "search_title_match",
      "search",
      displayTitle && title && significantTokens(displayTitle).length > 0 ? "good" : "attention",
      "Search title matches the article",
      "The SEO title may differ from the H1, but it should still describe this article.",
      "Do not write a search title for a different topic than the body.",
    ),
  ];
}

function structureChecks(input: BlogQualityInput): QualityCheck[] {
  const headings = extractHeadings(input.body);
  const h2 = headings.filter((heading) => heading.level === 2);
  const firstHeading = headings[0];
  const genericOnly =
    headings.length > 0 && headings.every((heading) => GENERIC_HEADING_RE.test(heading.text));
  const h3BeforeH2 = Boolean(firstHeading && firstHeading.level >= 3);

  let headingStatus: CheckStatus = "good";
  let headingWhy = "Sections use Heading 2 / Heading 3 under the page H1.";
  let headingHow = "Keep one idea per heading. Prefer words a buyer would actually look for.";
  if (headings.some((heading) => heading.level === 1)) {
    headingStatus = "required";
    headingWhy = "A body H1 competes with the title.";
    headingHow = "Change # to ##.";
  } else if (h3BeforeH2) {
    headingStatus = "attention";
    headingWhy = "A Heading 3 appeared before any Heading 2, so the outline is inverted.";
    headingHow = "Start with Heading 2, then nest Heading 3 underneath.";
  } else if (h2.length === 0 && wordCount(input.body) > 0) {
    headingStatus = "attention";
    headingWhy = "A wall of text is harder to scan. Google recommends organizing pages with headings.";
    headingHow = "Add a few Heading 2s that name the checks or questions the article answers. There is no required count.";
  } else if (genericOnly) {
    headingStatus = "attention";
    headingWhy = "Headings like “Introduction” or “Conclusion” do not tell the reader what they will learn.";
    headingHow = "Rename headings so they describe the section (for example, “What to put in the specification”).";
  }

  const intro = firstParagraph(input.body);
  const titleTokens = significantTokens(input.title);
  const introHits = titleTokens.filter((token) => intro.toLowerCase().includes(token)).length;
  const introStatus: CheckStatus =
    !input.body.trim()
      ? "attention"
      : titleTokens.length === 0 || introHits >= Math.min(2, titleTokens.length)
        ? "good"
        : "attention";

  const bodyTokens = new Set(significantTokens(`${input.body} ${headings.map((h) => h.text).join(" ")}`));
  const delivered = titleTokens.filter((token) => bodyTokens.has(token)).length;
  const deliverStatus: CheckStatus =
    titleTokens.length === 0 || delivered >= Math.ceil(titleTokens.length * 0.5) ? "good" : "attention";

  const closing = `${headings[headings.length - 1]?.text ?? ""} ${lastBlock(input.body)}`;
  const conclusionStatus: CheckStatus = NEXT_STEP_RE.test(closing) || !input.body.trim() ? "good" : "attention";

  const bodySentences = sentences(input.body.replace(/^#{1,6}\s+.+$/gm, " "));
  const long = bodySentences.filter((sentence) => wordCount(sentence) > 40).length;
  const avg =
    bodySentences.length === 0
      ? 0
      : bodySentences.reduce((sum, sentence) => sum + wordCount(sentence), 0) / bodySentences.length;
  const readabilityStatus: CheckStatus =
    bodySentences.length === 0 || (avg <= 38 && long / Math.max(bodySentences.length, 1) <= 0.3)
      ? "good"
      : "attention";

  const grams = new Map<string, number>();
  const tokens = significantTokens(input.body);
  for (let i = 0; i <= tokens.length - 5; i += 1) {
    const gram = tokens.slice(i, i + 5).join(" ");
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  const keyphrase = trimToString(input.focusKeyphrase).toLowerCase();
  const repeated = [...grams.entries()].filter(
    ([gram, count]) => count >= 3 && (!keyphrase || !gram.includes(keyphrase)),
  );
  const repetitionStatus: CheckStatus = repeated.length === 0 ? "good" : "attention";

  return [
    check("structure_headings", "structure", headingStatus, "Heading hierarchy", headingWhy, headingHow),
    check(
      "structure_intro",
      "structure",
      introStatus,
      "Introduction establishes the topic",
      introStatus === "good"
        ? "The opening is recognizably about the same subject as the title."
        : "The opening does not mention the topic named in the title.",
      "In the first paragraph, say who the article is for and what they will be able to check or decide.",
    ),
    check(
      "structure_delivers",
      "structure",
      deliverStatus,
      "Article delivers on its title",
      deliverStatus === "good"
        ? "The body uses the same specific language as the title."
        : "The title promises a topic the body barely mentions.",
      "Either retitle to match what you wrote, or add the missing checks the title advertised.",
    ),
    check(
      "structure_conclusion",
      "structure",
      conclusionStatus,
      "Useful next steps",
      conclusionStatus === "good"
        ? "The ending points the reader to a next action."
        : "The article stops without telling the reader what to do with the information.",
      "Close with a concrete next step — request a specification, ask for a sample protocol, or open the contact form. Do not add a fake FAQ just to fill space.",
    ),
    check(
      "structure_readability",
      "structure",
      readabilityStatus,
      "Readability",
      readabilityStatus === "good"
        ? "Sentences look scannable. This is not a grade-level ranking factor."
        : "Several sentences run very long, which is hard on a phone.",
      "Split long sentences. Google has no preferred word count and no required reading-grade score.",
    ),
    check(
      "structure_repetition",
      "structure",
      repetitionStatus,
      "Excessive repetition",
      repetitionStatus === "good"
        ? "No copied 5-word run stood out."
        : `Repeated phrasing: “${repeated[0]?.[0] ?? ""}”.`,
      "Say it once, then move on. Do not repeat a phrase to hit a density target — Google has none.",
    ),
  ];
}

function peopleFirstChecks(input: BlogQualityInput): QualityCheck[] {
  const body = input.body;
  const words = wordCount(body);
  const lower = body.toLowerCase();
  const expertiseHits = expertiseLexicon(input.locale).filter((term) => lower.includes(term)).length;
  const hasNumbers = /\d/.test(body);
  const fillerHits = AI_FILLER_PHRASES.filter((phrase) => lower.includes(phrase));
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("#"));

  const usefulStatus: CheckStatus = words === 0 || paragraphs.length < 2 ? "attention" : "good";
  const expertiseStatus: CheckStatus =
    words === 0 ? "attention" : expertiseHits >= 2 || (expertiseHits >= 1 && hasNumbers) ? "good" : "attention";
  const originalStatus: CheckStatus = fillerHits.length >= 2 ? "attention" : expertiseHits >= 1 || hasNumbers ? "good" : "attention";
  const beyondStatus: CheckStatus = expertiseHits >= 2 && hasNumbers ? "good" : "attention";
  const intentStatus: CheckStatus =
    extractHeadings(body).length > 0 ||
    /[?？]/.test(body) ||
    /check|verify|compare|ask|specify|بررسی|مقایسه|مشخص|спроси|сравн|провер|kiểm tra|so sánh|hỏi/i.test(body)
      ? "good"
      : "attention";
  const satisfiedStatus: CheckStatus =
    NEXT_STEP_RE.test(body) || extractHeadings(body).length >= 2 ? "good" : "attention";
  const claimsStatus: CheckStatus = /\b(iso|haccp|halal|certified|certificate number|\$|€|price guaranteed)\b/i.test(
    body,
  ) && !/ask|verify|request|typical|example/i.test(body)
    ? "attention"
    : "good";
  const trustStatus: CheckStatus =
    trimToString(input.author) || /\/about|\/quality-control|\/certifications/i.test(body) ? "good" : "attention";

  return [
    check(
      "people_useful",
      "people-first",
      usefulStatus,
      "Genuinely useful to the intended audience",
      usefulStatus === "good"
        ? "There is enough structured explanation for a buyer who landed here on purpose."
        : "The body is too thin to leave a reader satisfied.",
      "Write the checks you would actually walk through on a call. Google asks: would this audience find it useful if they came directly to you?",
    ),
    check(
      "people_expertise",
      "people-first",
      expertiseStatus,
      "Relevant / first-hand expertise",
      expertiseStatus === "good"
        ? "The copy uses operational language rather than generic praise."
        : "Nothing here shows that the writer has handled the product, the documents, or the cold chain.",
      "Add a concrete detail from export work (what you inspect, what you write into a spec, what you refuse to invent). Keep the byline as the team — do not invent a named person.",
    ),
    check(
      "people_original",
      "people-first",
      originalStatus,
      "Original information or analysis",
      originalStatus === "good"
        ? "The article is not only filler phrasing."
        : fillerHits.length
          ? `Generic AI-style phrasing: “${fillerHits.slice(0, 2).join("”, “")}”.`
          : "The article could be a rewrite of common advice. Add something only this desk would know.",
      "Google asks whether the page goes beyond copying other sources. Add a worked example, a buyer checklist, or a distinction you actually use.",
    ),
    check(
      "people_beyond",
      "people-first",
      beyondStatus,
      "Goes beyond rewriting common information",
      beyondStatus === "good"
        ? "Specific process language and figures are present."
        : "This still reads like a commodity summary.",
      "Name the decision the importer has to make. Do not add length for its own sake — Google has no preferred word count.",
    ),
    check(
      "people_intent",
      "people-first",
      intentStatus,
      "Answers the likely reader intent",
      intentStatus === "good"
        ? "The structure looks like it is answering a buyer’s question."
        : "It is unclear what question a searcher would have answered.",
      "State the question in the title or first heading, then answer it before expanding.",
    ),
    check(
      "people_satisfied",
      "people-first",
      satisfiedStatus,
      "Leaves the reader satisfied",
      satisfiedStatus === "good"
        ? "The reader can leave with a next action or a complete set of checks."
        : "A reader may still need to search again.",
      "Google’s people-first test: will someone leave feeling they learned enough to achieve their goal?",
    ),
    check(
      "people_claims",
      "people-first",
      claimsStatus,
      "Claims supported where appropriate",
      claimsStatus === "good"
        ? "No hard commercial claim jumped out as unsourced."
        : "Certificates, prices, or guarantees appear without “ask / verify / request”.",
      "Do not invent certificate numbers, prices, or customer names. Link to /certifications or tell the reader to request the current document set.",
    ),
    check(
      "people_trust",
      "people-first",
      trustStatus,
      "Clear and trustworthy",
      trustStatus === "good"
        ? "A team byline or a link to an about / quality page is present."
        : "Readers cannot see who stands behind the article.",
      "Keep the organization byline. Link to /about or /quality-control. Do not invent an individual author.",
    ),
    check(
      "people_filler",
      "people-first",
      fillerHits.length === 0 ? "good" : "attention",
      "Unnecessary filler / generic AI wording",
      fillerHits.length === 0
        ? "No stock AI phrases were detected."
        : `Filler to rewrite: “${fillerHits.slice(0, 3).join("”, “")}”.`,
      "Delete throat-clearing. Google evaluates whether content looks hastily produced, not which tool drafted it.",
    ),
  ];
}

function visibilityChecks(input: BlogQualityInput): QualityCheck[] {
  const headings = extractHeadings(input.body);
  const links = extractMarkdownLinks(input.body);
  const paragraphs = input.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("#") && !part.startsWith("!["));

  const firstAnswer = paragraphs[0] ?? "";
  const concise =
    firstAnswer.length > 0 && wordCount(firstAnswer) <= 90 && wordCount(firstAnswer) >= 8 ? "good" : "attention";

  const internal = links.filter((link) => link.href.startsWith("/") && !link.href.startsWith("//"));
  const hasInternal = internal.length > 0 || (input.related ?? []).length > 0;

  return [
    check(
      "vis_crawlable",
      "visibility",
      paragraphs.length > 0 ? "good" : "attention",
      "Crawlable text content",
      paragraphs.length > 0
        ? "The article is real text in the Markdown body, which the site renders as HTML."
        : "There is almost no indexable text — images alone are not an article.",
      "Write the explanation as paragraphs and lists. No special AI file (llms.txt) is required; Google says not to create one.",
    ),
    check(
      "vis_headings",
      "visibility",
      headings.some((heading) => heading.level === 2) ? "good" : "attention",
      "Clear headings",
      "Headings help people scan and help systems quote the relevant passage. This is not “chunking for AI”.",
      "Use Heading 2 for each real question or check. Google says there is no need to break the page into tiny AI chunks.",
    ),
    check(
      "vis_answers",
      "visibility",
      concise as CheckStatus,
      "Concise answers to important questions",
      concise === "good"
        ? "The first paragraph can stand on its own as an answer."
        : "Open with a direct answer, then expand. Do not rewrite the whole article “for AI”.",
      "Google: you do not need to write in a special way for AI Overviews or AI Mode. Write for the importer.",
    ),
    check(
      "vis_context",
      "visibility",
      trimToString(input.category) || (input.tags ?? []).length > 0 || hasInternal ? "good" : "attention",
      "Useful contextual information",
      "Category, tags, and links to products/markets tell readers (and systems) which entity this article is about.",
      "Pick a category and link the product or market the article is actually about.",
    ),
    check(
      "vis_internal",
      "visibility",
      hasInternal ? "good" : "attention",
      "Strong internal links",
      hasInternal
        ? "The article points at existing pages on this site."
        : "No internal links yet. Google asks that links be crawlable so other pages can be discovered.",
      "Link existing paths such as /products/frozen-chicken-feet or /quality-control. Never invent a URL.",
    ),
    check(
      "vis_images",
      "visibility",
      trimToString(input.image) && trimToString(input.imageAlt) ? "good" : "attention",
      "Relevant high-quality images",
      "A described photograph helps people. Google recommends useful images; it does not ask for invented dimensions.",
      "Use a real photograph and write alt text that matches what is shown.",
    ),
    check(
      "vis_schema",
      "visibility",
      trimToString(input.title) && trimToString(input.excerpt) && trimToString(input.image) && normalizeIsoDate(input.date)
        ? "good"
        : "attention",
      "Structured data matches visible content",
      "BlogPosting is generated automatically from the title, excerpt, featured image, dates, team byline, and URL. No extra AI schema is added.",
      "Keep those fields true. Do not add FAQ or other schema that is not on the page. Google says structured data is not a special AI-Overview signal.",
    ),
    check(
      "vis_entity",
      "visibility",
      hasInternal || /\/products\/|\/markets\//.test(input.body) ? "good" : "attention",
      "Clear entity / topic relationships",
      "Linking a real product or market page is how this site expresses what the article is about.",
      "Add a related path or an in-body link to the product, market, or process page that already exists.",
    ),
    check(
      "vis_unique",
      "visibility",
      wordCount(input.body) > 0 && !detectKeywordStuffing(input.body, trimToString(input.focusKeyphrase))
        ? "good"
        : "attention",
      "Unique useful information",
      "Visibility in Search and in AI features comes from non-commodity, people-first pages — not from GEO/AEO hacks.",
      "Add a distinction you actually use in export work. Ignore llms.txt, mention-schemes, and “AI word counts”.",
    ),
  ];
}

export function analyzeKeywordPlacement(input: BlogQualityInput): KeywordPlacement {
  const phrase = trimToString(input.focusKeyphrase);
  const title = trimToString(input.title);
  const seoTitle = trimToString(input.seoTitle);
  const meta = trimToString(input.seoDescription) || trimToString(input.excerpt);
  const intro = firstParagraph(input.body);
  const headingText = extractHeadings(input.body)
    .map((heading) => heading.text)
    .join("\n");
  const slug = trimToString(input.slug);
  const body = input.body;
  const haystack = `${title}\n${seoTitle}\n${meta}\n${body}`;
  const count = phrase ? countPhrase(haystack, phrase) : 0;
  const words = Math.max(wordCount(haystack), 1);
  const phraseWords = phrase ? Math.max(wordCount(phrase), 1) : 1;
  const densityPercent = phrase ? Math.round(((count * phraseWords) / words) * 1000) / 10 : 0;
  const phraseTokens = significantTokens(phrase);
  const slugHits = phraseTokens.filter((token) => slug.includes(token)).length;
  const inSlug = phraseTokens.length > 0 && slugHits >= Math.min(2, phraseTokens.length);
  const phraseTokenSet = new Set(phraseTokens);
  const relatedTerms = significantTokens(title)
    .filter((token) => !phraseTokenSet.has(token))
    .slice(0, 6);

  return {
    phrase,
    present: Boolean(phrase),
    inTitle: phrase ? countPhrase(title, phrase) > 0 : false,
    inSeoTitle: phrase ? countPhrase(seoTitle, phrase) > 0 : false,
    inMeta: phrase ? countPhrase(meta, phrase) > 0 : false,
    inIntro: phrase ? countPhrase(intro, phrase) > 0 : false,
    inBody: phrase ? countPhrase(body, phrase) > 0 : false,
    inHeadings: phrase ? countPhrase(headingText, phrase) > 0 : false,
    inSlug,
    count,
    densityPercent,
    stuffed: phrase ? detectKeywordStuffing(haystack, phrase) : false,
    relatedTerms,
  };
}

const INTENT_INFORMATIONAL =
  /how|what|when|why|vs\.?|versus|guide|checklist|compare|چگونه|چیست|چه |как |что |làm sao|cách |kiểm tra|so sánh/i;
const INTENT_TRANSACTIONAL =
  /buy|order|quote|rfq|price|contact|request a sample|خرید|استعلام|купить|báo giá|liên hệ/i;
const INTENT_COMMERCIAL =
  /spec(?:ification)?|source|supplier|inspect|grade|quality|تأمین|مشخصات|поставщик|nhà cung cấp/i;
const INTENT_NAVIGATIONAL = /feiz food|about us|contact us|درباره ما|о нас/i;

export function estimateSearchIntent(input: BlogQualityInput): SearchIntentEstimate {
  const title = `${trimToString(input.title)} ${trimToString(input.seoTitle)}`;
  const body = input.body;
  let type: SearchIntentType = "unclear";
  if (INTENT_NAVIGATIONAL.test(title)) type = "navigational";
  else if (INTENT_INFORMATIONAL.test(title)) type = "informational";
  else if (INTENT_TRANSACTIONAL.test(title)) type = "transactional";
  else if (INTENT_COMMERCIAL.test(title)) type = "commercial";
  else if (significantTokens(title).length >= 4) type = "informational";

  let aligned = true;
  let reason = "Title and body appear to serve the same reader job.";
  if (type === "unclear") {
    aligned = false;
    reason = "The title is too generic to name a specific search intent.";
  } else if (type === "transactional" && body.trim() && !NEXT_STEP_RE.test(body)) {
    aligned = false;
    reason = "The title looks transactional, but the body never offers a next step.";
  } else if (type === "informational" && wordCount(body) > 80 && extractHeadings(body).length === 0) {
    aligned = false;
    reason = "An informational title usually needs scannable headings that answer the question.";
  }
  return { type, aligned, reason };
}

function keywordChecks(input: BlogQualityInput): QualityCheck[] {
  const keyphrase = trimToString(input.focusKeyphrase);
  const haystack = `${input.title}\n${input.excerpt}\n${input.seoTitle ?? ""}\n${input.body}`;
  const opening = `${input.title}\n${input.excerpt}\n${firstParagraph(input.body)}`;
  const stuffed = keyphrase ? detectKeywordStuffing(haystack, keyphrase) : false;
  const mentioned = keyphrase ? countPhrase(opening, keyphrase) > 0 || countPhrase(input.title, keyphrase) > 0 : false;
  const placement = analyzeKeywordPlacement(input);

  let status: CheckStatus = "good";
  let why = keyphrase
    ? "The focus keyphrase is a writing aid. It is not shown on the page and is not a density target."
    : "No focus keyphrase is set. That is fine — Google does not require one.";
  let how = "Use the phrase the way a buyer would say it. Related words are enough; do not force exact repeats.";

  if (keyphrase && stuffed) {
    status = "attention";
    why = "The same phrase is repeated so often it reads as over-optimization.";
    how = "Keep the natural mentions. Remove the extras. There is no required keyword density.";
  } else if (keyphrase && !mentioned) {
    status = "attention";
    why = "The focus keyphrase never appears in the title, excerpt, or opening, so the topic may be unclear.";
    how = "Mention the idea once, in plain language, where a person would expect it — not in every heading.";
  }

  const placementStatus: CheckStatus = !keyphrase
    ? "good"
    : stuffed
      ? "attention"
      : placement.inTitle || placement.inIntro
        ? "good"
        : "attention";

  let placementWhy =
    "The primary keyword appears where a reader would expect the topic to be named.";
  let placementHow =
    "Use the phrase naturally in the title or first paragraph. Related wording is enough — do not repeat it in every heading.";
  if (!keyphrase) {
    placementWhy = "Placement is skipped until a primary keyword is set.";
    placementHow = "Name one phrase a buyer would search, then mention it once in the title or opening.";
  } else if (stuffed) {
    placementWhy = "The phrase is repeated so often that placement no longer looks natural.";
    placementHow = "Keep one clear mention in the title or opening and remove the extras.";
  } else if (!placement.inTitle && !placement.inIntro) {
    placementWhy = "The primary keyword is missing from the title and the opening paragraph.";
    placementHow = "Name the topic once in the H1 or the first paragraph, in the language of the article.";
  }

  return [
    check(
      "kw_present",
      "keywords",
      keyphrase ? "good" : "attention",
      "Primary keyword is set",
      keyphrase
        ? "A primary keyword is set as an editorial target. It is not shown on the page."
        : "No primary keyword is set. The assistant cannot check placement until you name one.",
      keyphrase
        ? "Keep one natural phrase a buyer would type. Do not invent extra keywords."
        : "Fill the Focus keyphrase field with the phrase a buyer would search. Leave it empty only while you are still deciding.",
    ),
    check("kw_focus", "keywords", status, "Focus keyphrase used naturally", why, how),
    check(
      "kw_stuffing",
      "keywords",
      stuffed ? "attention" : "good",
      "Keyword stuffing risk",
      stuffed
        ? "Exact-phrase repetition looks like it was written for search engines first."
        : "No stuffing pattern was detected. This check never requires a density percentage.",
      "Google’s people-first questions explicitly warn against writing to a preferred word count or repeating terms for rankings.",
    ),
    check("kw_placement", "keywords", placementStatus, "Keyword placement", placementWhy, placementHow),
  ];
}

function editorialChecks(input: BlogQualityInput): QualityCheck[] {
  const words = wordCount(input.body);
  let depthStatus: CheckStatus = "good";
  let depthWhy =
    "Length looks like a complete briefing for this topic. Google has no preferred word count.";
  let depthHow = "Keep only what a buyer needs. Do not pad the article to hit a number.";
  if (words === 0) {
    depthStatus = "attention";
    depthWhy = "There is no article body yet. A useful briefing needs real explanation.";
    depthHow = "Write the checks you would walk through on a call. There is no required word count.";
  } else if (words < 200) {
    depthStatus = "attention";
    depthWhy =
      "The body is still thin for a buyer who landed here on purpose. This is an editorial range, not a ranking rule.";
    depthHow =
      "Add the specification, inspection, or comparison details the title promises. Google has no preferred word count.";
  } else if (words > 2800) {
    depthStatus = "attention";
    depthWhy =
      "The article is very long; readers on a phone may drop off. This is a readability note, not a ranking rule.";
    depthHow = "Cut repetition. Keep the checks a buyer will actually use.";
  }

  const links = extractMarkdownLinks(input.body);
  const internal = links.filter((link) => link.href.startsWith("/") && !link.href.startsWith("//"));
  const related = (input.related ?? []).map((item) => trimToString(item)).filter(Boolean);
  const internalTotal = internal.length + related.length;
  let linkCountStatus: CheckStatus = "good";
  let linkCountWhy = "Internal links look like a useful editorial set, not a quota.";
  let linkCountHow =
    "Two to five existing site pages is a useful range for this kind of article. That is an editorial suggestion, not a Google rule.";
  if (internalTotal === 0 && words > 0) {
    linkCountStatus = "attention";
    linkCountWhy = "The article does not point the reader to another page on this site.";
    linkCountHow =
      "Link two to five existing paths such as /products/frozen-chicken-feet or /contact. Never invent a URL.";
  } else if (internal.length > 8) {
    linkCountStatus = "attention";
    linkCountWhy = "A long list of in-body links can look like a directory instead of a briefing.";
    linkCountHow = "Keep the two to five pages a buyer would actually open next.";
  }

  const intent = estimateSearchIntent(input);
  return [
    check("content_depth", "people-first", depthStatus, "Content depth (editorial range)", depthWhy, depthHow),
    check("link_count", "links", linkCountStatus, "Internal link count (editorial range)", linkCountWhy, linkCountHow),
    check(
      "intent_align",
      "search",
      intent.aligned ? "good" : "attention",
      "Search intent alignment",
      intent.reason,
      "Name the job the reader came to do, then answer it before expanding. Do not write a teaser.",
    ),
  ];
}

function linkChecks(input: BlogQualityInput, catalog: InternalPath[], suggestions: InternalPath[]): QualityCheck[] {
  const links = extractMarkdownLinks(input.body);
  const internal = links.filter((link) => link.href.startsWith("/") && !link.href.startsWith("//"));
  const external = links.filter((link) => /^https:\/\//i.test(link.href));
  const unknownInternal = catalog.length
    ? internal.filter((link) => !catalogHas(catalog, link.href))
    : [];
  const hasInternal = internal.length > 0 || (input.related ?? []).length > 0;
  const claimHeavy = /\b(regulation|directive|regulation|official|ministry|customs|hs code)\b/i.test(input.body);

  return [
    check(
      "link_internal",
      "links",
      unknownInternal.length > 0 ? "required" : hasInternal ? "good" : "attention",
      "Internal linking",
      unknownInternal.length > 0
        ? `These in-body paths are not on the site: ${unknownInternal.map((link) => link.href).join(", ")}.`
        : hasInternal
          ? "Internal links point at real pages."
          : suggestions.length
            ? `No internal links yet. Existing pages that match this topic: ${suggestions.map((item) => item.path).join(", ")}.`
            : "No internal links yet. Only link pages that already exist.",
      "Use root-relative paths. Suggested pages come from this site’s catalog — never from invented URLs.",
    ),
    check(
      "link_external",
      "links",
      !claimHeavy || external.length > 0 ? "good" : "attention",
      "External / reference links",
      !claimHeavy
        ? "No official-source claim jumped out. External links are optional."
        : external.length > 0
          ? "The article cites at least one https source."
          : "The article discusses official or regulatory ideas without a source the reader can open.",
      "When you mention a rule or document type, link a real official page — or tell the reader to request the current set. Do not invent citations.",
    ),
  ];
}

function imageChecks(input: BlogQualityInput): QualityCheck[] {
  const image = trimToString(input.image);
  const alt = trimToString(input.imageAlt);
  const ogImage = trimToString(input.ogImage);
  const ogAlt = trimToString(input.ogImageAlt);
  const bodyImages = extractMarkdownImages(input.body);
  const missingBodyAlt = bodyImages.filter((item) => !item.alt);
  const genericName = /\/(image|img|photo|untitled|dsc|screenshot)[^/]*$/i.test(image);

  const altLooksStuffed =
    Boolean(alt) &&
    trimToString(input.focusKeyphrase) &&
    countPhrase(alt, trimToString(input.focusKeyphrase)) >= 2;

  let featuredStatus: CheckStatus = "good";
  if (!image || !alt) featuredStatus = "required";
  else if (altLooksStuffed || genericName) featuredStatus = "attention";

  return [
    check(
      "img_featured",
      "images",
      featuredStatus,
      "Featured image and meaningful alt",
      !image || !alt
        ? "A published article needs a photograph and alt text that describes it."
        : altLooksStuffed
          ? "The alt text repeats the focus keyphrase. That is stuffing, not a description."
          : genericName
            ? "The filename is generic (image.jpg / untitled). A descriptive filename helps humans in the media library."
            : "Featured image and alt text are present.",
      "Describe the visible scene. Prefer a filename such as frozen-chicken-feet-inspection.jpg when you can control it. Do not invent pixel dimensions.",
    ),
    check(
      "img_body",
      "images",
      missingBodyAlt.length === 0 ? "good" : "attention",
      "Article images have alt text",
      missingBodyAlt.length === 0
        ? bodyImages.length
          ? "Inline images include alt text."
          : "No inline images yet — that is fine."
        : `${missingBodyAlt.length} inline image(s) have empty alt text.`,
      "In the Markdown image dialog, fill the alt field with what the picture shows.",
    ),
    check(
      "img_og",
      "images",
      ogImage && !ogAlt ? "attention" : "good",
      "OG / Twitter image",
      ogImage && !ogAlt
        ? "A custom social image is set without its own alt text."
        : ogImage
          ? "Custom social image is set. Twitter/X reuses the same fields."
          : "Social cards reuse the featured image automatically when OG fields are empty.",
      "If you upload a 1200×630 crop, add OG alt. Otherwise leave OG image empty — do not invent a second photograph.",
    ),
  ];
}

export function collectPublishBlockers(
  input: BlogQualityInput,
  options: { catalog?: InternalPath[] } = {},
): QualityCheck[] {
  return analyzeBlogQuality(input, options).blockers;
}

export function categoryForCheck(item: QualityCheck): QualityCategoryId {
  if (item.group === "keywords" || item.id.startsWith("kw_")) return "keywords";
  if (item.group === "links" || item.id === "req_related" || item.id === "vis_internal" || item.id === "vis_entity") {
    return "links";
  }
  if (
    item.group === "structure" ||
    item.id === "req_no_h1" ||
    item.id === "vis_headings" ||
    item.id === "structure_headings"
  ) {
    return "structure";
  }
  if (
    item.group === "people-first" ||
    item.id === "req_excerpt" ||
    item.id === "vis_answers" ||
    item.id === "vis_context" ||
    item.id === "content_depth"
  ) {
    return "content";
  }
  return "seo";
}

function statusPoints(status: CheckStatus): number {
  if (status === "required") return 0;
  if (status === "attention") return 58;
  return 100;
}

function scoreFromChecks(items: QualityCheck[]): number {
  if (items.length === 0) return 100;
  const total = items.reduce((sum, item) => sum + statusPoints(item.status), 0);
  return Math.round(total / items.length);
}

function statusFromChecks(items: QualityCheck[]): CheckStatus {
  if (items.some((item) => item.status === "required")) return "required";
  if (items.some((item) => item.status === "attention")) return "attention";
  return "good";
}

export function buildCategoryScores(checks: QualityCheck[]): QualityCategoryScore[] {
  const ids: QualityCategoryId[] = ["seo", "content", "keywords", "links", "structure"];
  return ids.map((id) => {
    const items = checks.filter((item) => categoryForCheck(item) === id);
    return { id, score: scoreFromChecks(items), status: statusFromChecks(items) };
  });
}

export function editorialScore(categories: QualityCategoryScore[], blockerCount: number): number {
  const weight: Record<QualityCategoryId, number> = {
    seo: 0.25,
    content: 0.25,
    keywords: 0.15,
    links: 0.15,
    structure: 0.2,
  };
  const weighted = categories.reduce((sum, item) => sum + item.score * weight[item.id], 0);
  const rounded = Math.round(weighted);
  if (blockerCount > 0) return Math.min(rounded, 55);
  return Math.max(0, Math.min(100, rounded));
}

function buildMetrics(input: BlogQualityInput, keyword: KeywordPlacement): QualityMetrics {
  const headings = extractHeadings(input.body);
  const links = extractMarkdownLinks(input.body);
  const seoDescription = trimToString(input.seoDescription);
  const excerpt = trimToString(input.excerpt);
  return {
    wordCount: wordCount(input.body),
    recommendedWordMin: EDITORIAL_WORD_RANGE.min,
    recommendedWordMax: EDITORIAL_WORD_RANGE.max,
    titleChars: trimToString(input.title).length,
    seoTitleChars: trimToString(input.seoTitle).length,
    metaChars: (seoDescription || excerpt).length,
    excerptChars: excerpt.length,
    h2Count: headings.filter((heading) => heading.level === 2).length,
    h3Count: headings.filter((heading) => heading.level === 3).length,
    bodyH1Count: headings.filter((heading) => heading.level === 1).length,
    internalLinks: links.filter((link) => link.href.startsWith("/") && !link.href.startsWith("//")).length,
    externalLinks: links.filter((link) => /^https:\/\//i.test(link.href)).length,
    relatedCount: (input.related ?? []).map((item) => trimToString(item)).filter(Boolean).length,
    keywordCount: keyword.count,
    keywordDensityPercent: keyword.densityPercent,
  };
}

function pickTopActions(checks: QualityCheck[]): QualityCheck[] {
  const rank = (item: QualityCheck): number => {
    if (item.status === "required") return 0;
    if (item.status === "attention") return 1;
    return 2;
  };
  return checks
    .filter((item) => item.status !== "good")
    .sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))
    .slice(0, 5);
}

export function analyzeBlogQuality(
  input: BlogQualityInput,
  options: { catalog?: InternalPath[] } = {},
): BlogQualityReport {
  const catalog = options.catalog ?? [];
  const suggestions = suggestInternalLinks(input, catalog);
  const checks = [
    ...publishContractChecks(input, catalog),
    ...searchChecks(input),
    ...structureChecks(input),
    ...peopleFirstChecks(input),
    ...visibilityChecks(input),
    ...keywordChecks(input),
    ...linkChecks(input, catalog, suggestions),
    ...imageChecks(input),
    ...editorialChecks(input),
  ];
  const blockers = checks.filter((item) => item.status === "required");
  const categories = buildCategoryScores(checks);
  const keyword = analyzeKeywordPlacement(input);

  return {
    checks,
    blockers,
    suggestions,
    wordCount: wordCount(input.body),
    disclaimer: QUALITY_DISCLAIMER,
    score: editorialScore(categories, blockers.length),
    categories,
    metrics: buildMetrics(input, keyword),
    keyword,
    intent: estimateSearchIntent(input),
    topActions: pickTopActions(checks),
  };
}
