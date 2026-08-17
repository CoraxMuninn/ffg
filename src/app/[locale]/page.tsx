import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Hero from "@/components/sections/Hero";
import ProductRange from "@/components/sections/ProductRange";
import FeaturedProduct from "@/components/sections/FeaturedProduct";
import BuyerPriorities from "@/components/sections/BuyerPriorities";
import Certifications from "@/components/sections/Certifications";
import QualityPreview from "@/components/sections/QualityPreview";
import SupplyChainPreview from "@/components/sections/SupplyChainPreview";
import MarketsFocus from "@/components/sections/MarketsFocus";
import FinalCTA from "@/components/sections/FinalCTA";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, webPageSchema, webSiteSchema } from "@/lib/seo/schema";
import { getPageContent } from "@/lib/content";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "home");
  const title = `${page?.seoTitle ?? page?.title ?? dictionary.meta.title} | ${dictionary.brand}`;
  return buildPageMetadata({
    locale,
    title,
    description: page?.seoDescription ?? page?.description ?? dictionary.meta.description,
    path: "",
    ogImage: "/media/hero/cargo-ship-wide.jpg",
    ogImageAlt: dictionary.imageAlt.hero,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "home");
  const title = `${page?.seoTitle ?? page?.title ?? dictionary.meta.title} | ${dictionary.brand}`;
  const description =
    page?.seoDescription ?? page?.description ?? dictionary.meta.description;

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(locale, dictionary.meta.description),
          webSiteSchema(locale),
          webPageSchema(locale, title, description, "", "/media/hero/cargo-ship-wide.jpg"),
        ]}
      />
      <Hero locale={locale} dictionary={dictionary} />
      <ProductRange locale={locale} dictionary={dictionary} />
      <FeaturedProduct locale={locale} dictionary={dictionary} />
      <BuyerPriorities locale={locale} dictionary={dictionary} />
      <Certifications locale={locale} dictionary={dictionary} />
      <QualityPreview locale={locale} dictionary={dictionary} />
      <SupplyChainPreview locale={locale} dictionary={dictionary} />
      <MarketsFocus locale={locale} dictionary={dictionary} />
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
