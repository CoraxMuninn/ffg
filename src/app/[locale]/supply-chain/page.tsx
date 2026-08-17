import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { MediaSplit } from "@/components/shared/MediaSplit";
import { SupplyChainFlow } from "@/components/supply-chain/SupplyChainFlow";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import { Prose } from "@/components/shared/Prose";
import { getPageContent, getSupplyChainSteps } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface SupplyChainPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: SupplyChainPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "supply-chain");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.supplyChain,
    description: page?.seoDescription ?? page?.description ?? dictionary.homepage.supplyChainIntro,
    path: "/supply-chain",
    ogImage: "/media/supply-chain/reefer-terminal.jpg",
    ogImageAlt: dictionary.imageAlt.supplyChainTerminal,
  });
}

export default async function SupplyChainPage({
  params,
}: SupplyChainPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "supply-chain");
  const steps = getSupplyChainSteps(locale);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.supplyChain,
            page?.seoDescription ?? page?.description ?? dictionary.homepage.supplyChainIntro,
            "/supply-chain",
            "/media/supply-chain/reefer-terminal.jpg",
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.supplyChain, path: "/supply-chain" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={dictionary.nav.supplyChain}
        title={page?.title ?? dictionary.nav.supplyChain}
        intro={page?.description}
      />
      <section className="bg-white py-16 lg:py-18">
        <Container>
          <MediaSplit
            src="/media/supply-chain/reefer-terminal.jpg"
            alt={dictionary.imageAlt.supplyChainTerminal}
            priority
          >
            {page?.body ? (
              <Prose content={page.body} locale={locale} />
            ) : (
              <p className="text-lg leading-relaxed text-ink">
                {page?.description}
              </p>
            )}
          </MediaSplit>

          <div className="relative mt-16 h-64 overflow-hidden rounded-2xl shadow-card sm:h-80 lg:mt-20 lg:h-[420px]">
            <Image
              src="/media/supply-chain/frozen-storage-aisle.jpg"
              alt={dictionary.imageAlt.supplyChainColdStorage}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </Container>
      </section>
      {steps.length > 0 && (
        <section className="bg-smoke pt-10 pb-16 lg:pb-20">
          <Container>
            <SupplyChainFlow steps={steps} tone="light" columns={3} />
          </Container>
        </section>
      )}
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
