import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/Reveal";
import type { Product } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { productPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

interface ProductShowcaseItemProps {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
  /** Position in the list — drives the alternating layout and the index label. */
  index: number;
  /** The hero product gets a taller frame, larger type and a priority image. */
  featured: boolean;
}

/**
 * One product presented as a single premium panel.
 *
 * Image and content share one bordered, rounded container so they read as a
 * unified composition rather than an image beside unrelated text. The image is
 * inset within the panel padding, which keeps the media and the copy visually
 * bound by the same frame.
 *
 * Layout direction is derived from `index` (even → image first, odd → text
 * first), so the alternating rhythm continues for any number of CMS products.
 * Server Component — only the small `Reveal` wrapper is client-side.
 */
export function ProductShowcaseItem({
  product,
  locale,
  dictionary,
  index,
  featured,
}: ProductShowcaseItemProps) {
  const imageFirst = index % 2 === 0;
  const href = productPath(locale, product.slug);
  // Image comes straight from the CMS `image` field — the same asset used by
  // the homepage and product detail pages.
  const src = product.image;
  // Featured product shows a richer spec set; secondary products stay concise.
  const specs = product.specs.slice(0, featured ? 6 : 4);

  return (
    <Reveal from="up">
      <article
        id={product.slug}
        className={cn(
          "group/panel relative scroll-mt-24 overflow-hidden rounded-3xl border bg-white transition-all duration-500 hover:-translate-y-1 border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)]  hover:shadow-card-hover",
          featured ? "border-navy/10 shadow-card" : "border-gray-200",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1 items-center gap-8 p-5 sm:p-7 lg:grid-cols-12 lg:gap-12",
            featured ? "lg:p-10" : "lg:p-8",
          )}
        >
          {/* ── Media ─────────────────────────────────────────────────── */}
          <div
            className={cn(
              featured ? "lg:col-span-7" : "lg:col-span-6",
              // Source order stays media-first; desktop swaps sides only.
              imageFirst ? "lg:order-1" : "lg:order-2",
            )}
          >
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden
              className="group/media relative block overflow-hidden rounded-2xl bg-navy"
            >
              <div
                className={cn(
                  "relative w-full",
                  featured
                    ? "aspect-[4/3] lg:aspect-[16/11]"
                    : "aspect-[4/3] lg:aspect-[3/2]",
                )}
              >
                <Image
                  src={src}
                  alt={product.imageAlt}
                  fill
                  // Hero image is the LCP candidate; the rest lazy-load.
                  priority={featured}
                  loading={featured ? undefined : "lazy"}
                  sizes={
                    featured
                      ? "(max-width: 1024px) 92vw, 52vw"
                      : "(max-width: 1024px) 92vw, 44vw"
                  }
                  className="object-cover"
                />
              </div>
            </Link>
          </div>

          {/* ── Content ───────────────────────────────────────────────── */}
          <div
            className={cn(
              featured ? "lg:col-span-5" : "lg:col-span-6",
              imageFirst ? "lg:order-2" : "lg:order-1",
            )}
          >
            {/* Eyebrow: index rule + primary/range label */}
            <div className="mb-5 flex items-center gap-3">
              <span className="text-xs font-semibold tabular-nums text-cyan-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden className="h-px w-8 bg-cyan-brand/30" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-label">
                {featured
                  ? dictionary.homepage.featuredBadge
                  : dictionary.homepage.productsHeading}
              </span>
            </div>

            <h2
              className={cn(
                "font-bold leading-tight tracking-tight text-navy",
                featured
                  ? "text-3xl sm:text-4xl lg:text-[2.6rem]"
                  : "text-2xl sm:text-3xl",
              )}
            >
              <Link
                href={href}
                className="transition-colors duration-300 hover:text-cyan-brand focus-visible:text-cyan-brand"
              >
                {product.title}
              </Link>
            </h2>

            {/* Always-visible description — never behind hover or an accordion. */}
            {product.description && (
              <p
                className={cn(
                  "mt-4 leading-relaxed text-ink",
                  featured ? "text-base sm:text-lg" : "text-base",
                )}
              >
                {product.description}
              </p>
            )}

            {/* Specifications — values come from CMS frontmatter. */}
            {specs.length > 0 && (
              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-200 pt-6">
                {specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-label">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-navy">
                      <bdi>{spec.value}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <Button
              asChild
              variant={featured ? "primary" : "outline"}
              className="mt-8"
            >
              <Link href={href}>
                {dictionary.cta.viewDetails}
                <ArrowRight
                  aria-hidden
                  data-icon="end"
                  className="h-4 w-4 rtl:rotate-180"
                />
                <span className="sr-only">— {product.title}</span>
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
