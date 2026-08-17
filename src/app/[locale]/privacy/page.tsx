import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/routes";
import { getPageContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "privacy");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.legal.privacy,
    description: page?.seoDescription ?? page?.description ?? dictionary.legal.privacy,
    path: "/privacy",
    ogImage: "/media/hero/cargo-ship-wide.jpg",
    ogImageAlt: dictionary.imageAlt.hero,
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "privacy");
  if (!page) notFound();

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page.seoTitle ?? page.title,
            page.seoDescription ?? page.description,
            "/privacy",
            "/media/hero/cargo-ship-wide.jpg",
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: page.title, path: "/privacy" },
          ]),
        ]}
      />
      <LegalPage
        locale={locale}
        dictionary={dictionary}
        title={page.title}
        intro={page.description}
        body={page.body}
        updated={page.updated}
        related={[
          { label: dictionary.legal.terms, href: localizedPath(locale, "/terms") },
          { label: dictionary.nav.contact, href: localizedPath(locale, "/contact") },
        ]}
      />
    </>
  );
}
