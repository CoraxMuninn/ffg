import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { Prose } from "@/components/shared/Prose";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import { ProductsIntro } from "@/components/sections/ProductsIntro";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { getPageContent, getProducts } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "products");
  const featured = getProducts(locale).find((product) => product.featured);
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.products,
    description: page?.seoDescription ?? page?.description ?? dictionary.homepage.productsIntro,
    path: "/products",
    ogImage: featured?.image || undefined,
    ogImageAlt: featured?.imageAlt,
  });
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "products");
  const products = getProducts(locale);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.products,
            page?.seoDescription ?? page?.description ?? dictionary.homepage.productsIntro,
            "/products",
            products.find((product) => product.featured)?.image,
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.products, path: "/products" },
          ]),
        ]}
      />
      <ProductsIntro
        locale={locale}
        dictionary={dictionary}
        products={products}
        title={page?.title ?? dictionary.nav.products}
        description={page?.description}
      />
      {page?.body && (
        <section className="bg-white pt-16 lg:pt-20">
          <Container>
            <div className="max-w-3xl">
              <Prose content={page.body} locale={locale} />
            </div>
          </Container>
        </section>
      )}
      <ProductShowcase
        products={products}
        locale={locale}
        dictionary={dictionary}
      />
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
