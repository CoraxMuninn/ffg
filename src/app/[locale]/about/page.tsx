import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { Prose } from "@/components/shared/Prose";
import { JsonLd } from "@/components/shared/JsonLd";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StepGrid } from "@/components/shared/cards/StepGrid";
import { SupplyChainFlow } from "@/components/supply-chain/SupplyChainFlow";
import { CertificationGrid } from "@/components/shared/CertificationGrid";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import FinalCTA from "@/components/sections/FinalCTA";
import {
  getPageContent,
  getQualityProcesses,
  getSupplyChainSteps,
  getCertifications,
  getMarkets,
} from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { localizedPath, marketPath } from "@/lib/i18n/routes";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "about");
  return buildPageMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? dictionary.nav.about,
    description: page?.seoDescription ?? page?.description ?? dictionary.meta.description,
    path: "/about",
    ogImage: "/media/about/operations.jpg",
    ogImageAlt: dictionary.imageAlt.aboutOperations,
  });
}

/**
 * About page.
 *
 * The page is the company narrative, so the CMS body carries the argument and
 * the sections below it are evidence drawn from the same collections the
 * dedicated pages use — quality checkpoints, supply-chain stages, document
 * types, and markets. Nothing is duplicated as hard-coded copy: if a checkpoint
 * changes in the CMS it changes here too, and every section links onward to the
 * page that covers it in full.
 */
export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const page = getPageContent(locale, "about");
  const processes = getQualityProcesses(locale);
  const steps = getSupplyChainSteps(locale);
  const certifications = getCertifications(locale);
  const markets = getMarkets(locale);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema(
            locale,
            page?.seoTitle ?? page?.title ?? dictionary.nav.about,
            page?.seoDescription ?? page?.description ?? dictionary.meta.description,
            "/about",
            "/media/about/operations.jpg",
          ),
          breadcrumbSchema(locale, [
            { name: dictionary.nav.home, path: "" },
            { name: dictionary.nav.about, path: "/about" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={dictionary.nav.about}
        title={page?.title ?? dictionary.nav.about}
        intro={page?.description}
      />

      {/* ── Company narrative ── */}
      <section className="bg-white py-14 sm:py-16 lg:py-24">
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="relative h-64 overflow-hidden rounded-2xl shadow-card sm:h-80 lg:sticky lg:top-28 lg:col-span-5 lg:h-[560px]">
              <Image
                src="/media/about/operations.jpg"
                alt={dictionary.imageAlt.aboutOperations}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
            <div className="lg:col-span-7">
              {page?.body ? (
                <Prose content={page.body} locale={locale} />
              ) : (
                <p className="text-lg leading-relaxed text-ink">{page?.description}</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Long-term partnership principles ── */}
      {dictionary.about.partnershipPoints.length > 0 && (
        <section className="bg-navy py-14 sm:py-16 lg:py-24">
          <Container>
            <SectionHeading
              tone="dark"
              eyebrow={dictionary.nav.about}
              title={dictionary.about.partnershipHeading}
              intro={dictionary.about.partnershipIntro}
              className="mb-10 sm:mb-14"
            />
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
              {dictionary.about.partnershipPoints.map((point, index) => (
                <div key={point.title} className="bg-navy">
                  <Reveal from="up" delay={index * 70} className="h-full p-6 sm:p-8">
                    <h3 className="text-base font-bold text-white sm:text-lg">
                      {point.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-silver">
                      {point.text}
                    </p>
                  </Reveal>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── Quality approach ── */}
      {processes.length > 0 && (
        <section className="bg-white py-14 sm:py-16 lg:py-24">
          <Container>
            <SectionHeading
              eyebrow={dictionary.nav.qualityControl}
              title={dictionary.about.approachHeading}
              intro={dictionary.about.approachIntro}
              className="mb-10 sm:mb-14"
            />
            <StepGrid steps={processes} />
            <div className="mt-10 text-center">
              <SectionLink
                href={localizedPath(locale, "/quality-control")}
                label={dictionary.nav.qualityControl}
              />
            </div>
          </Container>
        </section>
      )}

      {/* ── Supply chain ── */}
      {steps.length > 0 && (
        <section className="bg-smoke py-14 sm:py-16 lg:py-24">
          <Container>
            <SectionHeading
              eyebrow={dictionary.nav.supplyChain}
              title={dictionary.about.chainHeading}
              intro={dictionary.about.chainIntro}
              className="mb-10 sm:mb-14"
            />
            <SupplyChainFlow steps={steps} tone="light" columns={3} />
            <div className="mt-10 text-center">
              <SectionLink
                href={localizedPath(locale, "/supply-chain")}
                label={dictionary.nav.supplyChain}
              />
            </div>
          </Container>
        </section>
      )}

      {/* ── Markets ── */}
      {markets.length > 0 && (
        <section className="bg-white py-14 sm:py-16 lg:py-24">
          <Container>
            <SectionHeading
              eyebrow={dictionary.nav.markets}
              title={dictionary.about.marketsHeading}
              intro={dictionary.about.marketsIntro}
              className="mb-10 sm:mb-14"
            />
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {markets.map((market) => (
                <li key={market.slug}>
                  <Link
                    href={marketPath(locale, market.slug)}
                    className="group flex h-full flex-col rounded-2xl border border-navy/10 bg-smoke p-5 transition-colors duration-300 hover:border-cyan-brand/40 sm:p-6"
                  >
                    <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-label">
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          market.primary ? "bg-cyan-brand" : "bg-silver"
                        }`}
                      />
                      {market.primary
                        ? dictionary.markets.primaryLabel
                        : dictionary.markets.targetLabel}
                    </span>
                    <h3 className="mt-2.5 text-lg font-bold text-navy transition-colors duration-300 group-hover:text-cyan-brand">
                      {market.title}
                    </h3>
                    {market.description && (
                      <p className="mt-2 text-sm leading-relaxed text-ink">
                        {market.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-10 text-center">
              <SectionLink
                href={localizedPath(locale, "/markets")}
                label={dictionary.cta.exploreAllMarkets}
              />
            </div>
          </Container>
        </section>
      )}

      {/* ── Export documentation ── */}
      {certifications.length > 0 && (
        <section className="bg-smoke py-14 sm:py-16 lg:py-24">
          <Container>
            <SectionHeading
              eyebrow={dictionary.nav.certifications}
              title={dictionary.about.documentsHeading}
              intro={dictionary.about.documentsIntro}
              className="mb-10 sm:mb-14"
            />
            <CertificationGrid certifications={certifications} tone="light" />
            <div className="mt-10 text-center">
              <SectionLink
                href={localizedPath(locale, "/certifications")}
                label={dictionary.nav.certifications}
              />
            </div>
          </Container>
        </section>
      )}

      <FinalCTA locale={locale} dictionary={dictionary} />
    </>
  );
}

/** Consistent "read the full page" affordance under each About section. */
function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>
        {label}
        <ArrowRight aria-hidden data-icon="end" className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </Button>
  );
}
