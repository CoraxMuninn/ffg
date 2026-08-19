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
import {
  getBlogPost,
  getBlogPosts,
  getMarkets,
  getPageContent,
  getProduct,
  localesWithBlogPost,
} from "@/lib/content";
import { resolveBlogSeo } from "@/lib/seo/blog-meta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Locale } from "@/lib/i18n/config";

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
  const seo = resolveBlogSeo(post);
  return buildPageMetadata({
    locale,
    title: seo.title,
    description: seo.description,
    path: `/blog/${post.slug}`,
    ogImage: seo.ogImage || undefined,
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
    availableLocales: localesWithBlogPost(slug),
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const post = getBlogPost(locale, slug);
  if (!post) notFound();
  const seo = resolveBlogSeo(post);
  const publishedDate = new Intl.DateTimeFormat(localeConfig[locale].language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${post.date}T00:00:00Z`));
  const updatedDate = post.updated
    ? new Intl.DateTimeFormat(localeConfig[locale].language, {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(`${post.updated}T00:00:00Z`))
    : null;
  const related = relatedLinks(locale, dictionary, post.related);

  return (
    <>
      <JsonLd
        data={[
          articleSchema(locale, post),
          webPageSchema(
            locale,
            seo.title,
            seo.description,
            `/blog/${post.slug}`,
            seo.ogImage,
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
            {updatedDate && (
              <>
                <span aria-hidden className="text-white/25">•</span>
                <span>
                  {dictionary.blog.updated}{" "}
                  <time dateTime={post.updated}>{updatedDate}</time>
                </span>
              </>
            )}
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
              alt={post.imageAlt}
              caption={post.imageCaption}
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
            {related.length > 0 && (
              <aside className="mt-12 border-t border-navy/10 pt-8">
                <h2 className="mb-4 text-xl font-bold text-navy">
                  {dictionary.blog.relatedHeading}
                </h2>
                <ul className="space-y-2">
                  {related.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="font-medium text-cyan-link underline-offset-2 hover:underline hover:text-cyan-link-hover"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </article>
        </Container>
      </section>
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}

const NAV_BY_PATH: Record<string, keyof Dictionary["nav"]> = {
  "/products": "products",
  "/markets": "markets",
  "/about": "about",
  "/quality-control": "qualityControl",
  "/supply-chain": "supplyChain",
  "/certifications": "certifications",
  "/contact": "contact",
  "/blog": "blog",
};

/** Resolves editor-supplied internal paths to localized hrefs and real titles. */
function relatedLinks(
  locale: Locale,
  dictionary: Dictionary,
  paths: string[],
): { href: string; label: string }[] {
  return paths.map((path) => {
    const href = localizedPath(locale, path);
    if (path === "/") return { href, label: dictionary.nav.home };
    const navKey = NAV_BY_PATH[path];
    if (navKey) return { href, label: dictionary.nav[navKey] };
    if (path === "/privacy") return { href, label: dictionary.legal.privacy };
    if (path === "/terms") return { href, label: dictionary.legal.terms };

    const [collection, slug] = path.split("/").filter(Boolean);
    if (collection === "products" && slug) {
      return { href, label: getProduct(locale, slug)?.title ?? slug };
    }
    if (collection === "markets" && slug) {
      const market = getMarkets(locale).find((item) => item.slug === slug);
      return { href, label: market?.title ?? slug };
    }
    if (collection === "blog" && slug) {
      return { href, label: getBlogPost(locale, slug)?.title ?? slug };
    }
    const page = getPageContent(locale, path.replace(/^\//, ""));
    return { href, label: page?.title ?? path };
  });
}
