import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { contactPath, productPath } from "@/lib/i18n/routes";
import { getProducts } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface FeaturedProductProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function FeaturedProduct({
  locale,
  dictionary,
}: FeaturedProductProps) {
  const featured = getProducts(locale).find((product) => product.featured);
  if (!featured) return null;

  return (
    <section className="bg-navy-glass/5 backdrop-blur-3xl py-20 lg:py-28">
      <Container>
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-cyan-brand/10 px-4 py-2 text-sm font-semibold text-cyan-link-hover">
            {dictionary.homepage.featuredBadge}
          </span>
          <h2 className="text-3xl font-bold text-navy sm:text-4xl lg:text-5xl">
            {featured.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative h-96 overflow-hidden rounded-2xl shadow-card lg:h-125">
            {featured.image ? (
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-navy-light text-silver">
                {featured.title}
              </div>
            )}
          </div>

          <div>
            {featured.description && (
              <p className="mb-8 text-base leading-relaxed text-ink-soft sm:text-lg">
                {featured.description}
              </p>
            )}

            {/* Two spec columns need ~150px each. Below ~360px that leaves no
                room for long single words (e.g. Russian spec values), which
                then overflow the viewport — so stack to one column there. */}
            {featured.specs.length > 0 && (
              <div className="mb-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                {featured.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <Check className="mt-0.5 h-5 w-5shrink-0 text-cyan-brand" />
                    <div className="min-w-0">
                      <div className="mb-1 text-xs text-label">
                        {spec.label}
                      </div>
                      <div className="hyphens-auto wrap-break-word text-sm font-semibold text-navy">
                        <bdi>{spec.value}</bdi>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex h-25! sm:h-0 flex-col gap-4 sm:flex-row">
              <Button asChild variant="secondary" size="md" className="flex-1">
                <Link href={productPath(locale, featured.slug)}>
                  {dictionary.cta.viewFullSpecifications}
                  <ArrowRight
                    data-icon="end"
                    className="h-5 w-5 rtl:rotate-180"
                  />
                </Link>
              </Button>
              <Button asChild size="md" className="flex-1">
                <Link href={contactPath(locale, featured.slug)}>
                  {dictionary.cta.requestQuote}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
