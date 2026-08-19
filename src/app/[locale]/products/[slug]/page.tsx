import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { MediaSplit } from "@/components/shared/MediaSplit";
import { Prose } from "@/components/shared/Prose";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { contactPath, productsPath } from "@/lib/i18n/routes";
import FinalCTA from "@/components/sections/FinalCTA";
import { getProduct, getProducts, localesWithProduct } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, productSchema, webPageSchema } from "@/lib/seo/schema";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Only known product slugs are valid — unknown slugs return a real 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const product of getProducts(locale)) {
      paths.push({ locale, slug: product.slug });
    }
  }
  return paths;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = getProduct(locale, slug);
  if (!product) return {};
  return buildPageMetadata({
    locale,
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.description,
    path: `/products/${product.slug}`,
    ogImage: product.image || undefined,
    ogImageAlt: product.imageAlt,
    availableLocales: localesWithProduct(slug),
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const product = getProduct(locale, slug);
  if (!product) notFound();

  return (
    <>
      <JsonLd
        data={[
          productSchema(locale, product),
          webPageSchema(
            locale,
            product.seoTitle ?? product.title,
            product.seoDescription ?? product.description,
            `/products/${product.slug}`,
            product.image,
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.products, path: "/products" },
            { name: product.title, path: `/products/${product.slug}` },
          ]),
        ]}
      />
      <section className="bg-navy py-16 lg:py-20">
        <Container>
          <Link
            href={productsPath(locale)}
            className="group/back mb-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-light transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:text-cyan-brand"
          >
            <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-[var(--btn-duration)] ease-[var(--btn-ease)] group-hover/back:-translate-x-0.5 rtl:rotate-0 rtl:group-hover/back:translate-x-0.5" />
            {dictionary.nav.products}
          </Link>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {product.title}
          </h1>
          {product.description && (
            <p className="max-w-2xl text-lg leading-relaxed text-silver">
              {product.description}
            </p>
          )}
        </Container>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <Container>
          <MediaSplit src={product.image} alt={product.imageAlt} priority>
            {product.specs.length > 0 && (
              <>
                <h2 className="mb-6 text-2xl font-bold text-navy">
                  {dictionary.cta.viewFullSpecifications}
                </h2>
                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-smoke/60 p-4"
                    >
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-brand" />
                      <div>
                        <div className="mb-1 text-xs font-medium text-label">{spec.label}</div>
                        <div className="text-sm font-semibold text-navy">
                          <bdi>{spec.value}</bdi>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {product.body && (
              <div className="text-navy">
                <Prose content={product.body} locale={locale} />
              </div>
            )}

            <Button asChild size="lg" className="mt-8">
              <Link href={contactPath(locale, product.slug)}>
                {dictionary.cta.requestQuote}
                <ArrowRight data-icon="end" className="h-5 w-5 rtl:rotate-180" />
              </Link>
            </Button>
          </MediaSplit>
        </Container>
      </section>
      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}
