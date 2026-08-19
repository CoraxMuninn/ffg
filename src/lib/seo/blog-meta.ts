import type { BlogPost } from "@/lib/content";

/**
 * Resolves the effective search and social metadata for a blog post.
 *
 * Single source of truth for the article page, JSON-LD, and tests: CMS
 * override fields win when set; otherwise the article's own title / excerpt /
 * featured image are used. Nothing is invented.
 */
export function resolveBlogSeo(post: BlogPost) {
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;
  const ogImage = post.ogImage || post.image;
  const ogImageAlt = post.ogImageAlt || post.imageAlt;
  const keywords = unique(
    [post.focusKeyphrase, ...post.tags].map((value) => value?.trim() ?? "").filter(Boolean),
  );

  return {
    title,
    description,
    ogTitle: post.ogTitle ?? title,
    ogDescription: post.ogDescription ?? description,
    ogImage,
    ogImageAlt,
    canonical: post.canonicalUrl,
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    authors: post.author ? [post.author] : undefined,
    tags: post.tags,
    keywords,
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
