import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import { Prose } from "@/components/shared/Prose";
import { MarketsHero } from "@/components/markets/MarketsHero";
import { MarketPanel } from "@/components/markets/MarketPanel";
import { MarketProcess } from "@/components/markets/MarketProcess";
import { getPageContent, getMarkets } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { contactPath, localizedPath } from "@/lib/i18n/routes";

interface MarketsPageProps {
  params: Promise<{ locale: string }>;
}

/** Shared with metadata so the OG image matches the page banner. */
const MARKETS_OG_IMAGE = "/media/markets/feiz-food-group-global-export-network-map.jpg";

export async function generateMetadata({ params }: MarketsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "markets");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.markets,
    description: page?.seoDescription ?? page?.description ?? dictionary.homepage.marketsIntro,
    path: "/markets",
    ogImage: MARKETS_OG_IMAGE,
    ogImageAlt: dictionary.imageAlt.marketsMap,
  });
}

export default async function MarketsPage({ params }: MarketsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "markets");
  const markets = getMarkets(locale);
  const primary = markets.find((market) => market.primary) ?? markets[0];

  /**
   * Panel order: the primary market leads, then the rest in their CMS `order`.
   * The index of this array drives the alternating image side, so the sequence
   * is Vietnam (image start), UAE (image end), Russia (image start),
   * Thailand (image end) — and any market added later continues the pattern.
   */
  const orderedMarkets = primary
    ? [primary, ...markets.filter((market) => market.slug !== primary.slug)]
    : markets;

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.markets,
            page?.seoDescription ?? page?.description ?? dictionary.homepage.marketsIntro,
            "/markets",
            MARKETS_OG_IMAGE,
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.markets, path: "/markets" },
          ]),
        ]}
      />

      {/* ── Full-bleed export-network banner ── */}
      <MarketsHero
        locale={locale}
        dictionary={dictionary}
        title={page?.title ?? dictionary.nav.markets}
        intro={page?.description}
        markets={markets}
      />

      {/* ── Page overview: CMS body copy ── */}
      {page?.body && (
        <section className="bg-white py-14 sm:py-16 lg:py-24">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-link">
                  {dictionary.markets.overviewHeading}
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-navy/10 pt-6 lg:mt-8">
                  <div>
                    <dt className="text-2xl font-bold text-navy">{markets.length}</dt>
                    <dd className="mt-1 text-[11px] uppercase tracking-[0.12em] text-label">
                      {dictionary.markets.coverageLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xl font-bold text-navy">
                      {dictionary.homepage.statColdChain}
                    </dt>
                    <dd className="mt-1 text-[11px] uppercase tracking-[0.12em] text-label">
                      {dictionary.homepage.statColdChainLabel}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="lg:col-span-8">
                <Prose content={page.body} locale={locale} />
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── Destination markets ── */}
      <section className="bg-smoke py-14 sm:py-16 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow={dictionary.nav.markets}
            title={dictionary.markets.destinationsHeading}
            intro={dictionary.markets.destinationsIntro}
            className="mb-10 sm:mb-14"
          />

          {/*
            One list, one component. The alternating image side is derived from
            the index inside MarketPanel, so adding a market to the CMS
            continues the pattern automatically with no code change.
          */}
          <div className="space-y-6 sm:space-y-8">
            {orderedMarkets.map((market, index) => (
              <Reveal key={market.slug} from="up">
                <MarketPanel
                  market={market}
                  locale={locale}
                  dictionary={dictionary}
                  index={index}
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Commercial sequence ── */}
      <MarketProcess dictionary={dictionary} />

      {/* ── Other destinations ── */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl border border-navy/10 bg-smoke p-6 text-center sm:p-10">
            <h2 className="text-xl font-bold tracking-tight text-navy sm:text-2xl">
              {dictionary.markets.newMarketHeading}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-ink">
              {dictionary.markets.newMarketText}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href={contactPath(locale)}>
                  {dictionary.cta.requestQuote}
                  <ArrowRight
                    aria-hidden
                    data-icon="end"
                    className="h-4 w-4 rtl:rotate-180"
                  />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={localizedPath(locale, "/certifications")}>
                  {dictionary.nav.certifications}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
