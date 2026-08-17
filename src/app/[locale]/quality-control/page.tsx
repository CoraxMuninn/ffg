import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { MediaSplit } from "@/components/shared/MediaSplit";
import { StepGrid } from "@/components/shared/cards/StepGrid";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import { Prose } from "@/components/shared/Prose";
import { getPageContent, getQualityProcesses } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface QualityControlPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: QualityControlPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "quality-control");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.qualityControl,
    description: page?.seoDescription ?? page?.description ?? dictionary.homepage.qualityIntro,
    path: "/quality-control",
    ogImage: "/media/quality/poultry-temperature-inspection.jpg",
    ogImageAlt: dictionary.imageAlt.qualityInspection,
  });
}

export default async function QualityControlPage({ params }: QualityControlPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "quality-control");
  const processes = getQualityProcesses(locale);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.qualityControl,
            page?.seoDescription ?? page?.description ?? dictionary.homepage.qualityIntro,
            "/quality-control",
            "/media/quality/poultry-temperature-inspection.jpg",
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.qualityControl, path: "/quality-control" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={dictionary.nav.qualityControl}
        title={page?.title ?? dictionary.nav.qualityControl}
        intro={page?.description}
      />
      <section className="bg-white py-16 lg:py-24">
        <Container>
          <MediaSplit
            src="/media/quality/poultry-temperature-inspection.jpg"
            alt={dictionary.imageAlt.qualityInspection}
            priority
          >
            {page?.body ? (
              <Prose content={page.body} locale={locale} />
            ) : (
              <p className="text-lg leading-relaxed text-ink">{page?.description}</p>
            )}
          </MediaSplit>
        </Container>
      </section>
      {processes.length > 0 && (
        <section className="bg-white pb-16 lg:pb-24">
          <Container>
            <StepGrid steps={processes} />
          </Container>
        </section>
      )}
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
