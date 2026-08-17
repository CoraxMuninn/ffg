import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { contactPath, productsPath } from "@/lib/i18n/routes";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface FinalCTAProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function FinalCTA({ locale, dictionary }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden bg-navy-glass/20 backdrop-blur-3xl py-20 lg:py-28">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <Container className="relative text-center">
        <h2 className="mx-auto mb-6 max-w-2xl text-3xl font-bold text-navy sm:text-4xl lg:text-5xl">
          {dictionary.homepage.finalCtaHeading}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-navy-light">
          {dictionary.homepage.finalCtaText}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href={contactPath(locale)}>
              {dictionary.cta.requestQuote}
              <ArrowRight data-icon="end" className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={productsPath(locale)}>
              <Package className="h-5 w-5" />
              {dictionary.homepage.finalCtaSecondary}
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
          <div>
            <div className="mb-1 text-3xl font-bold text-navy">
              {dictionary.homepage.statIqf}
            </div>
            <div className="text-sm text-navy-glass">
              {dictionary.homepage.statIqfLabel}
            </div>
          </div>
          <div>
            <div className="mb-1 text-3xl font-bold text-navy">
              {dictionary.homepage.statColdChain}
            </div>
            <div className="text-sm text-navy-glass">
              {dictionary.homepage.statColdChainLabel}
            </div>
          </div>
          <div>
            <div className="mb-1 text-3xl font-bold text-navy">
              {dictionary.homepage.statGrade}
            </div>
            <div className="text-sm text-navy-glass">
              {dictionary.homepage.statGradeLabel}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
