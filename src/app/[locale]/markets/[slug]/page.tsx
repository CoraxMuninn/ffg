import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { Prose } from "@/components/shared/Prose";
import { JsonLd } from "@/components/shared/JsonLd";
import { PageHeader } from "@/components/shared/PageHeader";
import { isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import { getMarkets } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { contactPath, marketPath, marketsPath } from "@/lib/i18n/routes";

interface MarketDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Only known market slugs are valid — anything else is a real 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const market of getMarkets(locale)) {
      paths.push({ locale, slug: market.slug });
    }
  }
  return paths;
}

/** Single lookup shared by metadata and the page body. */
function findMarket(locale: (typeof locales)[number], slug: string) {
  return getMarkets(locale).find((market) => market.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: MarketDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const market = findMarket(locale, slug);
  if (!market) return {};

  return buildPageMetadata({
    locale,
    title: market.seoTitle ?? market.title,
    description: market.seoDescription ?? market.description,
    path: `/markets/${market.slug}`,
    ogImage: market.panelImage || market.image || undefined,
    ogImageAlt: market.panelImageAlt || market.imageAlt,
  });
}

/**
 * Destination market detail page.
 *
 * Reuses the existing content model and page furniture rather than inventing a
 * new layout: the same `markets` collection that feeds the Markets listing and
 * the homepage cards, the shared PageHeader, Prose and FinalCTA. Statically
 * generated for every locale/slug pair, so these pages cost nothing at runtime.
 */
export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const market = findMarket(locale, slug);
  if (!market) notFound();

  const heroImage = market.panelImage || market.image;
  const others = getMarkets(locale).filter((entry) => entry.slug !== market.slug);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            market.seoTitle ?? market.title,
            market.seoDescription ?? market.description,
            `/markets/${market.slug}`,
            market.panelImage || market.image,
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.markets, path: "/markets" },
            { name: market.title, path: `/markets/${market.slug}` },
          ]),
        ]}
      />

      <PageHeader
        eyebrow={
          market.primary
            ? dictionary.markets.primaryLabel
            : dictionary.markets.targetLabel
        }
        title={market.heading}
        intro={market.description}
        back={{ href: marketsPath(locale), label: dictionary.nav.markets }}
      />

      <section className="bg-white py-14 sm:py-16 lg:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            {/* ── Media ── */}
            <div className="lg:col-span-5">
              <div className="relative h-56 overflow-hidden rounded-2xl shadow-card sm:h-72 lg:sticky lg:top-28 lg:h-[26rem]">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={market.panelImageAlt || market.imageAlt}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-navy-light text-silver">
                    {market.title}
                  </div>
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-navy/55 to-transparent"
                />
                {market.region && (
                  <span className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                    {market.region}
                  </span>
                )}
              </div>
            </div>

            {/* ── Content ── */}
            <div className="lg:col-span-7">
              {market.body ? (
                <Prose content={market.body} locale={locale} />
              ) : (
                market.description && (
                  <p className="text-lg leading-relaxed text-ink">
                    {market.description}
                  </p>
                )
              )}

              {(market.focus.length > 0 || market.documents.length > 0) && (
                <div className="mt-8 grid grid-cols-1 gap-6 border-t border-navy/10 pt-8 sm:gap-8 md:grid-cols-2">
                  {market.focus.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-brand">
                        {dictionary.markets.focusHeading}
                      </h2>
                      <ul className="space-y-2">
                        {market.focus.map((point) => (
                          <li key={point} className="flex items-start gap-2.5">
                            <Check
                              aria-hidden
                              className="mt-0.5 h-4 w-4 shrink-0 text-cyan-brand"
                            />
                            <span className="text-sm leading-relaxed text-ink">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {market.documents.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-brand">
                        {dictionary.markets.documentsHeading}
                      </h2>
                      <ul className="flex flex-wrap gap-2">
                        {market.documents.map((document) => (
                          <li
                            key={document}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 bg-smoke px-2.5 py-1.5 text-xs font-medium text-ink"
                          >
                            <FileText
                              aria-hidden
                              className="h-3.5 w-3.5 shrink-0 opacity-70"
                            />
                            {document}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Button asChild className="mt-8">
                <Link href={contactPath(locale)}>
                  {dictionary.cta.requestQuote}
                  <ArrowRight
                    aria-hidden
                    data-icon="end"
                    className="h-4 w-4 rtl:rotate-180"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Other destinations ── */}
      {others.length > 0 && (
        <section className="bg-smoke py-14 sm:py-16 lg:py-20">
          <Container>
            <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-brand">
              {dictionary.markets.destinationsHeading}
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {others.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={marketPath(locale, entry.slug)}
                    className="group flex h-full items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white p-4 transition-colors duration-300 hover:border-cyan-brand/40"
                  >
                    <span>
                      <span className="block text-base font-bold text-navy transition-colors duration-300 group-hover:text-cyan-brand">
                        {entry.title}
                      </span>
                      {entry.region && (
                        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-label">
                          {entry.region}
                        </span>
                      )}
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-cyan-brand transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
