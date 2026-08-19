import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { Prose } from "@/components/shared/Prose";
import { JsonLd } from "@/components/shared/JsonLd";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getPageContent, getProducts } from "@/lib/content";
import { RFQ } from "@/lib/rfq/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const RfqForm = dynamic(
  () => import("@/components/rfq/RfqForm").then((mod) => mod.RfqForm),
  { ssr: true },
);

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "contact");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.cta.requestQuote,
    description: page?.seoDescription ?? page?.description ?? dictionary.rfq.intro,
    path: "/contact",
    ogImage: "/media/products/chicken-feet-iqf.jpg",
    ogImageAlt: getProducts(locale)[0]?.imageAlt ?? dictionary.imageAlt.hero,
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "contact");
  const products = getProducts(locale);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.cta.requestQuote,
            page?.seoDescription ?? page?.description ?? dictionary.rfq.intro,
            "/contact",
            "/media/products/chicken-feet-iqf.jpg",
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.contact, path: "/contact" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={dictionary.nav.contact}
        title={page?.title ?? dictionary.cta.requestQuote}
        intro={page?.description}
      />
      <section className="bg-white py-16 lg:py-24">
        <Container>
          {page?.body && (
            <div className="mb-12 max-w-3xl lg:mb-16">
              <Prose content={page.body} locale={locale} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-8">
              <h2 className="mb-3 text-2xl font-bold text-navy">{dictionary.rfq.heading}</h2>
              <p className="mb-8 max-w-2xl text-base leading-relaxed text-ink">
                {dictionary.rfq.intro}
              </p>
              <RfqForm
                products={products}
                dictionary={dictionary}
                locale={locale}
                turnstileSiteKey={RFQ.turnstileSiteKey}
                turnstileAction={RFQ.turnstileAction}
              />
            </div>

            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <h2 className="mb-3 text-lg font-bold text-navy">
                  {dictionary.contact.infoHeading}
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-ink">
                  {dictionary.contact.infoIntro}
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3 rounded-lg border border-gray-200 bg-smoke/60 p-4">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan-brand" aria-hidden />
                    <div>
                      <div className="text-xs font-medium text-label">
                        {dictionary.contact.emailLabel}
                      </div>
                      <a
                        href={`mailto:${dictionary.contact.emailValue}`}
                        dir="ltr"
                        className="text-sm font-semibold text-navy transition-colors hover:text-cyan-brand"
                      >
                        {dictionary.contact.emailValue}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-lg border border-gray-200 bg-smoke/60 p-4">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-cyan-brand" aria-hidden />
                    <div>
                      <div className="text-xs font-medium text-label">
                        {dictionary.contact.phoneLabel}
                      </div>
                      <a
                        href={`tel:${dictionary.contact.phoneValue.replace(/\s/g, "")}`}
                        dir="ltr"
                        className="text-sm font-semibold text-navy transition-colors hover:text-cyan-brand"
                      >
                        {dictionary.contact.phoneValue}
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
