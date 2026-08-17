import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { MediaSplit } from "@/components/shared/MediaSplit";
import { Prose } from "@/components/shared/Prose";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale, localeConfig, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/routes";
import FinalCTA from "@/components/sections/FinalCTA";
import { getBlogPost, getBlogPosts } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Only known blog slugs are valid — unknown slugs return a real 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const post of getBlogPosts(locale)) {
      paths.push({ locale, slug: post.slug });
    }
  }
  return paths;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = getBlogPost(locale, slug);
  if (!post) return {};
  // The CMS SEO fields are optional overrides; the article's own title and
  // excerpt remain the default so a post is never left without metadata.
  return buildPageMetadata({
    locale,
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
    ogImage: post.image || undefined,
    ogImageAlt: post.imageAlt,
    article: {
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
    },
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const post = getBlogPost(locale, slug);
  if (!post) notFound();
  const publishedDate = new Intl.DateTimeFormat(localeConfig[locale].language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${post.date}T00:00:00Z`));

  return (
    <>
      <JsonLd
        data={[
          articleSchema(locale, post),
          webPageSchema(
            locale,
            post.seoTitle ?? post.title,
            post.seoDescription ?? post.excerpt,
            `/blog/${post.slug}`,
            post.image,
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.blog, path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <section className="bg-navy py-16 lg:py-20">
        <Container>
          <Link
            href={localizedPath(locale, "/blog")}
            className="group/back mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-cyan-light transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:text-cyan-brand"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-[var(--btn-duration)] ease-[var(--btn-ease)] group-hover/back:-translate-x-0.5 rtl:rotate-180 rtl:group-hover/back:translate-x-0.5" />
            {dictionary.blog.backToBlog}
          </Link>
          <h1 className="mb-4 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-silver">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden />
              <span className="sr-only">{dictionary.blog.published}: </span>
              <time dateTime={post.date}>{publishedDate}</time>
            </span>
            {post.author && (
              <>
                <span aria-hidden className="text-white/25">•</span>
                <span>
                  {dictionary.blog.by} {post.author}
                </span>
              </>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <Container>
          {post.image ? (
            <MediaSplit
              src={post.image}
              alt={post.imageAlt ?? post.title}
              priority
              className="mb-14"
            >
              {post.excerpt && (
                <p className="text-lg font-medium leading-relaxed text-ink sm:text-xl">
                  {post.excerpt}
                </p>
              )}
            </MediaSplit>
          ) : (
            post.excerpt && (
              <p className="mb-10 max-w-3xl text-lg font-medium leading-relaxed text-ink sm:text-xl">
                {post.excerpt}
              </p>
            )
          )}
          <article className="max-w-3xl">
            <Prose content={post.body} locale={locale} />
          </article>
        </Container>
      </section>
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
