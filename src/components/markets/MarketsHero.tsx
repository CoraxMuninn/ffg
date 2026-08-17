import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { contactPath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Market } from "@/lib/content";

interface MarketsHeroProps {
  locale: Locale;
  dictionary: Dictionary;
  /** CMS page title — rendered as the page H1. */
  title: string;
  intro?: string;
  markets: Market[];
}

/**
 * Full-bleed Markets banner built around the export-network map.
 *
 * The map is the subject of this page, not decoration, so it runs edge-to-edge
 * at every breakpoint. It is NOT the same composition everywhere, because the
 * artwork is a 2.36:1 world map with all of its meaning — Iran, the trade
 * lanes, and the four destination labels — packed into the right-hand half.
 *
 * Viewport is the only axis that changes the composition. From `lg` there is
 * enough width to run the map as a full-height background and place the copy
 * over the empty half of the artwork, where it covers nothing. Below `lg` the
 * viewport is taller than it is wide, so any overlay would either sit on the
 * trade lanes or force an unreadable crop; there the map becomes a full-bleed
 * band in normal flow with the copy stacked beneath it. Same image, same
 * edge-to-edge treatment, recomposed for the viewport rather than shrunk.
 *
 * Text direction does NOT change this structure: every locale gets the same
 * breakpoints, the same section height, and the same image/copy positioning.
 * RTL is handled where it belongs — in CSS. The copy column simply lands on the
 * right, and `.markets-hero-scrim` (globals.css) already mirrors its gradient
 * under dir="rtl" so the readability wash stays behind the copy.
 *
 * `object-position` additionally tracks the corridor as the viewport narrows
 * (see `.markets-hero-map` in globals.css).
 *
 * The site header is fixed and transparent until scroll, so top padding clears
 * it explicitly at every breakpoint.
 */
export function MarketsHero({
  locale,
  dictionary,
  title,
  intro,
  markets,
}: MarketsHeroProps) {
  const primary = markets.find((market) => market.primary);

  return (
    <section className="relative isolate w-full overflow-hidden bg-navy">
      {/* ── Map layer ──
          In flow below `lg` (aspect-ratio band), absolute background from `lg`. */}
      <div className="relative aspect-[5/4] w-full min-[420px]:aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <Image
          src="/media/markets/feiz-food-group-global-export-network-map.jpg"
          alt={dictionary.imageAlt.marketsMap}
          fill
          priority
          quality={90}
          sizes="100vw"
          className="markets-hero-map object-cover"
        />

        {/* Mobile/tablet: fade the band's lower edge into the navy copy block so
            the banner and the text read as one surface. Disabled from `lg`,
            where the full-height scrims below take over. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy to-transparent lg:hidden"
        />
        {/* Top edge only: keeps the floating header legible over the artwork. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-navy/80 to-transparent lg:h-32"
        />

        {/* Desktop readability scrims. Kept light and directional so the cyan
            arcs and the country labels in the artwork are never washed out. */}
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-gradient-to-t from-navy/90 via-navy/20 to-transparent lg:block"
        />
        <div
          aria-hidden
          className="markets-hero-scrim absolute inset-0 hidden lg:block"
        />
      </div>

      {/* ── Copy layer ── */}
      <Container className="relative flex flex-col justify-end pb-12 pt-10 sm:pb-14 sm:pt-12 lg:min-h-[88svh] lg:pb-20 lg:pt-40">
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-light sm:text-[11px]">
              {dictionary.markets.networkEyebrow}
            </span>
            <span aria-hidden className="h-px w-10 bg-cyan-light/40 sm:w-16" />
          </div>

          <h1 className="text-[1.9rem] font-bold leading-[1.1] tracking-tight text-white min-[420px]:text-[2.25rem] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {intro && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-silver sm:mt-6 sm:text-lg">
              {intro}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
            <Button asChild>
              <Link href={contactPath(locale)}>
                {dictionary.cta.requestQuote}
                <ArrowRight
                  aria-hidden
                  data-icon="end"
                  className="h-4 w-4 rtl:rotate-180"
                />
              </Link>
            </Button>
            {primary && (
              <Button asChild variant="outline-inverse">
                <a href={`#${primary.slug}`}>
                  {primary.title}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-light">
                    {dictionary.markets.primaryLabel}
                  </span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* ── Legend strip: the four destinations, drawn from the CMS ── */}
        <div className="mt-10 border-t border-white/12 pt-6 sm:mt-12 lg:mt-16">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-10">
            <li className="sm:min-w-[7rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-silver/60">
                {dictionary.markets.exportOrigin}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-white">
                {dictionary.markets.originCountry}
              </p>
            </li>
            {markets.map((market) => (
              <li key={market.slug} className="sm:min-w-[7rem]">
                <a href={`#${market.slug}`} className="group block">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-silver/60">
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        market.primary ? "bg-cyan-light" : "bg-silver/50"
                      }`}
                    />
                    {market.primary
                      ? dictionary.markets.primaryLabel
                      : dictionary.markets.targetLabel}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-white transition-colors duration-200 group-hover:text-cyan-light">
                    {market.title}
                  </p>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-silver/70">
            {dictionary.markets.networkCaption}
          </p>
        </div>
      </Container>
    </section>
  );
}
