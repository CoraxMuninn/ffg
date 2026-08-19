import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { MediaSplit } from "@/components/shared/MediaSplit";
import { Prose } from "@/components/shared/Prose";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale, localeConfig } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/routes";
import FinalCTA from "@/components/sections/FinalCTA";
import { getPageContent, getBlogPosts } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "blog");
  const featured = getBlogPosts(locale)[0];
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.blog,
    description: page?.seoDescription ?? page?.description ?? dictionary.blog.emptyText,
    path: "/blog",
    ogImage: featured?.image || undefined,
    ogImageAlt: featured?.imageAlt,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "blog");
  const posts = getBlogPosts(locale);
  const [featured, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.blog,
            page?.seoDescription ?? page?.description ?? dictionary.blog.emptyText,
            "/blog",
            featured?.image,
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.blog, path: "/blog" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={dictionary.nav.blog}
        title={page?.title ?? dictionary.nav.blog}
        intro={page?.description}
      />

      <section className="bg-white py-16 lg:py-24">
        <Container>
          {page?.body && (
            <div className="mb-12 max-w-3xl lg:mb-16">
              <Prose content={page.body} locale={locale} />
            </div>
          )}

          {posts.length === 0 ? (
            <div className="max-w-xl">
              <h2 className="mb-3 text-2xl font-bold text-navy">
                {dictionary.blog.emptyTitle}
              </h2>
              <p className="mb-8 leading-relaxed text-ink">
                {dictionary.blog.emptyText}
              </p>
              <Button asChild size="lg">
                <Link href={localizedPath(locale, "/products")}>
                  {dictionary.blog.emptyCta}
                  <ArrowRight data-icon="end" className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-16 lg:gap-20 ">
              {featured && (
                <article className=" rounded-lg overflow-hidden border-shadow shadow-lg bg-smoke transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover">
                  <MediaSplit
                    src={featured.image}
                    alt={featured.imageAlt ?? featured.title}
                    priority
                  >
                    <div className="mb-5 flex items-center gap-2 text-sm font-medium text-label">
                      <Calendar className="h-4 w-4" aria-hidden />
                      <time dateTime={featured.date}>{formatDate(featured.date, locale)}</time>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight tracking-tight text-navy sm:text-3xl lg:text-4xl">
                      <Link
                        href={localizedPath(locale, `/blog/${featured.slug}`)}
                        className="transition-colors hover:text-cyan-brand"
                      >
                        {featured.title}
                      </Link>
                    </h2>
                    {featured.excerpt && (
                      <p className="mt-4 text-base leading-relaxed text-ink sm:text-lg">
                        {featured.excerpt}
                      </p>
                    )}
                    <Button asChild size="lg" className="mt-8">
                      <Link href={localizedPath(locale, `/blog/${featured.slug}`)}>
                        {dictionary.blog.readMore}
                        <ArrowRight
                          data-icon="end"
                          className="h-4 w-4 rtl:rotate-180"
                          aria-hidden
                        />
                      </Link>
                    </Button>
                  </MediaSplit>
                </article>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                  {rest.map((post) => (
                    <article key={post.slug} className="flex flex-col rounded-md p-2 pb-3 overflow-hidden border-shadow shadow-lg bg-smoke transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover">
                      {post.image && (
                        <Link
                          href={localizedPath(locale, `/blog/${post.slug}`)}
                          className="relative mb-5 block h-56 overflow-hidden rounded-2xl shadow-card"
                          aria-hidden="true"
                          tabIndex={-1}
                        >
                          <Image
                            src={post.image}
                            alt={post.imageAlt ?? post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </Link>
                      )}
                      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-label">
                        <Calendar className="h-4 w-4" aria-hidden />
                        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                      </div>
                      <h2 className="mb-2 text-lg font-bold text-navy">
                        <Link
                          href={localizedPath(locale, `/blog/${post.slug}`)}
                          className="transition-colors hover:text-cyan-brand"
                        >
                          {post.title}
                        </Link>
                      </h2>
                      {post.excerpt && (
                        <p className="mb-4 flex-1 text-sm leading-relaxed text-ink">
                          {post.excerpt}
                        </p>
                      )}
                      <Link
                        href={localizedPath(locale, `/blog/${post.slug}`)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-link"
                      >
                        {dictionary.blog.readMore}
                        <ArrowRight
                          className="h-4 w-4 rtl:rotate-180"
                          aria-hidden
                        />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </Container>
      </section>
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}

function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeConfig[locale].language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
