import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import type { Product } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { contactPath } from "@/lib/i18n/routes";

interface ProductsIntroProps {
  locale: Locale;
  dictionary: Dictionary;
  products: Product[];
  /** CMS page title/description for this locale. */
  title: string;
  description?: string;
}

/**
 * Products hero — asymmetric editorial composition on Midnight Navy.
 *
 * Built as an art-directed 12-column layout rather than a centered heading:
 * an oversized headline on the left, a hairline-ruled index of the actual
 * product range on the right, and a thin metadata strip along the bottom.
 * Every value is CMS- or dictionary-derived — no invented claims.
 *
 * Server Component; the only motion is CSS on hover.
 */
export function ProductsIntro({
  locale,
  dictionary,
  products,
  title,
  description,
}: ProductsIntroProps) {
  return (
    <section className="relative overflow-hidden bg-navy">
      {/* Faint blueprint grid — establishes the industrial editorial register. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "88px 88px",
        }}
      />
      {/* Single restrained cyan bloom, anchored to the headline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -start-32 top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-brand/10 blur-[130px]"
      />

      <Container className="relative py-20 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-12">
          {/* ── Headline block ── */}
          <div className="lg:col-span-7">
            <div className="mb-7 flex items-center gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-light">
                {dictionary.nav.products}
              </span>
              <span aria-hidden className="h-px w-16 bg-cyan-light/40" />
            </div>

            <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
              {title}
            </h1>

            {description && (
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-silver">
                {description}
              </p>
            )}

            <Button asChild className="mt-9">
              <Link href={contactPath(locale)}>
                {dictionary.cta.requestQuote}
                <ArrowRight
                  aria-hidden
                  data-icon="end"
                  className="h-4 w-4 rtl:rotate-180"
                />
              </Link>
            </Button>
          </div>

          {/* ── Product index: a real table of contents for the page ── */}
          <div className="lg:col-span-5 lg:pt-3">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/60">
              {dictionary.homepage.productsHeading}
            </p>
            <ul className="border-t border-white/10">
              {products.map((product, index) => (
                <li key={product.slug}>
                  <a
                    href={`#${product.slug}`}
                    className="group flex items-baseline gap-4 border-b border-white/10 py-3.5 transition-colors duration-300 hover:bg-white/4 px-3 "
                  >
                    <span className="text-[11px] font-semibold tabular-nums text-cyan-light/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm font-medium text-white/85 transition-colors duration-300 group-hover:text-white">
                      {product.title}
                    </span>
                    {product.featured && (
                      <span className="rounded-full border border-cyan-light/30 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-light">
                        {dictionary.homepage.featuredBadge}
                      </span>
                    )}
                    <ArrowRight
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 text-cyan-light opacity-0 transition-all duration-300 group-hover:opacity-100 rtl:rotate-180"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Metadata strip: verified dictionary values only ── */}
        <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-8 sm:grid-cols-4 lg:mt-20">
          {[
            {
              t: dictionary.homepage.statIqf,
              d: dictionary.homepage.statIqfLabel,
            },
            {
              t: dictionary.homepage.statColdChain,
              d: dictionary.homepage.statColdChainLabel,
            },
            {
              t: dictionary.homepage.statGrade,
              d: dictionary.homepage.statGradeLabel,
            },
            {
              t: String(products.length),
              d: dictionary.homepage.productsHeading,
            },
          ].map((stat) => (
            <div key={stat.d}>
              <dt className="text-xl font-bold text-white sm:text-2xl">
                {stat.t}
              </dt>
              <dd className="mt-1.5 text-[11px] uppercase leading-relaxed tracking-[0.12em] text-silver/70">
                {stat.d}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
