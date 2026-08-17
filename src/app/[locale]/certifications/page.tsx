import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { MediaSplit } from "@/components/shared/MediaSplit";
import { CertificationCard } from "@/components/shared/cards/CertificationCard";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import { Prose } from "@/components/shared/Prose";
import { getPageContent, getCertifications } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface CertificationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CertificationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "certifications");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.certifications,
    description: page?.seoDescription ?? page?.description ?? dictionary.homepage.certificationsIntro,
    path: "/certifications",
    ogImage: "/media/certifications/export-document-inspection-record.jpg",
    ogImageAlt: dictionary.imageAlt.certificationRecords,
  });
}

export default async function CertificationsPage({ params }: CertificationsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "certifications");
  const certifications = getCertifications(locale);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.certifications,
            page?.seoDescription ?? page?.description ?? dictionary.homepage.certificationsIntro,
            "/certifications",
            "/media/certifications/export-document-inspection-record.jpg",
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.certifications, path: "/certifications" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={dictionary.nav.certifications}
        title={page?.title ?? dictionary.homepage.certificationsHeading}
        intro={page?.description}
      />
      <section className="bg-white py-16 lg:py-24">
        <Container>
          <MediaSplit
            src="/media/certifications/export-document-inspection-record.jpg"
            alt={dictionary.imageAlt.certificationRecords}
            priority
          >
            {page?.body ? (
              <Prose content={page.body} locale={locale} />
            ) : (
              <p className="text-lg leading-relaxed text-ink">{page?.description}</p>
            )}
          </MediaSplit>

          {certifications.length > 0 && (
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-8">
              {certifications.map((certification) => (
                <CertificationCard
                  key={certification.slug}
                  certification={certification}
                  tone="light"
                />
              ))}
            </div>
          )}
        </Container>
      </section>
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
