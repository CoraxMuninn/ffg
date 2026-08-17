import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Prose } from "@/components/shared/Prose";
import { contactPath, marketPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Market } from "@/lib/content";

interface MarketPanelProps {
  market: Market;
  locale: Locale;
  dictionary: Dictionary;
  /**
   * Position in the rendered list. Drives two things and nothing else:
   * the alternating image side, and LCP priority for the first panel.
   */
  index: number;
}

/**
 * One destination market, rendered as an editorial panel.
 *
 * Every market uses the same structure. Vietnam retains the primary midnight
 * treatment, while the three secondary destinations use a light surface.
 * Content (region, buyer focus, document types, body copy) still comes from the
 * `markets` collection, so the CMS stays the single source of truth.
 *
 * The only thing that varies between panels is the horizontal order of image
 * and content, derived from `index`:
 *
 *   even index → image start / content end
 *   odd  index → image end   / content start
 *
 * Below `lg` the grid collapses to a single column and the source order
 * (image, then content) applies to every market, so the alternation never
 * survives into the mobile layout.
 *
 * Note on RTL: `order` is physical, but a grid in `dir="rtl"` lays its tracks
 * right-to-left, so the image lands on the reading-start side in both
 * directions. The image scrim is direction-aware to match
 * (see `.market-panel-scrim` in globals.css).
 */
export function MarketPanel({
  market,
  locale,
  dictionary,
  index,
}: MarketPanelProps) {
  // Even panels lead with the image on the reading-start side.
  const imageFirst = index % 2 === 0;
  // Prefer the wide editorial image; fall back to the card image so a market
  // without `panelImage` set in the CMS still renders.
  const panelImage = market.panelImage || market.image;
  const hasLightTreatment = ["uae", "russia", "thailand"].includes(market.slug);

  return (
    <article
      id={market.slug}
      className={cn(
        // `group` drives the hover treatment: image zoom, cyan border lift, and
        // a small elevation. Transitions are transform/shadow/border only, so
        // the whole effect stays on the compositor. `motion-reduce` variants
        // drop the movement for users who ask for it.
        "group scroll-mt-24 overflow-hidden rounded-2xl transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl",
        "hover:-translate-y-1 transition-all duration-500 motion-reduce:hover:translate-y-0 motion-reduce:transition-none",
        hasLightTreatment
          ? "border border-navy/10 shadow-card hover:border-cyan-brand/40 hover:shadow-[0_28px_60px_-24px_rgba(10,22,40,0.28)] motion-reduce:hover:scale-100"
          : "border border-cyan-brand/25 bg-navy shadow-card-hover hover:border-cyan-brand/60 hover:shadow-[0_28px_60px_-24px_rgba(8,145,178,0.45)]",
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* ── Image ── */}
        <div
          className={cn(
            "relative h-48 overflow-hidden sm:h-60 lg:col-span-5 lg:h-auto lg:min-h-[24rem]",
            imageFirst ? "lg:order-1" : "lg:order-2",
          )}
        >
          {panelImage ? (
            <Image
              src={panelImage}
              alt={market.panelImageAlt || market.imageAlt}
              fill
              priority={index === 0}
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:group-hover:scale-100 motion-reduce:transition-none"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-navy-light text-silver">
              {market.title}
            </div>
          )}

          {/* Blends the image into the navy content panel. Vertical on mobile
              (content sits below); horizontal from `lg`, fading toward
              whichever side the content is on. */}

          {/* Hover-only glass sheen. A very low-opacity white wash plus a cyan
              edge tint — enough to register as a state change without lifting
              the image out of the midnight-navy palette. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-cyan-brand/12 via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
          />

          {/* Status marker. Rendered only for the primary market because that
              is a fact about the data, not a style variant — the badge itself
              is identical wherever it appears. */}
          {market.primary && (
            <span className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:start-6 sm:top-6">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-cyan-light"
              />
              {dictionary.markets.primaryLabel}
            </span>
          )}
        </div>

        {/* ── Content ── */}
        <div
          className={cn(
            "p-5 sm:p-6 lg:col-span-7 lg:p-8",
            imageFirst ? "lg:order-2" : "lg:order-1",
          )}
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2
              className={cn(
                "text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl",
                hasLightTreatment ? "text-navy" : "text-white",
              )}
            >
              {/* Links to the market's own page. Kept inside the heading so the
                  accessible name stays the country, and so the panel's hover
                  treatment is unchanged. */}
              <Link
                href={marketPath(locale, market.slug)}
                className={cn(
                  "rounded transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4",
                  hasLightTreatment
                    ? "hover:text-cyan-brand focus-visible:ring-cyan-brand focus-visible:ring-offset-white"
                    : "hover:text-cyan-light focus-visible:ring-cyan-light focus-visible:ring-offset-navy",
                )}
              >
                {market.title}
              </Link>
            </h2>
            {market.region && (
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.18em]",
                  hasLightTreatment ? "text-cyan-brand" : "text-cyan-light",
                )}
              >
                {market.region}
              </span>
            )}
          </div>

          {/* The condensed body restates the description almost verbatim, so
              only one of the two is rendered. `description` still does its job
              elsewhere (page metadata, the About page market grid). */}
          {!market.body && market.description && (
            <p
              className={cn(
                "mt-2.5 max-w-2xl text-base leading-relaxed",
                hasLightTreatment ? "text-ink" : "text-silver",
              )}
            >
              {market.description}
            </p>
          )}

          {market.body && (
            <div className="mt-2.5 max-w-2xl">
              <Prose
                content={market.body}
                locale={locale}
                demoteHeadings
                className={hasLightTreatment ? undefined : "markets-prose-dark"}
              />
            </div>
          )}

          {(market.focus.length > 0 || market.documents.length > 0) && (
            <div
              className={cn(
                "mt-5 grid grid-cols-1 gap-5 border-t pt-5 sm:gap-6 md:grid-cols-2",
                hasLightTreatment ? "border-navy/10" : "border-white/12",
              )}
            >
              {market.focus.length > 0 && (
                <div>
                  <h3
                    className={cn(
                      "mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]",
                      hasLightTreatment ? "text-cyan-brand" : "text-cyan-light",
                    )}
                  >
                    {dictionary.markets.focusHeading}
                  </h3>
                  <ul className="space-y-2">
                    {market.focus.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <Check
                          aria-hidden
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            hasLightTreatment
                              ? "text-cyan-brand"
                              : "text-cyan-light",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm leading-relaxed",
                            hasLightTreatment ? "text-ink" : "text-silver",
                          )}
                        >
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {market.documents.length > 0 && (
                <div>
                  <h3
                    className={cn(
                      "mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]",
                      hasLightTreatment ? "text-cyan-brand" : "text-cyan-light",
                    )}
                  >
                    {dictionary.markets.documentsHeading}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {market.documents.map((document) => (
                      <li
                        key={document}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                          hasLightTreatment
                            ? "border-navy/10 bg-smoke text-navy"
                            : "border-white/15 bg-white/8 text-white/85",
                        )}
                      >
                        <FileText
                          aria-hidden
                          className="h-3.5 w-3.5 shrink-0 opacity-70"
                        />
                        {document}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button asChild size="sm" className="mt-5">
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
      </div>
    </article>
  );
}
