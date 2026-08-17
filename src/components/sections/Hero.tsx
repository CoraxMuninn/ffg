import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { contactPath, productsPath } from "@/lib/i18n/routes";
import { getPageContent } from "@/lib/content";

interface HeroProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function Hero({ locale, dictionary }: HeroProps) {
  const home = getPageContent(locale, "home");

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/media/hero/cargo-ship-wide.jpg"
          alt={dictionary.imageAlt.hero}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/70 to-navy/30" />
      </div>

      <div className="relative z-10 w-full">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              {home?.title ?? dictionary.brand}
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-silver sm:text-xl">
              {home?.description ?? dictionary.meta.description}
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href={contactPath(locale)}>
                  {dictionary.cta.requestQuote}
                  <ArrowRight data-icon="end" className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline-inverse">
                <Link href={productsPath(locale)}>
                  <Package className="h-5 w-5" />
                  {dictionary.cta.viewProducts}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
